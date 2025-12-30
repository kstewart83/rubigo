//! Extraction utilities for parsing spec content
//!
//! Provides functions to extract frontmatter, code blocks, and test vectors
//! from markdown specification files.

use crate::types::{SpecMeta, SpecType};

/// Parse YAML frontmatter from markdown content
/// Frontmatter is enclosed in --- markers at the start of the file
pub fn parse_frontmatter(content: &str) -> (SpecMeta, &str) {
    let content = content.trim_start();

    if !content.starts_with("---") {
        return (SpecMeta::default(), content);
    }

    // Find the closing ---
    let after_first = &content[3..];
    if let Some(end_pos) = after_first.find("\n---") {
        let frontmatter = &after_first[..end_pos];
        let rest = &after_first[end_pos + 4..]; // Skip \n---

        let mut meta = SpecMeta::default();

        for line in frontmatter.lines() {
            let line = line.trim();
            if line.starts_with("type:") {
                let value = line.trim_start_matches("type:").trim();
                meta.spec_type = SpecType::from_str(value);
            } else if line.starts_with("description:") {
                let value = line.trim_start_matches("description:").trim();
                meta.description = Some(value.to_string());
            }
        }

        return (meta, rest);
    }

    (SpecMeta::default(), content)
}

/// Extract ```cue code blocks from markdown, keyed by preceding header
pub fn extract_cue_blocks(content: &str) -> Vec<(String, String)> {
    let mut blocks = Vec::new();
    let mut in_cue_block = false;
    let mut current_block = String::new();
    let mut block_index = 0;
    let mut last_header = String::new();

    for line in content.lines() {
        if line.starts_with("## ") || line.starts_with("### ") {
            last_header = line.trim_start_matches('#').trim().to_string();
        }

        if line.trim() == "```cue" {
            in_cue_block = true;
            current_block.clear();
            continue;
        }

        if in_cue_block && line.trim() == "```" {
            in_cue_block = false;
            let key = if !last_header.is_empty() {
                last_header.to_lowercase().replace(' ', "_")
            } else {
                format!("block_{}", block_index)
            };
            blocks.push((key, current_block.trim().to_string()));
            block_index += 1;
            continue;
        }

        if in_cue_block {
            current_block.push_str(line);
            current_block.push('\n');
        }
    }

    blocks
}

/// Extract ```quint code block from markdown (returns first block found)
pub fn extract_quint_block(content: &str) -> Option<String> {
    let mut in_quint_block = false;
    let mut quint_code = String::new();

    for line in content.lines() {
        if line.trim() == "```quint" {
            in_quint_block = true;
            quint_code.clear();
            continue;
        }

        if in_quint_block && line.trim() == "```" {
            return Some(quint_code.trim().to_string());
        }

        if in_quint_block {
            quint_code.push_str(line);
            quint_code.push('\n');
        }
    }

    None
}

/// Extract ```test-vectors block from markdown (returns first block found)
pub fn extract_test_vectors(content: &str) -> Option<String> {
    let mut in_vectors_block = false;
    let mut vectors = String::new();

    for line in content.lines() {
        if line.trim() == "```test-vectors" {
            in_vectors_block = true;
            vectors.clear();
            continue;
        }

        if in_vectors_block && line.trim() == "```" {
            return Some(vectors.trim().to_string());
        }

        if in_vectors_block {
            vectors.push_str(line);
            vectors.push('\n');
        }
    }

    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_frontmatter_extracts_type() {
        let content = "---\ntype: primitive\ndescription: A button\n---\n# Button\n";
        let (meta, rest) = parse_frontmatter(content);
        assert_eq!(meta.spec_type, SpecType::Primitive);
        assert_eq!(meta.description, Some("A button".to_string()));
        assert!(rest.contains("# Button"));
    }

    #[test]
    fn parse_frontmatter_handles_missing() {
        let content = "# No frontmatter\nContent here";
        let (meta, rest) = parse_frontmatter(content);
        assert_eq!(meta.spec_type, SpecType::Primitive); // default
        assert!(rest.contains("# No frontmatter"));
    }

    #[test]
    fn extract_quint_block_returns_first() {
        let content = r#"
# Spec
```quint
module test {
  var x: int
}
```
Some text
```quint
module other {}
```
"#;
        let block = extract_quint_block(content).unwrap();
        assert!(block.contains("module test"));
        assert!(!block.contains("module other"));
    }

    #[test]
    fn extract_quint_block_returns_none_if_missing() {
        let content = "# No quint here\nJust text";
        assert!(extract_quint_block(content).is_none());
    }

    #[test]
    fn extract_cue_blocks_keys_by_header() {
        let content = r#"
## Context Schema
```cue
#Context: { value: int }
```

## State Machine
```cue
states: idle: {}
```
"#;
        let blocks = extract_cue_blocks(content);
        assert_eq!(blocks.len(), 2);
        assert_eq!(blocks[0].0, "context_schema");
        assert_eq!(blocks[1].0, "state_machine");
    }

    #[test]
    fn extract_test_vectors_returns_content() {
        let content = r#"
## Test Vectors
```test-vectors
- scenario: focus when enabled
  given:
    state: idle
  when: FOCUS
  then:
    state: focused
```
"#;
        let vectors = extract_test_vectors(content).unwrap();
        assert!(vectors.contains("scenario: focus when enabled"));
    }
}
