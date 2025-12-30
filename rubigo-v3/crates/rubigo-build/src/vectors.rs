//! Test vector utilities
//!
//! Provides functions for parsing and generating test vectors:
//! - YAML test vectors from specs
//! - ITF traces from Quint models
//! - Unified JSON format combining both sources

use serde_json::{json, Map, Value};
use std::fs;
use std::path::Path;

/// Generate unified test vectors JSON from spec test-vectors block + ITF traces
pub fn generate_unified_vectors(
    spec_name: &str,
    yaml_content: &str,
    generated_dir: &Path,
) -> Result<std::path::PathBuf, String> {
    let vectors_dir = generated_dir.join("test-vectors");
    fs::create_dir_all(&vectors_dir).map_err(|e| format!("Failed to create vectors dir: {}", e))?;

    // Parse YAML test vectors
    let yaml_scenarios = parse_test_vectors_yaml(yaml_content);

    // Load ITF traces if they exist
    let itf_file = vectors_dir.join(format!("{}.itf.json", spec_name));
    let itf_scenarios = if itf_file.exists() {
        parse_itf_trace(spec_name, &itf_file)
    } else {
        Vec::new()
    };

    // Build unified JSON structure
    let unified = json!({
        "component": spec_name,
        "generated": chrono_lite_now(),
        "sources": {
            "yaml": yaml_scenarios.len(),
            "itf": itf_scenarios.len()
        },
        "scenarios": yaml_scenarios.into_iter().chain(itf_scenarios).collect::<Vec<_>>()
    });

    let unified_file = vectors_dir.join(format!("{}.unified.json", spec_name));
    let json_str =
        serde_json::to_string_pretty(&unified).map_err(|e| format!("JSON error: {}", e))?;
    fs::write(&unified_file, json_str).map_err(|e| format!("Write error: {}", e))?;

    Ok(unified_file)
}

/// Parse YAML test vectors into scenario JSON objects
pub fn parse_test_vectors_yaml(yaml_content: &str) -> Vec<Value> {
    let mut scenarios = Vec::new();
    let mut current_scenario: Option<Map<String, Value>> = None;
    let mut in_given = false;
    let mut in_then = false;
    let mut given_context = Value::Null;
    let mut given_state = String::new();
    let mut then_context = Value::Null;
    let mut then_state = String::new();
    let mut event_name = String::new();
    let mut payload: Option<Value> = None;

    for line in yaml_content.lines() {
        let trimmed = line.trim();

        if trimmed.starts_with('#') || trimmed.is_empty() {
            continue;
        }

        if trimmed.starts_with("- scenario:") {
            // Save previous scenario
            if current_scenario.is_some() && !event_name.is_empty() {
                let mut step = json!({
                    "event": event_name,
                    "before": { "context": given_context, "state": given_state },
                    "after": { "context": then_context, "state": then_state }
                });
                if let Some(p) = &payload {
                    step["payload"] = p.clone();
                }
                let scenario_json = json!({
                    "name": current_scenario.as_ref().unwrap().get("name").and_then(|v| v.as_str()).unwrap_or(""),
                    "source": "yaml",
                    "steps": [step]
                });
                scenarios.push(scenario_json);
            }
            // Start new scenario
            let name = trimmed
                .strip_prefix("- scenario:")
                .unwrap()
                .trim()
                .trim_matches('"');
            let mut map = Map::new();
            map.insert("name".into(), Value::String(name.to_string()));
            current_scenario = Some(map);
            in_given = false;
            in_then = false;
            payload = None;
            event_name.clear();
            given_context = Value::Null;
            then_context = Value::Null;
            given_state.clear();
            then_state.clear();
        } else if trimmed.starts_with("given:") {
            in_given = true;
            in_then = false;
        } else if trimmed.starts_with("when:") {
            event_name = trimmed.strip_prefix("when:").unwrap().trim().to_uppercase();
            in_given = false;
            in_then = false;
        } else if trimmed.starts_with("payload:") {
            let payload_str = trimmed.strip_prefix("payload:").unwrap().trim();
            if let Ok(v) = parse_inline_json(payload_str) {
                payload = Some(v);
            }
            in_given = false;
            in_then = false;
        } else if trimmed.starts_with("then:") {
            in_then = true;
            in_given = false;
        } else if trimmed.starts_with("context:") {
            let ctx_str = trimmed.strip_prefix("context:").unwrap().trim();
            if let Ok(ctx) = parse_inline_json(ctx_str) {
                if in_given {
                    given_context = ctx;
                } else if in_then {
                    then_context = ctx;
                }
            }
        } else if trimmed.starts_with("state:") {
            let state = trimmed
                .strip_prefix("state:")
                .unwrap()
                .trim()
                .trim_matches('"');
            if in_given {
                given_state = state.to_string();
            } else if in_then {
                then_state = state.to_string();
            }
        }
    }

    // Don't forget the last scenario
    if current_scenario.is_some() && !event_name.is_empty() {
        let mut step = json!({
            "event": event_name,
            "before": { "context": given_context, "state": given_state },
            "after": { "context": then_context, "state": then_state }
        });
        if let Some(p) = &payload {
            step["payload"] = p.clone();
        }
        let scenario_json = json!({
            "name": current_scenario.as_ref().unwrap().get("name").and_then(|v| v.as_str()).unwrap_or(""),
            "source": "yaml",
            "steps": [step]
        });
        scenarios.push(scenario_json);
    }

    scenarios
}

/// Parse ITF trace file into scenario JSON objects
pub fn parse_itf_trace(spec_name: &str, itf_file: &Path) -> Vec<Value> {
    let content = match fs::read_to_string(itf_file) {
        Ok(c) => c,
        Err(_) => return Vec::new(),
    };

    let itf: Value = match serde_json::from_str(&content) {
        Ok(v) => v,
        Err(_) => return Vec::new(),
    };

    let states = match itf.get("states").and_then(|s| s.as_array()) {
        Some(s) => s,
        None => return Vec::new(),
    };

    if states.len() < 2 {
        return Vec::new();
    }

    let mut steps = Vec::new();
    for i in 1..states.len() {
        let before = &states[i - 1];
        let after = &states[i];

        let before_ctx = extract_itf_context(before);
        let after_ctx = extract_itf_context(after);

        let event = after
            .get("_action")
            .and_then(|v| v.as_str())
            .map(|s| s.to_uppercase())
            .unwrap_or_else(|| infer_event_from_change(&before_ctx, &after_ctx));

        let before_state = before
            .get("_state")
            .or_else(|| before.get("state"))
            .and_then(|v| v.as_str())
            .unwrap_or("idle");
        let after_state = after
            .get("_state")
            .or_else(|| after.get("state"))
            .and_then(|v| v.as_str())
            .unwrap_or("idle");

        let payload = if event == "SELECT_TAB" {
            after.get("selectedId").map(|id| json!({"id": id}))
        } else {
            None
        };

        let mut step = json!({
            "event": event,
            "before": { "context": before_ctx, "state": before_state },
            "after": { "context": after_ctx, "state": after_state }
        });

        if let Some(p) = payload {
            step.as_object_mut()
                .unwrap()
                .insert("payload".to_string(), p);
        }

        steps.push(step);
    }

    vec![json!({
        "name": format!("itf-trace-{}", spec_name),
        "source": "itf",
        "steps": steps
    })]
}

/// Parse inline JSON-like object { key: value, ... }
pub fn parse_inline_json(s: &str) -> Result<Value, ()> {
    let mut json_str = s.to_string();
    json_str = json_str
        .replace("{ ", "{")
        .replace(" }", "}")
        .replace(": ", ":");

    let mut result = String::new();
    let mut chars = json_str.chars().peekable();
    let mut in_string = false;

    while let Some(c) = chars.next() {
        if c == '"' {
            in_string = !in_string;
            result.push(c);
        } else if !in_string && (c.is_alphabetic() || c == '_') {
            let mut key = String::from(c);
            while let Some(&next) = chars.peek() {
                if next.is_alphanumeric() || next == '_' {
                    key.push(chars.next().unwrap());
                } else {
                    break;
                }
            }
            if chars.peek() == Some(&':') {
                result.push('"');
                result.push_str(&key);
                result.push('"');
            } else {
                result.push_str(&key);
            }
        } else {
            result.push(c);
        }
    }

    serde_json::from_str(&result).map_err(|_| ())
}

/// Extract context from ITF state
fn extract_itf_context(state: &Value) -> Value {
    let mut ctx = Map::new();

    for field in [
        "checked",
        "disabled",
        "readOnly",
        "focused",
        "indeterminate",
        "loading",
        "pressed",
        "selectedId",
        "focusedId",
    ] {
        if let Some(v) = state.get(field) {
            ctx.insert(field.to_string(), v.clone());
        }
    }

    Value::Object(ctx)
}

/// Infer event name from context changes
fn infer_event_from_change(before: &Value, after: &Value) -> String {
    if before.get("checked") != after.get("checked") {
        return "TOGGLE".into();
    }
    if before.get("focused") != after.get("focused") {
        let focused_after = after
            .get("focused")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);
        return if focused_after { "FOCUS" } else { "BLUR" }.into();
    }
    if before.get("pressed") != after.get("pressed") {
        let pressed_after = after
            .get("pressed")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);
        return if pressed_after {
            "PRESS_DOWN"
        } else {
            "PRESS_UP"
        }
        .into();
    }
    if before.get("loading") != after.get("loading") {
        let loading_after = after
            .get("loading")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);
        return if loading_after {
            "START_LOADING"
        } else {
            "STOP_LOADING"
        }
        .into();
    }
    if before.get("selectedId") != after.get("selectedId") {
        return "SELECT_TAB".into();
    }
    if before.get("focusedId") != after.get("focusedId") {
        return "FOCUS_NEXT".into();
    }
    if before.get("indeterminate") != after.get("indeterminate") {
        return "SET_INDETERMINATE".into();
    }
    "UNKNOWN".into()
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
    fn parse_yaml_single_scenario() {
        let yaml = r#"
- scenario: "focus when enabled"
  given:
    state: idle
    context: { disabled: false }
  when: focus
  then:
    state: focused
"#;
        let scenarios = parse_test_vectors_yaml(yaml);
        assert_eq!(scenarios.len(), 1);
        assert_eq!(scenarios[0]["name"], "focus when enabled");
        assert_eq!(scenarios[0]["source"], "yaml");
    }

    #[test]
    fn parse_yaml_with_payload() {
        let yaml = r#"
- scenario: "select tab"
  given:
    state: idle
  when: SELECT_TAB
  payload: { id: "tab-0" }
  then:
    state: idle
"#;
        let scenarios = parse_test_vectors_yaml(yaml);
        assert_eq!(scenarios.len(), 1);
        assert!(scenarios[0]["steps"][0]["payload"]["id"].as_str().is_some());
    }

    #[test]
    fn parse_inline_json_adds_quotes() {
        let result = parse_inline_json("{ disabled: false }").unwrap();
        assert_eq!(result["disabled"], false);
    }

    #[test]
    fn parse_inline_json_handles_string_values() {
        let result = parse_inline_json(r#"{ id: "tab-0" }"#).unwrap();
        assert_eq!(result["id"], "tab-0");
    }

    #[test]
    fn infer_event_toggle() {
        let before = json!({"checked": false});
        let after = json!({"checked": true});
        assert_eq!(infer_event_from_change(&before, &after), "TOGGLE");
    }

    #[test]
    fn infer_event_focus_blur() {
        let before = json!({"focused": false});
        let after = json!({"focused": true});
        assert_eq!(infer_event_from_change(&before, &after), "FOCUS");

        let before = json!({"focused": true});
        let after = json!({"focused": false});
        assert_eq!(infer_event_from_change(&before, &after), "BLUR");
    }
}
