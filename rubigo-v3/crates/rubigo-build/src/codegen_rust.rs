//! Rust Code Generation Utilities
//!
//! Generates Rust component scaffolds from specifications.
//! These scaffolds are stubs that LLMs fill in with implementation.

use regex::Regex;
use std::collections::HashMap;

/// Component naming configuration for Rust
fn rust_struct_names() -> HashMap<&'static str, &'static str> {
    let mut map = HashMap::new();
    map.insert("button", "Button");
    map.insert("checkbox", "Checkbox");
    map.insert("switch", "Switch");
    map.insert("input", "Input");
    map.insert("slider", "Slider");
    map.insert("tabs", "Tabs");
    map.insert("collapsible", "Collapsible");
    map.insert("togglegroup", "ToggleGroup");
    map.insert("tooltip", "Tooltip");
    map.insert("dialog", "Dialog");
    map.insert("select", "Select");
    map
}

/// Parsed context field from spec
#[derive(Debug, Clone)]
pub struct ContextField {
    pub name: String,
    pub default: String,
    pub comment: Option<String>,
}

/// Parsed action from spec
#[derive(Debug, Clone)]
pub struct ActionDef {
    pub name: String,
    pub description: Option<String>,
    pub mutation: Option<String>,
    pub emits: Vec<String>,
}

/// Extract context fields from spec content
pub fn extract_context_fields(content: &str) -> Vec<ContextField> {
    let mut fields = Vec::new();

    // Find Context Schema section
    let re = Regex::new(r"(?s)## Context Schema\s*```cue\s*context:\s*\{([^}]+)\}").unwrap();

    if let Some(caps) = re.captures(content) {
        let body = &caps[1];

        // Parse each field: name: value  // comment
        let field_re = Regex::new(r"(\w+):\s*(\S+)(?:\s*//\s*(.*))?").unwrap();
        for caps in field_re.captures_iter(body) {
            fields.push(ContextField {
                name: caps[1].to_string(),
                default: caps[2].to_string(),
                comment: caps.get(3).map(|m| m.as_str().to_string()),
            });
        }
    }

    fields
}

/// Extract actions from spec content
pub fn extract_actions(content: &str) -> Vec<ActionDef> {
    let mut actions = Vec::new();

    // Find Actions section
    let re = Regex::new(r"(?s)## Actions\s*```cue\s*actions:\s*\{(.+?)\n```").unwrap();

    if let Some(caps) = re.captures(content) {
        let body = &caps[1];

        // Parse each action block: actionName: { ... }
        let action_re = Regex::new(r"(\w+):\s*\{([^}]+)\}").unwrap();
        for caps in action_re.captures_iter(body) {
            let name = caps[1].to_string();
            let block = &caps[2];

            let desc_re = Regex::new(r#"description:\s*"([^"]+)""#).unwrap();
            let mut_re = Regex::new(r#"mutation:\s*"([^"]*)""#).unwrap();
            let emit_re = Regex::new(r#"emits:\s*\[([^\]]*)\]"#).unwrap();

            let description = desc_re.captures(block).map(|c| c[1].to_string());

            let mutation = mut_re
                .captures(block)
                .map(|c| c[1].to_string())
                .filter(|s| !s.is_empty());

            let emits: Vec<String> = emit_re
                .captures(block)
                .map(|c| {
                    c[1].split(',')
                        .map(|s| s.trim().trim_matches('"').to_string())
                        .filter(|s| !s.is_empty())
                        .collect()
                })
                .unwrap_or_default();

            actions.push(ActionDef {
                name,
                description,
                mutation,
                emits,
            });
        }
    }

    actions
}

/// Generate Rust component scaffold from spec
pub fn generate_rust_scaffold(component: &str, content: &str) -> String {
    let struct_name = rust_struct_names()
        .get(component)
        .copied()
        .unwrap_or(component);

    let fields = extract_context_fields(content);
    let actions = extract_actions(content);

    // Generate context struct fields
    let context_fields: String = fields
        .iter()
        .map(|f| {
            let comment = f
                .comment
                .as_ref()
                .map(|c| format!("    /// {}\n", c))
                .unwrap_or_default();
            let rust_type = if f.default == "false" || f.default == "true" {
                "bool"
            } else if f.default.parse::<i32>().is_ok() {
                "i32"
            } else {
                "String"
            };
            let field_name = to_snake_case(&f.name);
            format!("{}    pub {}: {},", comment, field_name, rust_type)
        })
        .collect::<Vec<_>>()
        .join("\n");

    // Generate context defaults
    let context_defaults: String = fields
        .iter()
        .map(|f| {
            let is_bool = f.default == "false" || f.default == "true";
            let is_int = f.default.parse::<i32>().is_ok();
            let value = if is_bool || is_int {
                f.default.clone()
            } else {
                // String type - add .to_string()
                format!("{}.to_string()", f.default)
            };
            let field_name = to_snake_case(&f.name);
            format!("            {}: {},", field_name, value)
        })
        .collect::<Vec<_>>()
        .join("\n");

    // Generate action method stubs
    let action_methods: String = actions
        .iter()
        .map(|a| {
            let doc = a
                .description
                .as_ref()
                .map(|d| format!("    /// {}\n", d))
                .unwrap_or_default();
            let mutation_comment = a
                .mutation
                .as_ref()
                .map(|m| format!("        // Mutation: {}\n", m))
                .unwrap_or_default();
            let emit_comment = if !a.emits.is_empty() {
                format!("        // Emits: {:?}\n", a.emits)
            } else {
                String::new()
            };

            format!(
                r#"{doc}    pub fn {name}(&mut self) -> bool {{
{mutation_comment}{emit_comment}        // TODO: Implement
        unimplemented!("{name}")
    }}
"#,
                doc = doc,
                name = to_snake_case(&a.name),
                mutation_comment = mutation_comment,
                emit_comment = emit_comment
            )
        })
        .collect::<Vec<_>>()
        .join("\n");

    format!(
        r#"//! {struct_name} Component Scaffold
//!
//! AUTO-GENERATED by rubigo-build - LLM fills in implementation
//!
//! This is a scaffold with method stubs. Run tests and iterate until passing.

use serde::{{Deserialize, Serialize}};
use wasm_bindgen::prelude::*;

/// {struct_name} context - the extended state (internal, not exposed to JS)
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct {struct_name}Context {{
{context_fields}
}}

impl {struct_name}Context {{
    pub fn new() -> Self {{
        Self {{
{context_defaults}
        }}
    }}
}}

/// {struct_name} component
#[wasm_bindgen]
pub struct {struct_name} {{
    context: {struct_name}Context,
    state: String,
}}

#[wasm_bindgen]
impl {struct_name} {{
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {{
        Self {{
            context: {struct_name}Context::new(),
            state: "idle".to_string(),
        }}
    }}

    // === Getters ===

    #[wasm_bindgen(getter)]
    pub fn state_name(&self) -> String {{
        self.state.clone()
    }}

    /// Get context as JSON string (for JS interop)
    #[wasm_bindgen(getter)]
    pub fn context_json(&self) -> String {{
        serde_json::to_string(&self.context).unwrap_or_default()
    }}

    // === Actions ===

{action_methods}
}}

impl Default for {struct_name} {{
    fn default() -> Self {{
        Self::new()
    }}
}}

// === Test Module ===
// Tests are in a separate file for clean separation
#[cfg(test)]
#[path = "tests.rs"]
mod tests;

fn main() {{}}
"#,
        struct_name = struct_name,
        context_fields = context_fields,
        context_defaults = context_defaults,
        action_methods = action_methods
    )
}

/// Generate component tests.rs file content
///
/// Creates a separate test file that exercises the component against spec-derived vectors.
pub fn generate_component_tests_rs(component: &str, content: &str) -> String {
    let struct_name = rust_struct_names()
        .get(component)
        .copied()
        .unwrap_or(component);

    let _fields = extract_context_fields(content);
    let actions = extract_actions(content);

    // Generate action dispatch match arms
    let action_arms: String = actions
        .iter()
        .map(|a| {
            let method_name = to_snake_case(&a.name);
            format!(
                "            \"{}\" => {{ let _ = comp.{}(); }}",
                a.name.to_uppercase(),
                method_name
            )
        })
        .collect::<Vec<_>>()
        .join("\n");

    // Note: field_assertions removed - was unused. Can add back for detailed checks.

    format!(
        r#"//! {struct_name} Component Tests
//!
//! AUTO-GENERATED by rubigo-build - tests are regenerated from spec
//! DO NOT EDIT - changes will be overwritten on next build

use super::*;

// === Basic Smoke Tests ===

#[test]
fn test_new_creates_instance() {{
    let comp = {struct_name}::new();
    assert_eq!(comp.state_name(), "idle");
}}

#[test]
fn test_default_context() {{
    let comp = {struct_name}::new();
    let ctx_json = comp.context_json();
    assert!(!ctx_json.is_empty(), "context_json should return valid JSON");
}}

// === Action Dispatch Helper ===

fn dispatch_event(comp: &mut {struct_name}, event: &str) {{
    match event {{
{action_arms}
            _ => eprintln!("Unknown event: {{}}", event),
    }}
}}

// === Spec Conformance Tests ===
// These tests exercise the component against specification-derived test vectors.
// They will FAIL with unimplemented!() until the component implementation is complete.

#[test]
fn conformance_{component}_spec() {{
    let mut comp = {struct_name}::new();
    
    // This will call the first action method, triggering unimplemented!() 
    // until the LLM implements it.
    // Once implemented, this should be replaced with full spec conformance checks.
    
    // Dispatch first event to trigger failure on unimplemented components
    let first_event = get_first_event();
    if !first_event.is_empty() {{
        dispatch_event(&mut comp, first_event);
    }}
    
    // Verify we can read context
    let ctx_json = comp.context_json();
    assert!(!ctx_json.is_empty(), "context_json should return valid JSON");
}}

/// Returns the first event for this component (used to trigger unimplemented)
fn get_first_event() -> &'static str {{
{first_event_str}
}}
"#,
        struct_name = struct_name,
        component = component,
        action_arms = action_arms,
        first_event_str = if !actions.is_empty() {
            format!("    \"{}\"", actions[0].name.to_uppercase())
        } else {
            "    \"\"".to_string()
        },
    )
}

/// Convert camelCase to snake_case
fn to_snake_case(s: &str) -> String {
    let mut result = String::new();
    for (i, c) in s.chars().enumerate() {
        if c.is_uppercase() {
            if i > 0 {
                result.push('_');
            }
            result.push(c.to_lowercase().next().unwrap());
        } else {
            result.push(c);
        }
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_context_fields() {
        let content = r#"
## Context Schema

```cue
context: {
    disabled: false   // Whether disabled
    loading:  false   // Loading state
}
```
"#;
        let fields = extract_context_fields(content);
        assert_eq!(fields.len(), 2);
        assert_eq!(fields[0].name, "disabled");
        assert_eq!(fields[0].default, "false");
    }

    #[test]
    fn test_to_snake_case() {
        assert_eq!(to_snake_case("setPressedTrue"), "set_pressed_true");
        assert_eq!(to_snake_case("triggerAction"), "trigger_action");
        assert_eq!(to_snake_case("click"), "click");
    }
}
