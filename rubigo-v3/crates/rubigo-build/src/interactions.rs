//! Interactions manifest utilities
//!
//! Provides functions for generating the interactions manifest,
//! which documents events, keyboard mappings, and mouse events for each component.

use regex::Regex;
use serde_json::{json, Map, Value};
use std::fs;
use std::path::Path;

use crate::extraction::{extract_quint_block, parse_frontmatter};
use crate::types::{SpecType, SPEC_SUFFIX};

/// Generate interactions manifest from all specs
/// Outputs generated/interactions.json with events and keyboard mappings for each component
pub fn generate_interactions_manifest(
    spec_dir: &Path,
    generated_dir: &Path,
) -> Result<std::path::PathBuf, String> {
    let mut components: Map<String, Value> = Map::new();

    // Find all spec files
    if let Ok(entries) = fs::read_dir(spec_dir) {
        for entry in entries.filter_map(|e| e.ok()) {
            let path = entry.path();
            if path.is_dir() {
                if let Ok(files) = fs::read_dir(&path) {
                    for file in files.filter_map(|f| f.ok()) {
                        let file_path = file.path();
                        if file_path.to_string_lossy().ends_with(SPEC_SUFFIX) {
                            if let Ok(content) = fs::read_to_string(&file_path) {
                                let spec_name = file_path
                                    .file_stem()
                                    .and_then(|s| s.to_str())
                                    .map(|s| s.replace(".sudo", ""))
                                    .unwrap_or_default();

                                if let Some(component_info) =
                                    extract_component_interactions(&content)
                                {
                                    components.insert(spec_name, component_info);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    let manifest = json!({
        "version": "1.0",
        "generated": chrono_lite_now(),
        "components": components
    });

    let manifest_path = generated_dir.join("interactions.json");
    let json_str =
        serde_json::to_string_pretty(&manifest).map_err(|e| format!("JSON error: {}", e))?;
    fs::write(&manifest_path, json_str).map_err(|e| format!("Write error: {}", e))?;

    Ok(manifest_path)
}

/// Extract component interactions from spec content
pub fn extract_component_interactions(content: &str) -> Option<Value> {
    let (meta, _) = parse_frontmatter(content);

    // Skip presentational and schema types
    if meta.spec_type == SpecType::Presentational || meta.spec_type == SpecType::Schema {
        return None;
    }

    let mut info: Map<String, Value> = Map::new();

    let events = extract_quint_events(content);
    if !events.is_empty() {
        info.insert("events".to_string(), json!(events));
    }

    let keyboard = extract_keyboard_mappings(content);
    if !keyboard.is_empty() {
        info.insert("keyboard".to_string(), json!(keyboard));
    }

    let mouse = extract_mouse_events(content);
    if !mouse.is_empty() {
        info.insert("mouse".to_string(), json!(mouse));
    }

    if info.is_empty() {
        None
    } else {
        Some(Value::Object(info))
    }
}

/// Extract event names from Quint 'action' definitions
pub fn extract_quint_events(content: &str) -> Vec<String> {
    let mut events = Vec::new();

    if let Some(quint_code) = extract_quint_block(content) {
        let action_re = Regex::new(r"action\s+(\w+)\s*=").unwrap();
        for cap in action_re.captures_iter(&quint_code) {
            let action_name = cap.get(1).map(|m| m.as_str()).unwrap_or("");
            if action_name != "init" && action_name != "step" && !action_name.is_empty() {
                events.push(action_name.to_string());
            }
        }
    }

    events.sort();
    events.dedup();
    events
}

/// Extract keyboard mappings from "Keyboard Interaction" section
pub fn extract_keyboard_mappings(content: &str) -> Map<String, Value> {
    let mut keyboard: Map<String, Value> = Map::new();

    let section_re = Regex::new(r"(?m)^Keyboard Interaction:\s*\n((?:  - .+\n?)+)").unwrap();

    if let Some(caps) = section_re.captures(content) {
        let section_content = caps.get(1).map(|m| m.as_str()).unwrap_or("");

        let line_re = Regex::new(r"  - ([^:]+):\s*(.+)").unwrap();
        for line_cap in line_re.captures_iter(section_content) {
            let key = line_cap.get(1).map(|m| m.as_str().trim()).unwrap_or("");
            let action = line_cap.get(2).map(|m| m.as_str().trim()).unwrap_or("");

            if !key.is_empty() && !action.is_empty() {
                keyboard.insert(key.to_string(), json!(action));
            }
        }
    }

    keyboard
}

/// Extract mouse events mentioned in content
pub fn extract_mouse_events(content: &str) -> Vec<String> {
    let mut mouse_events = Vec::new();

    let patterns = [
        ("click", "click"),
        ("mousedown", "mouseDown"),
        ("mouseup", "mouseUp"),
        ("pointer_enter", "pointerEnter"),
        ("pointer_leave", "pointerLeave"),
        ("mouseleave", "mouseLeave"),
        ("mouseenter", "mouseEnter"),
        ("drag", "drag"),
        ("hover", "hover"),
    ];

    let content_lower = content.to_lowercase();
    for (pattern, name) in patterns {
        if content_lower.contains(pattern) {
            mouse_events.push(name.to_string());
        }
    }

    mouse_events.sort();
    mouse_events.dedup();
    mouse_events
}

/// Get current timestamp (simple implementation for build scripts)
fn chrono_lite_now() -> String {
    std::env::var("SOURCE_DATE_EPOCH")
        .ok()
        .unwrap_or_else(|| "2024-01-01T00:00:00Z".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extract_quint_events_finds_actions() {
        let content = r#"
```quint
module test {
  action focus = all { state' = "focused" }
  action blur = all { state' = "idle" }
  action init = all { state' = "idle" }
  action step = focus.or(blur)
}
```
"#;
        let events = extract_quint_events(content);
        assert!(events.contains(&"focus".to_string()));
        assert!(events.contains(&"blur".to_string()));
        assert!(!events.contains(&"init".to_string())); // internal
        assert!(!events.contains(&"step".to_string())); // internal
    }

    #[test]
    fn extract_mouse_events_finds_click() {
        let content = "The button responds to click events and hover states.";
        let mouse = extract_mouse_events(content);
        assert!(mouse.contains(&"click".to_string()));
        assert!(mouse.contains(&"hover".to_string()));
    }

    #[test]
    fn extract_keyboard_mappings_parses_section() {
        let content = r#"
Keyboard Interaction:
  - Space: Toggle state
  - Enter: Activate button
  - Tab: Move focus
"#;
        let keyboard = extract_keyboard_mappings(content);
        assert_eq!(keyboard.get("Space"), Some(&json!("Toggle state")));
        assert_eq!(keyboard.get("Enter"), Some(&json!("Activate button")));
    }
}
