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

/// Extract TypeScript interface from ## Component API section
/// Returns the content between ```typescript and ``` fences within that section
pub fn extract_component_api_typescript(content: &str) -> Option<String> {
    let mut in_api_section = false;
    let mut in_ts_block = false;
    let mut typescript = String::new();

    for line in content.lines() {
        if line.trim() == "## Component API" {
            in_api_section = true;
            continue;
        }

        // Exit Component API section when we hit the next ## header
        if in_api_section && line.starts_with("## ") {
            in_api_section = false;
            continue;
        }

        if in_api_section && line.trim() == "```typescript" {
            in_ts_block = true;
            typescript.clear();
            continue;
        }

        if in_api_section && in_ts_block && line.trim() == "```" {
            return Some(typescript.trim().to_string());
        }

        if in_api_section && in_ts_block {
            typescript.push_str(line);
            typescript.push('\n');
        }
    }

    None
}

/// Extract version number from cue version output
/// "cue version v0.15.1" -> "0.15.1"
pub fn extract_cue_version(output: &str) -> Option<String> {
    output
        .lines()
        .next()
        .and_then(|line| line.split_whitespace().nth(2))
        .map(|v| v.trim_start_matches('v').to_string())
}

/// Generate a .types.ts file from the extracted Component API TypeScript
/// Returns the file content ready to be written
pub fn generate_types_file(component_name: &str, typescript_interface: &str) -> String {
    // Extract interface name from the TypeScript content
    let interface_name = extract_interface_name(typescript_interface)
        .unwrap_or_else(|| format!("{}Props", capitalize_first(component_name)));

    format!(
        r#"// Auto-generated from {}.sudo.md – do not edit
// Framework-agnostic types; override Slot in your component

type Slot = unknown;

{}

export type {{ {} }};
"#,
        component_name, typescript_interface, interface_name
    )
}

/// Extract interface name from TypeScript interface definition
fn extract_interface_name(typescript: &str) -> Option<String> {
    for line in typescript.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("interface ") {
            // "interface FooProps {" -> "FooProps"
            return trimmed
                .strip_prefix("interface ")
                .and_then(|rest| rest.split_whitespace().next())
                .map(|s| s.trim_end_matches('{').trim().to_string());
        }
    }
    None
}

/// Metadata for a single prop
#[derive(Debug, Clone, serde::Serialize)]
pub struct PropMeta {
    pub name: String,
    #[serde(rename = "type")]
    pub prop_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub options: Option<Vec<String>>,
    pub optional: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

/// Metadata for a component
#[derive(Debug, Clone, serde::Serialize)]
pub struct ComponentMeta {
    pub component: String,
    pub interface: String,
    pub props: Vec<PropMeta>,
}

/// Parse TypeScript interface to extract prop metadata
pub fn parse_typescript_interface(component_name: &str, typescript: &str) -> ComponentMeta {
    let interface_name = extract_interface_name(typescript)
        .unwrap_or_else(|| format!("{}Props", capitalize_first(component_name)));

    let mut props = Vec::new();
    let lines: Vec<&str> = typescript.lines().collect();
    let mut pending_jsdoc: Option<String> = None;

    for (i, line) in lines.iter().enumerate() {
        let trimmed = line.trim();

        // Capture JSDoc comments
        if trimmed.starts_with("/**") && trimmed.ends_with("*/") {
            // Single-line JSDoc: /** Description */
            pending_jsdoc = Some(
                trimmed
                    .trim_start_matches("/**")
                    .trim_end_matches("*/")
                    .trim()
                    .to_string(),
            );
            continue;
        }

        // Skip interface/export/closing lines
        if trimmed.starts_with("interface ")
            || trimmed.starts_with("export ")
            || trimmed == "}"
            || trimmed.is_empty()
        {
            continue;
        }

        // Parse prop line: "  disabled?: boolean;  // default: false"
        if let Some(prop) = parse_prop_line(trimmed, pending_jsdoc.take()) {
            props.push(prop);
        }
    }

    ComponentMeta {
        component: component_name.to_string(),
        interface: interface_name,
        props,
    }
}

fn parse_prop_line(line: &str, description: Option<String>) -> Option<PropMeta> {
    // Split off inline comment first
    let (prop_part, inline_comment) = if let Some(idx) = line.find("//") {
        (&line[..idx], Some(line[idx + 2..].trim()))
    } else {
        (line, None)
    };

    // Parse: "name?: type;" or "name: type;"
    let prop_part = prop_part.trim().trim_end_matches(';').trim();

    let (name_part, type_part) = prop_part.split_once(':')?;
    let name_part = name_part.trim();
    let type_part = type_part.trim();

    let optional = name_part.ends_with('?');
    let name = name_part.trim_end_matches('?').to_string();

    // Parse type
    let (prop_type, options) = parse_type(type_part);

    // Extract default from inline comment: "// default: value"
    let default = inline_comment.and_then(|c| {
        c.strip_prefix("default:")
            .or_else(|| c.strip_prefix("default: "))
            .map(|v| v.trim().trim_matches('"').to_string())
    });

    Some(PropMeta {
        name,
        prop_type,
        options,
        optional,
        default,
        description,
    })
}

fn parse_type(type_str: &str) -> (String, Option<Vec<String>>) {
    let type_str = type_str.trim();

    // Check for union of string literals: "primary" | "secondary" | ...
    if type_str.contains('|') && type_str.contains('"') {
        let options: Vec<String> = type_str
            .split('|')
            .map(|s| s.trim().trim_matches('"').to_string())
            .collect();
        return ("union".to_string(), Some(options));
    }

    // Check for function type: () => void
    if type_str.contains("=>") {
        return ("function".to_string(), None);
    }

    // Simple types: boolean, string, number, Slot, etc.
    (type_str.to_string(), None)
}

/// Generate JSON metadata for a component
pub fn generate_meta_json(meta: &ComponentMeta) -> String {
    serde_json::to_string_pretty(meta).unwrap_or_else(|_| "{}".to_string())
}

fn capitalize_first(s: &str) -> String {
    let mut c = s.chars();
    match c.next() {
        None => String::new(),
        Some(f) => f.to_uppercase().collect::<String>() + c.as_str(),
    }
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

    #[test]
    fn extract_cue_version_parses_version() {
        let output = "cue version v0.15.1\n\ngo version go1.21.5\n";
        assert_eq!(extract_cue_version(output), Some("0.15.1".to_string()));
    }

    #[test]
    fn extract_cue_version_handles_empty() {
        assert_eq!(extract_cue_version(""), None);
    }
}
