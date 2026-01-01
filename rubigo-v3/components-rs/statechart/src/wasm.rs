//! WASM bindings for the statechart interpreter
//!
//! Exposes `WasmMachine` to JavaScript with:
//! - `from_json(config)` - Create from JSON string
//! - `send(event_name)` - Send an event
//! - `current_state()` - Get current state
//! - `get_context()` - Get context as JSON
//! - `set_context_bool(key, value)` - Set boolean context value

use crate::machine::Machine;
use crate::types::{Event, MachineConfig};
use wasm_bindgen::prelude::*;

/// WASM-compatible wrapper for Machine
#[wasm_bindgen]
pub struct WasmMachine {
    inner: Machine,
    /// Guards configuration from the JSON (expression strings)
    guards: std::collections::HashMap<String, String>,
    /// Actions configuration from the JSON (mutation strings)  
    actions: std::collections::HashMap<String, ActionConfig>,
}

/// Action configuration from spec
#[derive(Debug, Clone)]
struct ActionConfig {
    mutation: Option<String>,
    #[allow(dead_code)]
    emits: Vec<String>,
}

#[wasm_bindgen]
impl WasmMachine {
    /// Create a new WasmMachine from a JSON configuration string
    #[wasm_bindgen(constructor)]
    pub fn from_json(json_config: &str) -> Result<WasmMachine, JsError> {
        // Parse the full config including guards/actions
        let full_config: serde_json::Value = serde_json::from_str(json_config)
            .map_err(|e| JsError::new(&format!("Failed to parse JSON: {}", e)))?;

        // Extract guards
        let guards = Self::extract_guards(&full_config);

        // Extract actions
        let actions = Self::extract_actions(&full_config);

        // Parse machine config
        let machine_value = if full_config.get("machine").is_some() {
            // Nested structure: { machine: {...}, guards: {...}, actions: {...} }
            full_config.get("machine").unwrap().clone()
        } else {
            // Flat structure: config IS the machine
            full_config.clone()
        };

        let config: MachineConfig = serde_json::from_value(machine_value)
            .map_err(|e| JsError::new(&format!("Failed to parse machine config: {}", e)))?;

        Ok(WasmMachine {
            inner: Machine::from_config(config),
            guards,
            actions,
        })
    }

    /// Extract guards from JSON config
    fn extract_guards(config: &serde_json::Value) -> std::collections::HashMap<String, String> {
        let mut guards = std::collections::HashMap::new();
        if let Some(guards_obj) = config.get("guards").and_then(|g| g.as_object()) {
            for (name, expr) in guards_obj {
                if let Some(s) = expr.as_str() {
                    guards.insert(name.clone(), s.to_string());
                }
            }
        }
        guards
    }

    /// Extract actions from JSON config
    fn extract_actions(
        config: &serde_json::Value,
    ) -> std::collections::HashMap<String, ActionConfig> {
        let mut actions = std::collections::HashMap::new();
        if let Some(actions_obj) = config.get("actions").and_then(|a| a.as_object()) {
            for (name, action_def) in actions_obj {
                let mutation = action_def
                    .get("mutation")
                    .and_then(|m| m.as_str())
                    .map(|s| s.to_string());
                let emits = action_def
                    .get("emits")
                    .and_then(|e| e.as_array())
                    .map(|arr| {
                        arr.iter()
                            .filter_map(|v| v.as_str().map(|s| s.to_string()))
                            .collect()
                    })
                    .unwrap_or_default();
                actions.insert(name.clone(), ActionConfig { mutation, emits });
            }
        }
        actions
    }

    /// Send an event to the machine and return the result as JSON
    pub fn send(&mut self, event_name: &str) -> Result<JsValue, JsError> {
        self.send_with_payload(event_name, JsValue::NULL)
    }

    /// Send an event with payload to the machine and return the result as JSON
    #[wasm_bindgen(js_name = "sendWithPayload")]
    pub fn send_with_payload(
        &mut self,
        event_name: &str,
        payload_js: JsValue,
    ) -> Result<JsValue, JsError> {
        // Parse payload from JS
        let payload = if payload_js.is_null() || payload_js.is_undefined() {
            serde_json::Value::Null
        } else {
            serde_wasm_bindgen::from_value(payload_js).unwrap_or(serde_json::Value::Null)
        };

        let event = Event {
            name: event_name.to_string(),
            payload: payload.clone(),
        };

        // Get context for guard evaluation
        let context = self.inner.context.clone();
        let guards = self.guards.clone();

        // Evaluate guards using context
        let result = self.inner.send_with_guards(event, |guard_name| {
            if let Some(expr) = guards.get(guard_name) {
                evaluate_guard_expression(expr, &context)
            } else {
                true // No guard defined = allow
            }
        });

        // Execute action mutations with payload
        for action_name in &result.actions {
            if let Some(action_config) = self.actions.get(action_name) {
                if let Some(mutation) = &action_config.mutation {
                    execute_mutation(mutation, &mut self.inner.context, &payload);
                }
            }
        }

        // Convert result to JS using direct object construction (serde_wasm_bindgen has issues with serde_json::Value)
        let js_result = js_sys::Object::new();
        js_sys::Reflect::set(
            &js_result,
            &"handled".into(),
            &JsValue::from(result.handled),
        )
        .map_err(|_| JsError::new("Failed to set handled"))?;

        // Convert actions array
        let actions_array = js_sys::Array::new();
        for action in &result.actions {
            actions_array.push(&JsValue::from(action.as_str()));
        }
        js_sys::Reflect::set(&js_result, &"actions".into(), &actions_array)
            .map_err(|_| JsError::new("Failed to set actions"))?;

        // Convert newStates map
        let new_states_obj = js_sys::Object::new();
        for (key, value) in &result.new_states {
            js_sys::Reflect::set(
                &new_states_obj,
                &JsValue::from(key.as_str()),
                &JsValue::from(value.as_str()),
            )
            .map_err(|_| JsError::new("Failed to set new state"))?;
        }
        js_sys::Reflect::set(&js_result, &"newStates".into(), &new_states_obj)
            .map_err(|_| JsError::new("Failed to set newStates"))?;

        Ok(js_result.into())
    }

    /// Get the current state (for flat machines)
    #[wasm_bindgen(js_name = currentState)]
    pub fn current_state(&self) -> String {
        self.inner.current_state().unwrap_or("").to_string()
    }

    /// Get the context as a JSON string (JS should JSON.parse this)
    #[wasm_bindgen(js_name = getContextJson)]
    pub fn get_context_json(&self) -> Result<String, JsError> {
        serde_json::to_string(&self.inner.context)
            .map_err(|e| JsError::new(&format!("Failed to serialize context: {}", e)))
    }

    /// Get the context as a JS object (uses direct JS object construction)
    #[wasm_bindgen(js_name = getContext)]
    pub fn get_context(&self) -> Result<JsValue, JsError> {
        // Build JS object directly to avoid serde_wasm_bindgen issues with serde_json::Value
        let obj = js_sys::Object::new();

        if let Some(context_obj) = self.inner.context.as_object() {
            for (key, value) in context_obj {
                let js_value = match value {
                    serde_json::Value::Bool(b) => JsValue::from(*b),
                    serde_json::Value::Number(n) => {
                        if let Some(i) = n.as_i64() {
                            JsValue::from(i as f64)
                        } else if let Some(f) = n.as_f64() {
                            JsValue::from(f)
                        } else {
                            JsValue::undefined()
                        }
                    }
                    serde_json::Value::String(s) => JsValue::from(s.as_str()),
                    serde_json::Value::Null => JsValue::null(),
                    _ => JsValue::undefined(),
                };
                js_sys::Reflect::set(&obj, &JsValue::from(key.as_str()), &js_value)
                    .map_err(|_| JsError::new("Failed to set property"))?;
            }
        }

        Ok(obj.into())
    }

    /// Set a boolean value in the context
    #[wasm_bindgen(js_name = setContextBool)]
    pub fn set_context_bool(&mut self, key: &str, value: bool) {
        if let Some(obj) = self.inner.context.as_object_mut() {
            obj.insert(key.to_string(), serde_json::Value::Bool(value));
        }
    }

    /// Set a string value in the context
    #[wasm_bindgen(js_name = setContextString)]
    pub fn set_context_string(&mut self, key: &str, value: &str) {
        if let Some(obj) = self.inner.context.as_object_mut() {
            obj.insert(
                key.to_string(),
                serde_json::Value::String(value.to_string()),
            );
        }
    }

    /// Set a number value in the context
    #[wasm_bindgen(js_name = setContextNumber)]
    pub fn set_context_number(&mut self, key: &str, value: f64) {
        if let Some(obj) = self.inner.context.as_object_mut() {
            obj.insert(key.to_string(), serde_json::json!(value));
        }
    }
}

/// Evaluate a guard expression like "!context.disabled && !context.readOnly"
fn evaluate_guard_expression(expr: &str, context: &serde_json::Value) -> bool {
    // Simple parser for guard expressions
    // Supports: context.X, !, &&, ||, ===, !==, true, false

    let expr = expr.trim();

    // Handle && (AND) FIRST - lowest precedence binary operator
    // This ensures !A && !B is parsed as (!A) && (!B), not !(A && !B)
    if let Some(pos) = find_operator(expr, "&&") {
        let left = &expr[..pos];
        let right = &expr[pos + 2..];
        return evaluate_guard_expression(left, context)
            && evaluate_guard_expression(right, context);
    }

    // Handle || (OR) - also low precedence
    if let Some(pos) = find_operator(expr, "||") {
        let left = &expr[..pos];
        let right = &expr[pos + 2..];
        return evaluate_guard_expression(left, context)
            || evaluate_guard_expression(right, context);
    }

    // Handle unary negation AFTER binary operators
    if let Some(rest) = expr.strip_prefix('!') {
        return !evaluate_guard_expression(rest.trim(), context);
    }

    // Handle parentheses
    if expr.starts_with('(') && expr.ends_with(')') {
        return evaluate_guard_expression(&expr[1..expr.len() - 1], context);
    }

    // Handle === comparison
    if let Some(pos) = expr.find("===") {
        let left = expr[..pos].trim();
        let right = expr[pos + 3..].trim();
        let left_val = get_value(left, context);
        let right_val = get_value(right, context);
        return left_val == right_val;
    }

    // Handle !== comparison
    if let Some(pos) = expr.find("!==") {
        let left = expr[..pos].trim();
        let right = expr[pos + 3..].trim();
        let left_val = get_value(left, context);
        let right_val = get_value(right, context);
        return left_val != right_val;
    }

    // Simple value lookup
    get_value(expr, context).as_bool().unwrap_or(false)
}

/// Find operator position, respecting parentheses
fn find_operator(expr: &str, op: &str) -> Option<usize> {
    let mut depth = 0;
    let chars: Vec<char> = expr.chars().collect();
    let op_chars: Vec<char> = op.chars().collect();

    for i in 0..chars.len() {
        match chars[i] {
            '(' => depth += 1,
            ')' => depth -= 1,
            _ if depth == 0 => {
                if chars[i..].starts_with(&op_chars) {
                    return Some(i);
                }
            }
            _ => {}
        }
    }
    None
}

/// Get a value from an expression (context.X, true, false, literal)
fn get_value(expr: &str, context: &serde_json::Value) -> serde_json::Value {
    let expr = expr.trim();

    // Boolean literals
    if expr == "true" {
        return serde_json::Value::Bool(true);
    }
    if expr == "false" {
        return serde_json::Value::Bool(false);
    }

    // Context access: context.X
    if let Some(path) = expr.strip_prefix("context.") {
        return context
            .get(path)
            .cloned()
            .unwrap_or(serde_json::Value::Null);
    }

    // String literal
    if (expr.starts_with('"') && expr.ends_with('"'))
        || (expr.starts_with('\'') && expr.ends_with('\''))
    {
        return serde_json::Value::String(expr[1..expr.len() - 1].to_string());
    }

    // Number literal
    if let Ok(n) = expr.parse::<f64>() {
        return serde_json::json!(n);
    }

    serde_json::Value::Null
}
/// Execute a mutation like "context.checked = !context.checked" or multi-statement
/// "context.checked = true; context.indeterminate = false"
fn execute_mutation(mutation: &str, context: &mut serde_json::Value, payload: &serde_json::Value) {
    // Handle multi-statement mutations separated by ';'
    for stmt in mutation.split(';') {
        let stmt = stmt.trim();
        if stmt.is_empty() {
            continue;
        }
        execute_single_mutation(stmt, context, payload);
    }
}

/// Execute a single mutation statement
fn execute_single_mutation(
    mutation: &str,
    context: &mut serde_json::Value,
    payload: &serde_json::Value,
) {
    // Parse "context.X = Y" pattern
    if let Some(eq_pos) = mutation.find('=') {
        let left = mutation[..eq_pos].trim();
        let right = mutation[eq_pos + 1..].trim();

        // Left side must be context.X
        if let Some(key) = left.strip_prefix("context.") {
            let key = key.trim();

            // Evaluate right side
            let new_value = if right == "!context.checked" || right.starts_with("!context.") {
                // Negation of context value
                let path = right.trim_start_matches("!context.");
                let current = context.get(path).and_then(|v| v.as_bool()).unwrap_or(false);
                serde_json::Value::Bool(!current)
            } else if right == "true" {
                serde_json::Value::Bool(true)
            } else if right == "false" {
                serde_json::Value::Bool(false)
            } else if let Some(path) = right.strip_prefix("context.") {
                context
                    .get(path)
                    .cloned()
                    .unwrap_or(serde_json::Value::Null)
            } else if let Some(path) = right.strip_prefix("event.payload.") {
                // Handle event.payload.X references
                payload
                    .get(path)
                    .cloned()
                    .unwrap_or(serde_json::Value::Null)
            } else {
                get_value(right, context)
            };

            if let Some(obj) = context.as_object_mut() {
                obj.insert(key.to_string(), new_value);
            }
        }
    }
}
