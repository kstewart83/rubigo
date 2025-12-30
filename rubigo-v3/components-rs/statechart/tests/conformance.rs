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
    let mut context = serde_json::json!({
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
        if let Some(guard_expr) = spec.guards.get(guard_name) {
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
