//! Validation utilities for spec and Quint model checking
//!
//! Provides functions to validate markdown spec structure and
//! Quint formal models have required elements.

use crate::types::SpecType;
use std::collections::HashSet;

/// Validate spec markdown structure
///
/// Checks based on spec type:
/// 1. H1 title exists
/// 2. Required H2 sections exist (with fuzzy matching for typos)
/// 3. Each required section has ```cue block (not json/yaml)
/// 4. Forbidden sections are not present (for presentational/schema types)
pub fn validate_spec_structure(content: &str, spec_type: SpecType) -> Result<(), Vec<String>> {
    let mut errors = Vec::new();

    let required_sections = spec_type.required_sections();
    let cue_required_sections = spec_type.sections_requiring_cue();
    let forbidden_sections = spec_type.forbidden_sections();

    // Track what we find
    let mut found_h1 = false;
    let mut current_h2: Option<String> = None;
    let mut sections_with_cue: HashSet<String> = HashSet::new();
    let mut sections_with_wrong_block: Vec<(String, String)> = Vec::new();
    let mut found_sections: HashSet<String> = HashSet::new();

    for line in content.lines() {
        if line.starts_with("# ") && !line.starts_with("## ") {
            found_h1 = true;
        } else if line.starts_with("## ") {
            let section = line.trim_start_matches("## ").trim();
            current_h2 = Some(section.to_string());
            found_sections.insert(section.to_string());
        } else if line.trim() == "```cue" {
            if let Some(ref section) = current_h2 {
                sections_with_cue.insert(section.clone());
            }
        } else if line.trim().starts_with("```") && line.trim() != "```" {
            let block_type = line.trim().trim_start_matches("```").trim();
            if let Some(ref section) = current_h2 {
                if cue_required_sections.contains(&section.as_str()) && block_type != "cue" {
                    sections_with_wrong_block.push((section.clone(), block_type.to_string()));
                }
            }
        }
    }

    // Check H1 exists
    if !found_h1 {
        errors.push("Missing H1 title".to_string());
    }

    // Check for forbidden sections
    for &forbidden in forbidden_sections {
        if found_sections.contains(forbidden) {
            errors.push(format!(
                "Section '{}' is not allowed for {:?} specs",
                forbidden, spec_type
            ));
        }
    }

    // Check required sections exist
    for &required in required_sections {
        if !found_sections.contains(required) {
            let suggestion = find_similar_section(&found_sections, required);
            if let Some(similar) = suggestion {
                errors.push(format!(
                    "Missing required section '{}' (did you mean '{}'?)",
                    required, similar
                ));
            } else {
                errors.push(format!("Missing required section: {}", required));
            }
        }
    }

    // Check cue blocks only for sections that require them
    for &required in cue_required_sections {
        if found_sections.contains(required) && !sections_with_cue.contains(required) {
            let wrong_type = sections_with_wrong_block
                .iter()
                .find(|(s, _)| s == required)
                .map(|(_, t)| t.as_str());

            if let Some(bad_type) = wrong_type {
                errors.push(format!(
                    "Section '{}' uses wrong block type '{}', expected 'cue'",
                    required, bad_type
                ));
            } else {
                errors.push(format!("Section '{}' missing ```cue block", required));
            }
        }
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(errors)
    }
}

/// Validate Quint model has required elements for ITF generation
pub fn validate_quint_model(spec_name: &str, quint_code: &str) -> Vec<String> {
    let mut errors = Vec::new();

    // 1. Check module declaration
    let module_pattern = format!("module {}", spec_name);
    if !quint_code.contains(&module_pattern) {
        errors.push(format!(
            "Missing 'module {} {{ ... }}' declaration",
            spec_name
        ));
    }

    // 2. Check for var declarations
    if !quint_code.contains("var ") {
        errors.push("Missing state variable declarations (var)".into());
    }

    // 3. Check for action init
    if !quint_code.contains("action init") {
        errors.push("Missing 'action init' for initial state".into());
    }

    // 4. Check for action step (required for quint run)
    if !quint_code.contains("action step") {
        errors.push("Missing 'action step' (required for 'quint run' to generate traces)".into());
    }

    // 5. Check for _action variable (required for ITF trace event names)
    if !quint_code.contains("var _action: str") && !quint_code.contains("var _action:str") {
        errors.push(
            "Missing 'var _action: str' (required for ITF traces to include action names)".into(),
        );
    }

    // 6. Check for _state or state variable (required for ITF trace state tracking)
    let has_state_var = quint_code.contains("var _state: str")
        || quint_code.contains("var _state:str")
        || quint_code.contains("var state: str")
        || quint_code.contains("var state:str");
    if !has_state_var {
        errors
            .push("Missing 'var _state: str' or 'var state: str' (required for ITF traces)".into());
    }

    // 7. Check for invariants (val with some condition)
    if !quint_code.contains("val ") {
        errors.push("Missing invariant definitions (val)".into());
    }

    errors
}

/// Find a section name that's similar to the required one (fuzzy match)
fn find_similar_section(found: &HashSet<String>, target: &str) -> Option<String> {
    let target_lower = target.to_lowercase();
    let target_words: HashSet<&str> = target_lower.split_whitespace().collect();

    for section in found {
        let section_lower = section.to_lowercase();
        let section_words: HashSet<&str> = section_lower.split_whitespace().collect();
        let common: HashSet<_> = target_words.intersection(&section_words).collect();

        if !common.is_empty() && common.len() >= target_words.len() / 2 {
            return Some(section.clone());
        }

        // Common substitutions
        if (target == "State Machine" && section.contains("Machine"))
            || (target == "Context Schema" && section.contains("Context"))
            || (target == "Guards" && section.contains("Guard"))
            || (target == "Actions" && section.contains("Action"))
        {
            return Some(section.clone());
        }
    }
    None
}

/// Convert section name to CUE key
#[allow(dead_code)]
pub fn section_key(section: &str) -> &str {
    match section {
        "Context Schema" => "context",
        "State Machine" => "machine",
        "Guards" => "guards",
        "Actions" => "actions",
        _ => "config",
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validate_primitive_requires_all_sections() {
        let content = "# Button\n## Context Schema\n```cue\n{}\n```";
        let result = validate_spec_structure(content, SpecType::Primitive);
        assert!(result.is_err());
        let errors = result.unwrap_err();
        assert!(errors.iter().any(|e| e.contains("State Machine")));
    }

    #[test]
    fn validate_primitive_passes_with_all_sections() {
        let content = r#"
# Button
## Context Schema
```cue
{}
```
## State Machine
```cue
{}
```
## Guards
```cue
{}
```
## Actions
```cue
{}
```
"#;
        assert!(validate_spec_structure(content, SpecType::Primitive).is_ok());
    }

    #[test]
    fn validate_presentational_forbids_statechart() {
        let content =
            "# Card\n## Design Guidelines\nSome design\n## State Machine\n```cue\n{}\n```";
        let result = validate_spec_structure(content, SpecType::Presentational);
        assert!(result.is_err());
        let errors = result.unwrap_err();
        assert!(errors.iter().any(|e| e.contains("not allowed")));
    }

    #[test]
    fn validate_quint_requires_module() {
        let quint = "var x: int\naction init = x' = 0";
        let errors = validate_quint_model("button", quint);
        assert!(errors.iter().any(|e| e.contains("module button")));
    }

    #[test]
    fn validate_quint_requires_state_var() {
        let quint = r#"
module test {
  var disabled: bool
  var _action: str
  action init = all { disabled' = false, _action' = "init" }
  action step = init
  val inv = true
}
"#;
        let errors = validate_quint_model("test", quint);
        assert!(errors
            .iter()
            .any(|e| e.contains("_state") || e.contains("state")));
    }

    #[test]
    fn validate_quint_accepts_state_or_underscore_state() {
        let quint_with_state = r#"
module test {
  var state: str
  var _action: str
  action init = all { state' = "idle", _action' = "init" }
  action step = init
  val inv = true
}
"#;
        let errors = validate_quint_model("test", quint_with_state);
        assert!(!errors
            .iter()
            .any(|e| e.contains("_state") || e.contains("state:")));
    }
}
