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

fn execute_tabs_actions(actions: &[String], spec: &GeneratedSpec, context: &mut Value) {
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

            execute_tabs_actions(&result.actions, &spec, &mut machine.context);

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
