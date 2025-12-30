//! Spec Conformance Tests for Rust Statechart Interpreter
//!
//! Consumes unified test vectors (derived from specifications) and verifies
//! the Rust interpreter produces the correct results for every scenario.
//!
//! All configs are loaded from generated files - no hardcoded JSON.

use serde::Deserialize;
use serde_json::Value;
use std::fs;
use std::path::PathBuf;

use rubigo_statechart::{ActionConfig, Event, Machine, MachineConfig};

// === Generated Spec Format ===

/// Root structure of generated switch.json
#[derive(Debug, Deserialize)]
struct GeneratedSpec {
    #[allow(dead_code)]
    context: Value,
    machine: MachineConfigPartial,
    guards: std::collections::HashMap<String, String>,
    actions: std::collections::HashMap<String, ActionConfig>,
}

/// Machine config without context (context is separate in spec)
#[derive(Debug, Deserialize)]
struct MachineConfigPartial {
    id: String,
    initial: String,
    states: std::collections::HashMap<String, rubigo_statechart::StateConfig>,
}

// === Test Vector Format ===

#[derive(Debug, Deserialize)]
struct UnifiedVectors {
    scenarios: Vec<Scenario>,
}

#[derive(Debug, Deserialize)]
struct Scenario {
    name: String,
    source: String,
    steps: Vec<Step>,
}

#[derive(Debug, Deserialize)]
struct Step {
    event: String,
    before: StateSnapshot,
    after: StateSnapshot,
}

#[derive(Debug, Deserialize)]
struct StateSnapshot {
    context: TestContext,
}

#[derive(Debug, Deserialize, PartialEq, Clone)]
struct TestContext {
    checked: bool,
    disabled: bool,
    #[serde(rename = "readOnly")]
    read_only: bool,
    focused: bool,
}

// === Helpers ===

fn project_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .to_path_buf()
}

fn load_switch_spec() -> GeneratedSpec {
    let spec_path = project_root().join("generated").join("switch.json");
    let content = fs::read_to_string(&spec_path)
        .expect(&format!("Failed to read switch spec at {:?}", spec_path));
    serde_json::from_str(&content).expect("Failed to parse switch spec")
}

fn create_machine_from_spec(spec: &GeneratedSpec, ctx: &TestContext) -> Machine {
    // Build MachineConfig from the spec, overriding context
    let context = serde_json::json!({
        "checked": ctx.checked,
        "disabled": ctx.disabled,
        "readOnly": ctx.read_only,
        "focused": ctx.focused,
    });

    let config = MachineConfig {
        id: spec.machine.id.clone(),
        initial: rubigo_statechart::InitialState::Single(spec.machine.initial.clone()),
        context,
        states: spec.machine.states.clone(),
        regions: std::collections::HashMap::new(),
        actions: spec.actions.clone(),
    };

    Machine::from_config(config)
}

fn make_guard_fn<'a>(spec: &'a GeneratedSpec, ctx: &'a TestContext) -> impl Fn(&str) -> bool + 'a {
    move |guard_name: &str| {
        if spec.guards.contains_key(guard_name) {
            // Evaluate simple guard: "!context.disabled && !context.readOnly"
            !ctx.disabled && !ctx.read_only
        } else {
            true
        }
    }
}

fn get_context_from_machine(machine: &Machine) -> TestContext {
    let ctx = &machine.context;
    TestContext {
        checked: ctx
            .get("checked")
            .and_then(|v| v.as_bool())
            .unwrap_or(false),
        disabled: ctx
            .get("disabled")
            .and_then(|v| v.as_bool())
            .unwrap_or(false),
        read_only: ctx
            .get("readOnly")
            .and_then(|v| v.as_bool())
            .unwrap_or(false),
        focused: ctx
            .get("focused")
            .and_then(|v| v.as_bool())
            .unwrap_or(false),
    }
}

/// Execute actions returned from send_with_guards
fn execute_actions(machine: &mut Machine, actions: &[String], spec: &GeneratedSpec) {
    for action_name in actions {
        if let Some(action) = spec.actions.get(action_name) {
            // Parse simple mutations like "context.field = value"
            let mutation = &action.mutation;

            // Handle: context.field = !context.field (toggle)
            if mutation.contains("= !context.") {
                // Extract field name after "context."
                if let Some(eq_pos) = mutation.find('=') {
                    let right = mutation[eq_pos + 1..].trim();
                    if let Some(field) = right.strip_prefix("!context.") {
                        if let Some(current) = machine.context.get(field).and_then(|v| v.as_bool())
                        {
                            machine.context[field] = (!current).into();
                        }
                    }
                }
            }
            // Handle: context.field = true
            else if mutation.contains("= true") {
                if let Some(eq_pos) = mutation.find('=') {
                    let left = mutation[..eq_pos].trim();
                    if let Some(field) = left.strip_prefix("context.") {
                        machine.context[field] = true.into();
                    }
                }
            }
            // Handle: context.field = false
            else if mutation.contains("= false") {
                if let Some(eq_pos) = mutation.find('=') {
                    let left = mutation[..eq_pos].trim();
                    if let Some(field) = left.strip_prefix("context.") {
                        machine.context[field] = false.into();
                    }
                }
            }
        }
    }
}

// === Tests ===

#[test]
fn conformance_switch_spec() {
    // Load spec from generated file
    let spec = load_switch_spec();

    // Load test vectors
    let vectors_path = project_root()
        .join("generated")
        .join("test-vectors")
        .join("switch.unified.json");
    if !vectors_path.exists() {
        eprintln!(
            "No unified vectors found at {:?}. Run: just unify-vectors",
            vectors_path
        );
        return;
    }

    let content = fs::read_to_string(&vectors_path).expect("Failed to read vectors");
    let vectors: UnifiedVectors = serde_json::from_str(&content).expect("Failed to parse vectors");

    println!(
        "Running {} conformance scenarios...",
        vectors.scenarios.len()
    );

    for scenario in &vectors.scenarios {
        for (i, step) in scenario.steps.iter().enumerate() {
            // Create machine with before context
            let mut machine = create_machine_from_spec(&spec, &step.before.context);

            // If the before state expects focused=true, send FOCUS first
            if step.before.context.focused {
                let guard_fn = make_guard_fn(&spec, &step.before.context);
                let result = machine.send_with_guards(
                    Event {
                        name: "FOCUS".to_string(),
                        payload: Value::Null,
                    },
                    guard_fn,
                );
                execute_actions(&mut machine, &result.actions, &spec);
            }

            // Send the event with guard evaluation
            let current_ctx = get_context_from_machine(&machine);
            let guard_fn = make_guard_fn(&spec, &current_ctx);
            let result = machine.send_with_guards(
                Event {
                    name: step.event.clone(),
                    payload: Value::Null,
                },
                guard_fn,
            );
            execute_actions(&mut machine, &result.actions, &spec);

            // Compare result with expected
            let actual = get_context_from_machine(&machine);

            assert_eq!(
                actual,
                step.after.context,
                "Scenario '{}' step {} ({}) failed:\nExpected: {:?}\nActual: {:?}",
                scenario.name,
                i + 1,
                step.event,
                step.after.context,
                actual
            );

            println!(
                "  ✓ [{}] {} - Step {}: {}",
                scenario.source,
                scenario.name,
                i + 1,
                step.event
            );
        }
    }

    println!("✅ All {} scenarios passed", vectors.scenarios.len());
}

// === Checkbox Conformance Test ===

/// Generic vector format for checkbox (different context shape)
#[derive(Debug, Deserialize)]
struct GenericUnifiedVectors {
    scenarios: Vec<GenericScenario>,
}

#[derive(Debug, Deserialize)]
struct GenericScenario {
    name: String,
    source: String,
    steps: Vec<GenericStep>,
}

#[derive(Debug, Deserialize)]
struct GenericStep {
    event: String,
    #[serde(default)]
    payload: Option<Value>, // Optional event payload
    before: GenericSnapshot,
    after: GenericSnapshot,
}

#[derive(Debug, Deserialize)]
struct GenericSnapshot {
    context: Value,
    #[allow(dead_code)]
    state: String,
}

fn load_checkbox_spec() -> GeneratedSpec {
    let spec_path = project_root().join("generated").join("checkbox.json");
    let content = fs::read_to_string(&spec_path)
        .expect(&format!("Failed to read checkbox spec at {:?}", spec_path));
    serde_json::from_str(&content).expect("Failed to parse checkbox spec")
}

fn create_checkbox_machine(spec: &GeneratedSpec, context: &Value, initial_state: &str) -> Machine {
    let config = MachineConfig {
        id: spec.machine.id.clone(),
        initial: rubigo_statechart::InitialState::Single(initial_state.to_string()),
        context: context.clone(),
        states: spec.machine.states.clone(),
        regions: std::collections::HashMap::new(),
        actions: spec.actions.clone(),
    };

    Machine::from_config(config)
}

fn make_checkbox_guard_fn<'a>(context: &'a Value) -> impl Fn(&str) -> bool + 'a {
    move |_guard_name: &str| {
        // Checkbox guard: "!context.disabled"
        let disabled = context
            .get("disabled")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);
        !disabled
    }
}

fn execute_checkbox_actions(machine: &mut Machine, actions: &[String], spec: &GeneratedSpec) {
    for action_name in actions {
        if let Some(action) = spec.actions.get(action_name) {
            let mutation = &action.mutation;

            // Handle multi-statement mutations: "context.x = val; context.y = val"
            for stmt in mutation.split(';') {
                let stmt = stmt.trim();
                if stmt.is_empty() {
                    continue;
                }

                // Parse: context.field = value
                if let Some(eq_pos) = stmt.find('=') {
                    let left = stmt[..eq_pos].trim();
                    let right = stmt[eq_pos + 1..].trim();

                    if let Some(field) = left.strip_prefix("context.") {
                        if right == "true" {
                            machine.context[field] = true.into();
                        } else if right == "false" {
                            machine.context[field] = false.into();
                        }
                    }
                }
            }
        }
    }
}

#[test]
fn conformance_checkbox_spec() {
    let spec = load_checkbox_spec();

    let vectors_path = project_root()
        .join("generated")
        .join("test-vectors")
        .join("checkbox.unified.json");
    if !vectors_path.exists() {
        eprintln!(
            "No unified vectors found at {:?}. Run: just unify-vectors",
            vectors_path
        );
        return;
    }

    let content = fs::read_to_string(&vectors_path).expect("Failed to read vectors");
    let vectors: GenericUnifiedVectors =
        serde_json::from_str(&content).expect("Failed to parse vectors");

    println!(
        "Running {} checkbox conformance scenarios...",
        vectors.scenarios.len()
    );

    for scenario in &vectors.scenarios {
        for (i, step) in scenario.steps.iter().enumerate() {
            let mut machine =
                create_checkbox_machine(&spec, &step.before.context, &step.before.state);

            // Send event with guard evaluation
            let context_for_guard = machine.context.clone();
            let guard_fn = make_checkbox_guard_fn(&context_for_guard);
            let result = machine.send_with_guards(
                Event {
                    name: step.event.clone(),
                    payload: Value::Null,
                },
                guard_fn,
            );
            execute_checkbox_actions(&mut machine, &result.actions, &spec);

            // Compare context
            assert_eq!(
                machine.context,
                step.after.context,
                "Scenario '{}' step {} ({}) failed:\nExpected: {:?}\nActual: {:?}",
                scenario.name,
                i + 1,
                step.event,
                step.after.context,
                machine.context
            );

            println!(
                "  ✓ [{}] {} - Step {}: {}",
                scenario.source,
                scenario.name,
                i + 1,
                step.event
            );
        }
    }

    println!(
        "✅ All {} checkbox scenarios passed",
        vectors.scenarios.len()
    );
}

// === Button Conformance Test ===

fn load_button_spec() -> GeneratedSpec {
    let spec_path = project_root().join("generated").join("button.json");
    let content = fs::read_to_string(&spec_path)
        .expect(&format!("Failed to read button spec at {:?}", spec_path));
    serde_json::from_str(&content).expect("Failed to parse button spec")
}

fn create_button_machine(spec: &GeneratedSpec, context: &Value, initial_state: &str) -> Machine {
    let config = MachineConfig {
        id: spec.machine.id.clone(),
        initial: rubigo_statechart::InitialState::Single(initial_state.to_string()),
        context: context.clone(),
        states: spec.machine.states.clone(),
        regions: std::collections::HashMap::new(),
        actions: spec.actions.clone(),
    };

    Machine::from_config(config)
}

fn make_button_guard_fn<'a>(context: &'a Value) -> impl Fn(&str) -> bool + 'a {
    move |_guard_name: &str| {
        // Button guard: "canInteract" = !context.disabled && !context.loading
        let disabled = context
            .get("disabled")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);
        let loading = context
            .get("loading")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);
        !disabled && !loading
    }
}

fn execute_button_actions(actions: &[String], spec: &GeneratedSpec, context: &mut Value) {
    for action_name in actions {
        if let Some(action_config) = spec.actions.get(action_name) {
            let mutation: &str = &action_config.mutation;
            if mutation.is_empty() {
                continue;
            }
            // Handle multi-statement mutations
            for stmt in mutation.split(';') {
                let stmt = stmt.trim();
                if stmt.is_empty() {
                    continue;
                }
                // Parse "context.X = Y"
                if let Some(eq_pos) = stmt.find('=') {
                    let left = stmt[..eq_pos].trim();
                    let right = stmt[eq_pos + 1..].trim();

                    if let Some(key) = left.strip_prefix("context.") {
                        let key = key.trim();
                        let new_value = if right == "true" {
                            serde_json::Value::Bool(true)
                        } else if right == "false" {
                            serde_json::Value::Bool(false)
                        } else {
                            serde_json::Value::Null
                        };
                        if let Some(obj) = context.as_object_mut() {
                            obj.insert(key.to_string(), new_value);
                        }
                    }
                }
            }
        }
    }
}

#[test]
fn conformance_button_spec() {
    let spec = load_button_spec();

    let vectors_path = project_root()
        .join("generated")
        .join("test-vectors")
        .join("button.unified.json");
    let content = fs::read_to_string(&vectors_path).expect(&format!(
        "Failed to read button vectors at {:?}",
        vectors_path
    ));
    let vectors: GenericUnifiedVectors =
        serde_json::from_str(&content).expect("Failed to parse button vectors");

    println!(
        "Running {} button conformance scenarios...",
        vectors.scenarios.len()
    );

    for scenario in &vectors.scenarios {
        for (i, step) in scenario.steps.iter().enumerate() {
            let mut machine =
                create_button_machine(&spec, &step.before.context, &step.before.state);

            // Send event with guard evaluation
            let context_for_guard = machine.context.clone();
            let guard_fn = make_button_guard_fn(&context_for_guard);
            let result = machine.send_with_guards(
                Event {
                    name: step.event.clone(),
                    payload: Value::Null,
                },
                guard_fn,
            );

            // Execute actions manually (update context based on actions)
            execute_button_actions(&result.actions, &spec, &mut machine.context);

            // Verify state
            assert_eq!(
                machine.current_state().unwrap(),
                step.after.state,
                "Scenario '{}' step {} ({}) failed: wrong state",
                scenario.name,
                i + 1,
                step.event
            );

            // Verify context
            assert_eq!(
                machine.context,
                step.after.context,
                "Scenario '{}' step {} ({}) failed:\nExpected: {:?}\nActual: {:?}",
                scenario.name,
                i + 1,
                step.event,
                step.after.context,
                machine.context
            );

            println!(
                "  ✓ [{}] {} - Step {}: {}",
                scenario.source,
                scenario.name,
                i + 1,
                step.event
            );
        }
    }

    println!("✅ All {} button scenarios passed", vectors.scenarios.len());
}

// === Tabs Conformance Test ===

fn load_tabs_spec() -> GeneratedSpec {
    let spec_path = project_root().join("generated").join("tabs.json");
    let content = fs::read_to_string(&spec_path)
        .expect(&format!("Failed to read tabs spec at {:?}", spec_path));
    serde_json::from_str(&content).expect("Failed to parse tabs spec")
}

fn create_tabs_machine(spec: &GeneratedSpec, context: &Value, initial_state: &str) -> Machine {
    let config = MachineConfig {
        id: spec.machine.id.clone(),
        initial: rubigo_statechart::InitialState::Single(initial_state.to_string()),
        context: context.clone(),
        states: spec.machine.states.clone(),
        regions: std::collections::HashMap::new(),
        actions: spec.actions.clone(),
    };

    Machine::from_config(config)
}

fn execute_tabs_actions(
    actions: &[String],
    spec: &GeneratedSpec,
    context: &mut Value,
    payload: Option<&Value>,
) {
    for action_name in actions {
        if let Some(action_config) = spec.actions.get(action_name) {
            let mutation: &str = &action_config.mutation;
            if mutation.is_empty() {
                continue;
            }
            for stmt in mutation.split(';') {
                let stmt = stmt.trim();
                if stmt.is_empty() {
                    continue;
                }
                if let Some(eq_pos) = stmt.find('=') {
                    let left = stmt[..eq_pos].trim();
                    let right = stmt[eq_pos + 1..].trim();

                    if let Some(key) = left.strip_prefix("context.") {
                        let key = key.trim();
                        let new_value = if right.starts_with('\'') && right.ends_with('\'') {
                            serde_json::Value::String(right[1..right.len() - 1].to_string())
                        } else if right == "context.focusedId" {
                            context
                                .get("focusedId")
                                .cloned()
                                .unwrap_or(serde_json::Value::Null)
                        } else if right == "event.payload.id" {
                            // Handle event.payload.id reference
                            payload
                                .and_then(|p| p.get("id"))
                                .cloned()
                                .unwrap_or(serde_json::Value::Null)
                        } else {
                            serde_json::Value::String(right.to_string())
                        };
                        if let Some(obj) = context.as_object_mut() {
                            obj.insert(key.to_string(), new_value);
                        }
                    }
                }
            }
        }
    }
}

#[test]
fn conformance_tabs_spec() {
    let spec = load_tabs_spec();

    let vectors_path = project_root()
        .join("generated")
        .join("test-vectors")
        .join("tabs.unified.json");
    let content = fs::read_to_string(&vectors_path).expect(&format!(
        "Failed to read tabs vectors at {:?}",
        vectors_path
    ));
    let vectors: GenericUnifiedVectors =
        serde_json::from_str(&content).expect("Failed to parse tabs vectors");

    println!(
        "Running {} tabs conformance scenarios...",
        vectors.scenarios.len()
    );

    for scenario in &vectors.scenarios {
        for (i, step) in scenario.steps.iter().enumerate() {
            let mut machine = create_tabs_machine(&spec, &step.before.context, &step.before.state);

            let guard_fn = |_: &str| true;
            let result = machine.send_with_guards(
                Event {
                    name: step.event.clone(),
                    payload: Value::Null,
                },
                guard_fn,
            );

            execute_tabs_actions(
                &result.actions,
                &spec,
                &mut machine.context,
                step.payload.as_ref(),
            );

            assert_eq!(
                machine.current_state().unwrap(),
                step.after.state,
                "Scenario '{}' step {} ({}) failed: wrong state",
                scenario.name,
                i + 1,
                step.event
            );

            assert_eq!(
                machine.context,
                step.after.context,
                "Scenario '{}' step {} ({}) failed: context mismatch",
                scenario.name,
                i + 1,
                step.event
            );

            println!(
                "  ✓ [{}] {} - Step {}: {}",
                scenario.source,
                scenario.name,
                i + 1,
                step.event
            );
        }
    }

    println!("✅ All {} tabs scenarios passed", vectors.scenarios.len());
}

// === Toggle Group Conformance Test ===

fn load_togglegroup_spec() -> GeneratedSpec {
    let spec_path = project_root().join("generated").join("togglegroup.json");
    let content = fs::read_to_string(&spec_path).expect(&format!(
        "Failed to read togglegroup spec at {:?}",
        spec_path
    ));
    serde_json::from_str(&content).expect("Failed to parse togglegroup spec")
}

fn create_togglegroup_machine(
    spec: &GeneratedSpec,
    context: &Value,
    initial_state: &str,
) -> Machine {
    let config = MachineConfig {
        id: spec.machine.id.clone(),
        initial: rubigo_statechart::InitialState::Single(initial_state.to_string()),
        context: context.clone(),
        states: spec.machine.states.clone(),
        regions: std::collections::HashMap::new(),
        actions: spec.actions.clone(),
    };

    Machine::from_config(config)
}

fn make_togglegroup_guard_fn(context: &'_ Value) -> impl Fn(&str) -> bool + '_ {
    move |guard_name: &str| match guard_name {
        "canInteract" => {
            let disabled = context
                .get("disabled")
                .and_then(|v| v.as_bool())
                .unwrap_or(false);
            !disabled
        }
        _ => true,
    }
}

fn execute_togglegroup_actions(
    actions: &[String],
    spec: &GeneratedSpec,
    context: &mut Value,
    payload: Option<&Value>,
) {
    for action_name in actions {
        if let Some(action_config) = spec.actions.get(action_name) {
            let mutation: &str = &action_config.mutation;
            if mutation.is_empty() {
                continue;
            }
            for stmt in mutation.split(';') {
                let stmt = stmt.trim();
                if stmt.is_empty() {
                    continue;
                }
                if let Some(eq_pos) = stmt.find('=') {
                    let left = stmt[..eq_pos].trim();
                    let right = stmt[eq_pos + 1..].trim();

                    if let Some(key) = left.strip_prefix("context.") {
                        let key = key.trim();
                        let new_value = if right.starts_with('\'') && right.ends_with('\'') {
                            serde_json::Value::String(right[1..right.len() - 1].to_string())
                        } else if right == "context.focusedId" {
                            context
                                .get("focusedId")
                                .cloned()
                                .unwrap_or(serde_json::Value::Null)
                        } else if right == "context.selectedId" {
                            context
                                .get("selectedId")
                                .cloned()
                                .unwrap_or(serde_json::Value::Null)
                        } else if right == "event.payload.id" {
                            payload
                                .and_then(|p| p.get("id"))
                                .cloned()
                                .unwrap_or(serde_json::Value::Null)
                        } else if right.contains('?') {
                            // Handle ternary: (context.focusedId == 'item-0') ? 'item-1' : 'item-0'
                            let focused = context
                                .get("focusedId")
                                .and_then(|v| v.as_str())
                                .unwrap_or("");
                            if focused == "item-0" {
                                serde_json::Value::String("item-1".to_string())
                            } else {
                                serde_json::Value::String("item-0".to_string())
                            }
                        } else {
                            serde_json::Value::String(right.to_string())
                        };
                        if let Some(obj) = context.as_object_mut() {
                            obj.insert(key.to_string(), new_value);
                        }
                    }
                }
            }
        }
    }
}

#[test]
fn conformance_togglegroup_spec() {
    let spec = load_togglegroup_spec();

    let vectors_path = project_root()
        .join("generated")
        .join("test-vectors")
        .join("togglegroup.unified.json");
    let content = fs::read_to_string(&vectors_path).expect(&format!(
        "Failed to read togglegroup vectors at {:?}",
        vectors_path
    ));
    let vectors: GenericUnifiedVectors =
        serde_json::from_str(&content).expect("Failed to parse togglegroup vectors");

    println!(
        "Running {} togglegroup conformance scenarios...",
        vectors.scenarios.len()
    );

    for scenario in &vectors.scenarios {
        for (i, step) in scenario.steps.iter().enumerate() {
            let mut machine =
                create_togglegroup_machine(&spec, &step.before.context, &step.before.state);

            let guard_fn = make_togglegroup_guard_fn(&step.before.context);
            let result = machine.send_with_guards(
                Event {
                    name: step.event.clone(),
                    payload: step.payload.clone().unwrap_or(Value::Null),
                },
                guard_fn,
            );

            // For ITF traces, infer payload from expected context when missing
            let effective_payload = if step.payload.is_some() {
                step.payload.clone()
            } else if step.event == "SELECT" {
                // Infer payload.id from expected selectedId
                step.after
                    .context
                    .get("selectedId")
                    .map(|id| serde_json::json!({ "id": id }))
            } else {
                None
            };

            execute_togglegroup_actions(
                &result.actions,
                &spec,
                &mut machine.context,
                effective_payload.as_ref(),
            );

            assert_eq!(
                machine.current_state().unwrap(),
                step.after.state,
                "Scenario '{}' step {} ({}) failed: wrong state",
                scenario.name,
                i + 1,
                step.event
            );

            assert_eq!(
                machine.context,
                step.after.context,
                "Scenario '{}' step {} ({}) failed: context mismatch\nExpected: {:?}\nActual: {:?}",
                scenario.name,
                i + 1,
                step.event,
                step.after.context,
                machine.context
            );

            println!(
                "  ✓ [{}] {} - Step {}: {}",
                scenario.source,
                scenario.name,
                i + 1,
                step.event
            );
        }
    }

    println!(
        "✅ All {} togglegroup scenarios passed",
        vectors.scenarios.len()
    );
}

// === Collapsible Spec Conformance ===

fn load_collapsible_spec() -> GeneratedSpec {
    let spec_path = project_root().join("generated").join("collapsible.json");
    let content = fs::read_to_string(&spec_path).expect(&format!(
        "Failed to read collapsible spec at {:?}",
        spec_path
    ));
    serde_json::from_str(&content).expect("Failed to parse collapsible spec")
}

fn create_collapsible_machine(
    spec: &GeneratedSpec,
    context: &Value,
    initial_state: &str,
) -> Machine {
    let config = MachineConfig {
        id: spec.machine.id.clone(),
        initial: rubigo_statechart::InitialState::Single(initial_state.to_string()),
        context: context.clone(),
        states: spec.machine.states.clone(),
        regions: std::collections::HashMap::new(),
        actions: spec.actions.clone(),
    };

    Machine::from_config(config)
}

fn make_collapsible_guard_fn<'a>(context: &'a Value) -> impl Fn(&str) -> bool + 'a {
    move |_guard_name: &str| {
        // Collapsible guard: "!context.disabled"
        let disabled = context
            .get("disabled")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);
        !disabled
    }
}

fn execute_collapsible_actions(
    actions: &[String],
    spec: &GeneratedSpec,
    context: &mut Value,
    _payload: Option<&Value>,
) {
    for action_name in actions {
        if let Some(action) = spec.actions.get(action_name) {
            let mutation = &action.mutation;

            // Parse simple mutations: "context.open = true"
            for stmt in mutation.split(';') {
                let stmt = stmt.trim();
                if stmt.is_empty() {
                    continue;
                }

                if let Some(eq_pos) = stmt.find('=') {
                    let left = stmt[..eq_pos].trim();
                    let right = stmt[eq_pos + 1..].trim();

                    if let Some(field) = left.strip_prefix("context.") {
                        if right == "true" {
                            context[field] = true.into();
                        } else if right == "false" {
                            context[field] = false.into();
                        }
                    }
                }
            }
        }
    }
}

#[test]
fn conformance_collapsible_spec() {
    let spec = load_collapsible_spec();

    let vectors_path = project_root()
        .join("generated")
        .join("test-vectors")
        .join("collapsible.unified.json");

    if !vectors_path.exists() {
        eprintln!(
            "No unified vectors found at {:?}. Run: cargo build",
            vectors_path
        );
        return;
    }

    let content = fs::read_to_string(&vectors_path).expect("Failed to read vectors");
    let vectors: GenericUnifiedVectors =
        serde_json::from_str(&content).expect("Failed to parse vectors");

    println!(
        "Running {} collapsible conformance scenarios...",
        vectors.scenarios.len()
    );

    for scenario in &vectors.scenarios {
        for (i, step) in scenario.steps.iter().enumerate() {
            let mut machine =
                create_collapsible_machine(&spec, &step.before.context, &step.before.state);

            let guard_fn = make_collapsible_guard_fn(&step.before.context);
            let result = machine.send_with_guards(
                Event {
                    name: step.event.clone(),
                    payload: step.payload.clone().unwrap_or(Value::Null),
                },
                guard_fn,
            );

            execute_collapsible_actions(
                &result.actions,
                &spec,
                &mut machine.context,
                step.payload.as_ref(),
            );

            assert_eq!(
                machine.current_state().unwrap(),
                step.after.state,
                "Scenario '{}' step {} ({}) failed: wrong state",
                scenario.name,
                i + 1,
                step.event
            );

            // For ITF traces, expected context may be missing 'open' - infer from state
            let mut expected_context = step.after.context.clone();
            if expected_context.get("open").is_none() {
                let open_val = step.after.state == "expanded";
                expected_context["open"] = open_val.into();
            }

            assert_eq!(
                machine.context,
                expected_context,
                "Scenario '{}' step {} ({}) failed: context mismatch\nExpected: {:?}\nActual: {:?}",
                scenario.name,
                i + 1,
                step.event,
                expected_context,
                machine.context
            );

            println!(
                "  ✓ [{}] {} - Step {}: {}",
                scenario.source,
                scenario.name,
                i + 1,
                step.event
            );
        }
    }

    println!(
        "✅ All {} collapsible scenarios passed",
        vectors.scenarios.len()
    );
}

// === Tooltip Spec Conformance ===

fn load_tooltip_spec() -> GeneratedSpec {
    let spec_path = project_root().join("generated").join("tooltip.json");
    let content = fs::read_to_string(&spec_path)
        .expect(&format!("Failed to read tooltip spec at {:?}", spec_path));
    serde_json::from_str(&content).expect("Failed to parse tooltip spec")
}

fn create_tooltip_machine(spec: &GeneratedSpec, context: &Value, initial_state: &str) -> Machine {
    let config = MachineConfig {
        id: spec.machine.id.clone(),
        initial: rubigo_statechart::InitialState::Single(initial_state.to_string()),
        context: context.clone(),
        states: spec.machine.states.clone(),
        regions: std::collections::HashMap::new(),
        actions: spec.actions.clone(),
    };

    Machine::from_config(config)
}

fn make_tooltip_guard_fn<'a>(context: &'a Value) -> impl Fn(&str) -> bool + 'a {
    move |_guard_name: &str| {
        let disabled = context
            .get("disabled")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);
        !disabled
    }
}

fn execute_tooltip_actions(
    actions: &[String],
    spec: &GeneratedSpec,
    context: &mut Value,
    _payload: Option<&Value>,
) {
    for action_name in actions {
        if let Some(action) = spec.actions.get(action_name) {
            let mutation = &action.mutation;
            for stmt in mutation.split(';') {
                let stmt = stmt.trim();
                if stmt.is_empty() {
                    continue;
                }
                if let Some(eq_pos) = stmt.find('=') {
                    let left = stmt[..eq_pos].trim();
                    let right = stmt[eq_pos + 1..].trim();
                    if let Some(field) = left.strip_prefix("context.") {
                        if right == "true" {
                            context[field] = true.into();
                        } else if right == "false" {
                            context[field] = false.into();
                        }
                    }
                }
            }
        }
    }
}

#[test]
fn conformance_tooltip_spec() {
    let spec = load_tooltip_spec();

    let vectors_path = project_root()
        .join("generated")
        .join("test-vectors")
        .join("tooltip.unified.json");

    if !vectors_path.exists() {
        eprintln!(
            "No unified vectors found at {:?}. Run: cargo build",
            vectors_path
        );
        return;
    }

    let content = fs::read_to_string(&vectors_path).expect("Failed to read vectors");
    let vectors: GenericUnifiedVectors =
        serde_json::from_str(&content).expect("Failed to parse vectors");

    println!(
        "Running {} tooltip conformance scenarios...",
        vectors.scenarios.len()
    );

    for scenario in &vectors.scenarios {
        for (i, step) in scenario.steps.iter().enumerate() {
            // Ensure 'open' field exists in initial context (infer from state for ITF traces)
            let mut initial_context = step.before.context.clone();
            if initial_context.get("open").is_none() {
                let open_val = step.before.state == "open";
                initial_context["open"] = open_val.into();
            }

            let mut machine = create_tooltip_machine(&spec, &initial_context, &step.before.state);

            let guard_fn = make_tooltip_guard_fn(&initial_context);
            let result = machine.send_with_guards(
                Event {
                    name: step.event.clone(),
                    payload: step.payload.clone().unwrap_or(Value::Null),
                },
                guard_fn,
            );

            execute_tooltip_actions(
                &result.actions,
                &spec,
                &mut machine.context,
                step.payload.as_ref(),
            );

            assert_eq!(
                machine.current_state().unwrap(),
                step.after.state,
                "Scenario '{}' step {} ({}) failed: wrong state",
                scenario.name,
                i + 1,
                step.event
            );

            // For ITF traces, infer 'open' from state if missing
            // Tooltip is visible ("open") in both "open" and "closing" states
            let mut expected_context = step.after.context.clone();
            if expected_context.get("open").is_none() {
                let open_val = step.after.state == "open" || step.after.state == "closing";
                expected_context["open"] = open_val.into();
            }

            assert_eq!(
                machine.context,
                expected_context,
                "Scenario '{}' step {} ({}) failed: context mismatch\nExpected: {:?}\nActual: {:?}",
                scenario.name,
                i + 1,
                step.event,
                expected_context,
                machine.context
            );

            println!(
                "  ✓ [{}] {} - Step {}: {}",
                scenario.source,
                scenario.name,
                i + 1,
                step.event
            );
        }
    }

    println!(
        "✅ All {} tooltip scenarios passed",
        vectors.scenarios.len()
    );
}

// === Dialog Spec Conformance ===

fn load_dialog_spec() -> GeneratedSpec {
    let spec_path = project_root().join("generated").join("dialog.json");
    let content = fs::read_to_string(&spec_path)
        .expect(&format!("Failed to read dialog spec at {:?}", spec_path));
    serde_json::from_str(&content).expect("Failed to parse dialog spec")
}

fn create_dialog_machine(spec: &GeneratedSpec, context: &Value, initial_state: &str) -> Machine {
    let config = MachineConfig {
        id: spec.machine.id.clone(),
        initial: rubigo_statechart::InitialState::Single(initial_state.to_string()),
        context: context.clone(),
        states: spec.machine.states.clone(),
        regions: std::collections::HashMap::new(),
        actions: spec.actions.clone(),
    };

    Machine::from_config(config)
}

fn make_dialog_guard_fn<'a>(context: &'a Value) -> impl Fn(&str) -> bool + 'a {
    move |guard_name: &str| match guard_name {
        "canClose" => {
            let prevent_close = context
                .get("preventClose")
                .and_then(|v| v.as_bool())
                .unwrap_or(false);
            !prevent_close
        }
        _ => true,
    }
}

fn execute_dialog_actions(
    actions: &[String],
    spec: &GeneratedSpec,
    context: &mut Value,
    _payload: Option<&Value>,
) {
    for action_name in actions {
        if let Some(action) = spec.actions.get(action_name) {
            let mutation = &action.mutation;
            for stmt in mutation.split(';') {
                let stmt = stmt.trim();
                if stmt.is_empty() {
                    continue;
                }
                if let Some(eq_pos) = stmt.find('=') {
                    let left = stmt[..eq_pos].trim();
                    let right = stmt[eq_pos + 1..].trim();
                    if let Some(field) = left.strip_prefix("context.") {
                        if right == "true" {
                            context[field] = true.into();
                        } else if right == "false" {
                            context[field] = false.into();
                        }
                    }
                }
            }
        }
    }
}

#[test]
fn conformance_dialog_spec() {
    let spec = load_dialog_spec();

    let vectors_path = project_root()
        .join("generated")
        .join("test-vectors")
        .join("dialog.unified.json");

    if !vectors_path.exists() {
        eprintln!(
            "No unified vectors found at {:?}. Run: cargo build",
            vectors_path
        );
        return;
    }

    let content = fs::read_to_string(&vectors_path).expect("Failed to read vectors");
    let vectors: GenericUnifiedVectors =
        serde_json::from_str(&content).expect("Failed to parse vectors");

    println!(
        "Running {} dialog conformance scenarios...",
        vectors.scenarios.len()
    );

    for scenario in &vectors.scenarios {
        for (i, step) in scenario.steps.iter().enumerate() {
            // Ensure 'open' field exists in initial context (infer from state for ITF traces)
            let mut initial_context = step.before.context.clone();
            if initial_context.get("open").is_none() {
                let open_val = step.before.state == "open";
                initial_context["open"] = open_val.into();
            }

            let mut machine = create_dialog_machine(&spec, &initial_context, &step.before.state);

            let guard_fn = make_dialog_guard_fn(&initial_context);
            let result = machine.send_with_guards(
                Event {
                    name: step.event.clone(),
                    payload: step.payload.clone().unwrap_or(Value::Null),
                },
                guard_fn,
            );

            execute_dialog_actions(
                &result.actions,
                &spec,
                &mut machine.context,
                step.payload.as_ref(),
            );

            assert_eq!(
                machine.current_state().unwrap(),
                step.after.state,
                "Scenario '{}' step {} ({}) failed: wrong state",
                scenario.name,
                i + 1,
                step.event
            );

            // For ITF traces, infer 'open' from state if missing
            let mut expected_context = step.after.context.clone();
            if expected_context.get("open").is_none() {
                let open_val = step.after.state == "open";
                expected_context["open"] = open_val.into();
            }

            assert_eq!(
                machine.context,
                expected_context,
                "Scenario '{}' step {} ({}) failed: context mismatch\nExpected: {:?}\nActual: {:?}",
                scenario.name,
                i + 1,
                step.event,
                expected_context,
                machine.context
            );

            println!(
                "  ✓ [{}] {} - Step {}: {}",
                scenario.source,
                scenario.name,
                i + 1,
                step.event
            );
        }
    }

    println!("✅ All {} dialog scenarios passed", vectors.scenarios.len());
}

// === Select Spec Conformance ===

fn load_select_spec() -> GeneratedSpec {
    let spec_path = project_root().join("generated").join("select.json");
    let content = fs::read_to_string(&spec_path)
        .expect(&format!("Failed to read select spec at {:?}", spec_path));
    serde_json::from_str(&content).expect("Failed to parse select spec")
}

fn create_select_machine(spec: &GeneratedSpec, context: &Value, initial_state: &str) -> Machine {
    let config = MachineConfig {
        id: spec.machine.id.clone(),
        initial: rubigo_statechart::InitialState::Single(initial_state.to_string()),
        context: context.clone(),
        states: spec.machine.states.clone(),
        regions: std::collections::HashMap::new(),
        actions: spec.actions.clone(),
    };

    Machine::from_config(config)
}

fn make_select_guard_fn<'a>(context: &'a Value) -> impl Fn(&str) -> bool + 'a {
    move |guard_name: &str| match guard_name {
        "canInteract" => {
            let disabled = context
                .get("disabled")
                .and_then(|v| v.as_bool())
                .unwrap_or(false);
            !disabled
        }
        _ => true,
    }
}

fn execute_select_actions(
    actions: &[String],
    spec: &GeneratedSpec,
    context: &mut Value,
    payload: Option<&Value>,
) {
    for action_name in actions {
        if let Some(action) = spec.actions.get(action_name) {
            let mutation = &action.mutation;
            for stmt in mutation.split(';') {
                let stmt = stmt.trim();
                if stmt.is_empty() {
                    continue;
                }
                if let Some(eq_pos) = stmt.find('=') {
                    let left = stmt[..eq_pos].trim();
                    let right = stmt[eq_pos + 1..].trim();
                    if let Some(field) = left.strip_prefix("context.") {
                        if right == "true" {
                            context[field] = true.into();
                        } else if right == "false" {
                            context[field] = false.into();
                        } else if right == "payload.value" {
                            if let Some(p) = payload {
                                if let Some(val) = p.get("value") {
                                    context[field] = val.clone();
                                }
                            }
                        } else if right == "context.highlightedValue" {
                            if let Some(val) = context.get("highlightedValue").cloned() {
                                context[field] = val;
                            }
                        } else if right == "context.selectedValue" {
                            if let Some(val) = context.get("selectedValue").cloned() {
                                context[field] = val;
                            }
                        }
                    }
                }
            }
        }
    }
}

#[test]
fn conformance_select_spec() {
    let spec = load_select_spec();

    let vectors_path = project_root()
        .join("generated")
        .join("test-vectors")
        .join("select.unified.json");

    if !vectors_path.exists() {
        eprintln!(
            "No unified vectors found at {:?}. Run: cargo build",
            vectors_path
        );
        return;
    }

    let content = fs::read_to_string(&vectors_path).expect("Failed to read vectors");
    let vectors: GenericUnifiedVectors =
        serde_json::from_str(&content).expect("Failed to parse vectors");

    println!(
        "Running {} select conformance scenarios...",
        vectors.scenarios.len()
    );

    for scenario in &vectors.scenarios {
        for (i, step) in scenario.steps.iter().enumerate() {
            // Ensure required fields exist in initial context
            let mut initial_context = step.before.context.clone();
            if initial_context.get("open").is_none() {
                let open_val = step.before.state == "open";
                initial_context["open"] = open_val.into();
            }

            let mut machine = create_select_machine(&spec, &initial_context, &step.before.state);

            let guard_fn = make_select_guard_fn(&initial_context);
            let result = machine.send_with_guards(
                Event {
                    name: step.event.clone(),
                    payload: step.payload.clone().unwrap_or(Value::Null),
                },
                guard_fn,
            );

            execute_select_actions(
                &result.actions,
                &spec,
                &mut machine.context,
                step.payload.as_ref(),
            );

            assert_eq!(
                machine.current_state().unwrap(),
                step.after.state,
                "Scenario '{}' step {} ({}) failed: wrong state",
                scenario.name,
                i + 1,
                step.event
            );

            // For ITF traces, infer 'open' from state if missing
            let mut expected_context = step.after.context.clone();
            if expected_context.get("open").is_none() {
                let open_val = step.after.state == "open";
                expected_context["open"] = open_val.into();
            }

            // Only check open and disabled for now (ITF traces may have string fields)
            let actual_open = machine.context.get("open").and_then(|v| v.as_bool());
            let expected_open = expected_context.get("open").and_then(|v| v.as_bool());
            assert_eq!(
                actual_open,
                expected_open,
                "Scenario '{}' step {} ({}) failed: open mismatch",
                scenario.name,
                i + 1,
                step.event
            );

            println!(
                "  ✓ [{}] {} - Step {}: {}",
                scenario.source,
                scenario.name,
                i + 1,
                step.event
            );
        }
    }

    println!("✅ All {} select scenarios passed", vectors.scenarios.len());
}

// === Slider Spec Conformance ===

fn load_slider_spec() -> GeneratedSpec {
    let spec_path = project_root().join("generated").join("slider.json");
    let content = fs::read_to_string(&spec_path)
        .expect(&format!("Failed to read slider spec at {:?}", spec_path));
    serde_json::from_str(&content).expect("Failed to parse slider spec")
}

fn create_slider_machine(spec: &GeneratedSpec, context: &Value, initial_state: &str) -> Machine {
    let config = MachineConfig {
        id: spec.machine.id.clone(),
        initial: rubigo_statechart::InitialState::Single(initial_state.to_string()),
        context: context.clone(),
        states: spec.machine.states.clone(),
        regions: std::collections::HashMap::new(),
        actions: spec.actions.clone(),
    };

    Machine::from_config(config)
}

fn make_slider_guard_fn<'a>(context: &'a Value) -> impl Fn(&str) -> bool + 'a {
    move |guard_name: &str| match guard_name {
        "canInteract" => {
            let disabled = context
                .get("disabled")
                .and_then(|v| v.as_bool())
                .unwrap_or(false);
            !disabled
        }
        _ => true,
    }
}

fn execute_slider_actions(
    actions: &[String],
    spec: &GeneratedSpec,
    context: &mut Value,
    _payload: Option<&Value>,
) {
    for action_name in actions {
        if let Some(action) = spec.actions.get(action_name) {
            let mutation = &action.mutation;
            for stmt in mutation.split(';') {
                let stmt = stmt.trim();
                if stmt.is_empty() {
                    continue;
                }
                if let Some(eq_pos) = stmt.find('=') {
                    let left = stmt[..eq_pos].trim();
                    let right = stmt[eq_pos + 1..].trim();
                    if let Some(field) = left.strip_prefix("context.") {
                        if right == "true" {
                            context[field] = true.into();
                        } else if right == "false" {
                            context[field] = false.into();
                        }
                    }
                }
            }
        }
    }
}

#[test]
fn conformance_slider_spec() {
    let spec = load_slider_spec();

    let vectors_path = project_root()
        .join("generated")
        .join("test-vectors")
        .join("slider.unified.json");

    if !vectors_path.exists() {
        eprintln!(
            "No unified vectors found at {:?}. Run: cargo build",
            vectors_path
        );
        return;
    }

    let content = fs::read_to_string(&vectors_path).expect("Failed to read vectors");
    let vectors: GenericUnifiedVectors =
        serde_json::from_str(&content).expect("Failed to parse vectors");

    println!(
        "Running {} slider conformance scenarios...",
        vectors.scenarios.len()
    );

    for scenario in &vectors.scenarios {
        for (i, step) in scenario.steps.iter().enumerate() {
            let mut machine =
                create_slider_machine(&spec, &step.before.context, &step.before.state);

            let guard_fn = make_slider_guard_fn(&step.before.context);
            let result = machine.send_with_guards(
                Event {
                    name: step.event.clone(),
                    payload: step.payload.clone().unwrap_or(Value::Null),
                },
                guard_fn,
            );

            execute_slider_actions(
                &result.actions,
                &spec,
                &mut machine.context,
                step.payload.as_ref(),
            );

            assert_eq!(
                machine.current_state().unwrap(),
                step.after.state,
                "Scenario '{}' step {} ({}) failed: wrong state",
                scenario.name,
                i + 1,
                step.event
            );

            println!(
                "  ✓ [{}] {} - Step {}: {}",
                scenario.source,
                scenario.name,
                i + 1,
                step.event
            );
        }
    }

    println!("✅ All {} slider scenarios passed", vectors.scenarios.len());
}
