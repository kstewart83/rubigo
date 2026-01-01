//! Integration tests for the statechart interpreter

use rubigo_statechart::*;
use pretty_assertions::assert_eq;

fn event(name: &str) -> Event {
    Event {
        name: name.to_string(),
        payload: serde_json::Value::Null,
    }
}

// =============================================================================
// Basic Transitions
// =============================================================================

#[test]
fn test_state_transitions() {
    let config: MachineConfig = serde_json::from_str(r#"{
        "id": "traffic_light",
        "initial": "red",
        "states": {
            "red": { "on": { "NEXT": "green" } },
            "green": { "on": { "NEXT": "yellow" } },
            "yellow": { "on": { "NEXT": "red" } }
        }
    }"#).unwrap();
    
    let mut machine = Machine::from_config(config);
    
    assert_eq!(machine.current_state(), Some("red"));
    
    machine.send(event("NEXT"));
    assert_eq!(machine.current_state(), Some("green"));
    
    machine.send(event("NEXT"));
    assert_eq!(machine.current_state(), Some("yellow"));
    
    machine.send(event("NEXT"));
    assert_eq!(machine.current_state(), Some("red"));
}

#[test]
fn test_unhandled_event() {
    let config: MachineConfig = serde_json::from_str(r#"{
        "id": "simple",
        "initial": "idle",
        "states": {
            "idle": { "on": { "START": "running" } },
            "running": {}
        }
    }"#).unwrap();
    
    let mut machine = Machine::from_config(config);
    
    // STOP is not handled in idle state
    let result = machine.send(event("STOP"));
    assert!(!result.handled);
    assert_eq!(machine.current_state(), Some("idle"));
}

// =============================================================================
// Entry/Exit Actions
// =============================================================================

#[test]
fn test_entry_exit_actions() {
    let config: MachineConfig = serde_json::from_str(r#"{
        "id": "door",
        "initial": "closed",
        "states": {
            "closed": {
                "entry": ["lockDoor"],
                "exit": ["unlockDoor"],
                "on": { "OPEN": "open" }
            },
            "open": {
                "entry": ["turnOnLight"],
                "exit": ["turnOffLight"],
                "on": { "CLOSE": "closed" }
            }
        }
    }"#).unwrap();
    
    let mut machine = Machine::from_config(config);
    
    // Initial state doesn't trigger entry (already there)
    let result = machine.send(event("OPEN"));
    
    // Should see: exit closed, then enter open
    assert_eq!(result.actions, vec!["unlockDoor", "turnOnLight"]);
    
    let result = machine.send(event("CLOSE"));
    assert_eq!(result.actions, vec!["turnOffLight", "lockDoor"]);
}

// =============================================================================
// Guards
// =============================================================================

#[test]
fn test_guard_allows_transition() {
    let config: MachineConfig = serde_json::from_str(r#"{
        "id": "guarded",
        "initial": "idle",
        "states": {
            "idle": {
                "on": {
                    "SUBMIT": { "target": "submitted", "guard": "isValid" }
                }
            },
            "submitted": {}
        }
    }"#).unwrap();
    
    let mut machine = Machine::from_config(config);
    
    // Guard returns true
    let result = machine.send_with_guards(event("SUBMIT"), |guard| guard == "isValid");
    assert!(result.handled);
    assert_eq!(machine.current_state(), Some("submitted"));
}

#[test]
fn test_guard_blocks_transition() {
    let config: MachineConfig = serde_json::from_str(r#"{
        "id": "guarded",
        "initial": "idle",
        "states": {
            "idle": {
                "on": {
                    "SUBMIT": { "target": "submitted", "guard": "isValid" }
                }
            },
            "submitted": {}
        }
    }"#).unwrap();
    
    let mut machine = Machine::from_config(config);
    
    // Guard returns false
    let result = machine.send_with_guards(event("SUBMIT"), |_| false);
    assert!(!result.handled);
    assert_eq!(machine.current_state(), Some("idle"));
}

// =============================================================================
// Final States
// =============================================================================

#[test]
fn test_final_state() {
    let config: MachineConfig = serde_json::from_str(r#"{
        "id": "workflow",
        "initial": "pending",
        "states": {
            "pending": { "on": { "APPROVE": "approved" } },
            "approved": { "final_state": true }
        }
    }"#).unwrap();
    
    let mut machine = Machine::from_config(config);
    
    assert!(!machine.is_done());
    
    machine.send(event("APPROVE"));
    assert!(machine.is_done());
}

// =============================================================================
// Parallel Regions
// =============================================================================

#[test]
fn test_parallel_regions() {
    let config: MachineConfig = serde_json::from_str(r#"{
        "id": "player",
        "initial": { "movement": "idle", "weapon": "holstered" },
        "states": {},
        "regions": {
            "movement": {
                "initial": "idle",
                "states": {
                    "idle": { "on": { "WALK": "walking" } },
                    "walking": { "on": { "STOP": "idle" } }
                }
            },
            "weapon": {
                "initial": "holstered",
                "states": {
                    "holstered": { "on": { "DRAW": "ready" } },
                    "ready": { "on": { "HOLSTER": "holstered", "FIRE": "firing" } },
                    "firing": { "on": { "DONE": "ready" } }
                }
            }
        }
    }"#).unwrap();
    
    let mut machine = Machine::from_config(config);
    
    let states = machine.current_states();
    assert_eq!(states.get("movement"), Some(&"idle".to_string()));
    assert_eq!(states.get("weapon"), Some(&"holstered".to_string()));
    
    // Walk and draw at the same time
    machine.send(event("WALK"));
    machine.send(event("DRAW"));
    
    let states = machine.current_states();
    assert_eq!(states.get("movement"), Some(&"walking".to_string()));
    assert_eq!(states.get("weapon"), Some(&"ready".to_string()));
    
    // Fire while walking
    machine.send(event("FIRE"));
    
    let states = machine.current_states();
    assert_eq!(states.get("movement"), Some(&"walking".to_string()));
    assert_eq!(states.get("weapon"), Some(&"firing".to_string()));
}

#[test]
fn test_parallel_both_regions_handle_same_event() {
    let config: MachineConfig = serde_json::from_str(r#"{
        "id": "synchronized",
        "initial": { "a": "off", "b": "off" },
        "states": {},
        "regions": {
            "a": {
                "initial": "off",
                "states": {
                    "off": { "on": { "TOGGLE": { "target": "on", "actions": ["aOn"] } } },
                    "on": { "on": { "TOGGLE": { "target": "off", "actions": ["aOff"] } } }
                }
            },
            "b": {
                "initial": "off",
                "states": {
                    "off": { "on": { "TOGGLE": { "target": "on", "actions": ["bOn"] } } },
                    "on": { "on": { "TOGGLE": { "target": "off", "actions": ["bOff"] } } }
                }
            }
        }
    }"#).unwrap();
    
    let mut machine = Machine::from_config(config);
    
    // Both regions respond to TOGGLE
    let result = machine.send(event("TOGGLE"));
    
    assert!(result.handled);
    // Both regions should have transitioned
    let actions = result.actions;
    assert!(actions.contains(&"aOn".to_string()));
    assert!(actions.contains(&"bOn".to_string()));
    
    let states = machine.current_states();
    assert_eq!(states.get("a"), Some(&"on".to_string()));
    assert_eq!(states.get("b"), Some(&"on".to_string()));
}

// =============================================================================
// Counter Pattern (The Hello World)
// =============================================================================

#[test]
fn test_counter_with_context() {
    let config: MachineConfig = serde_json::from_str(r#"{
        "id": "counter",
        "initial": "active",
        "context": { "value": 0, "min": -10, "max": 10 },
        "states": {
            "active": {
                "on": {
                    "INCREMENT": { "target": "active", "actions": ["increment"], "guard": "canIncrement" },
                    "DECREMENT": { "target": "active", "actions": ["decrement"], "guard": "canDecrement" },
                    "RESET": { "target": "active", "actions": ["reset"] }
                }
            }
        }
    }"#).unwrap();
    
    let mut machine = Machine::from_config(config);
    
    // Simulate incrementing with guard check
    // In real use, the guard evaluator would read machine.context
    let mut value = 0i32;
    let max = 10i32;
    let min = -10i32;
    
    // Increment 3 times
    for _ in 0..3 {
        let result = machine.send_with_guards(event("INCREMENT"), |guard| {
            guard == "canIncrement" && value < max
        });
        if result.handled && result.actions.contains(&"increment".to_string()) {
            value += 1;
        }
    }
    assert_eq!(value, 3);
    
    // Decrement 5 times
    for _ in 0..5 {
        let result = machine.send_with_guards(event("DECREMENT"), |guard| {
            guard == "canDecrement" && value > min
        });
        if result.handled && result.actions.contains(&"decrement".to_string()) {
            value -= 1;
        }
    }
    assert_eq!(value, -2);
    
    // Reset
    let result = machine.send(event("RESET"));
    assert!(result.actions.contains(&"reset".to_string()));
}

// =============================================================================
// Edge Cases
// =============================================================================

#[test]
fn test_self_transition_triggers_exit_entry() {
    let config: MachineConfig = serde_json::from_str(r#"{
        "id": "self_loop",
        "initial": "active",
        "states": {
            "active": {
                "entry": ["enter"],
                "exit": ["leave"],
                "on": { "TICK": "active" }
            }
        }
    }"#).unwrap();
    
    let mut machine = Machine::from_config(config);
    
    let result = machine.send(event("TICK"));
    
    // Self-transition should trigger both exit and entry
    assert_eq!(result.actions, vec!["leave", "enter"]);
}

#[test]
fn test_transition_with_multiple_actions() {
    let config: MachineConfig = serde_json::from_str(r#"{
        "id": "multi_action",
        "initial": "a",
        "states": {
            "a": {
                "exit": ["exitA"],
                "on": {
                    "GO": { "target": "b", "actions": ["action1", "action2", "action3"] }
                }
            },
            "b": {
                "entry": ["enterB"]
            }
        }
    }"#).unwrap();
    
    let mut machine = Machine::from_config(config);
    
    let result = machine.send(event("GO"));
    
    // Order: exit -> transition actions -> entry
    assert_eq!(result.actions, vec!["exitA", "action1", "action2", "action3", "enterB"]);
}

#[test]
fn test_simple_target_string_syntax() {
    // Tests the shorthand "EVENT": "target" syntax
    let config: MachineConfig = serde_json::from_str(r#"{
        "id": "shorthand",
        "initial": "a",
        "states": {
            "a": { "on": { "GO": "b" } },
            "b": { "on": { "BACK": "a" } }
        }
    }"#).unwrap();
    
    let mut machine = Machine::from_config(config);
    
    machine.send(event("GO"));
    assert_eq!(machine.current_state(), Some("b"));
    
    machine.send(event("BACK"));
    assert_eq!(machine.current_state(), Some("a"));
}

#[test]
fn test_empty_states_no_crash() {
    let config: MachineConfig = serde_json::from_str(r#"{
        "id": "minimal",
        "initial": "only",
        "states": {
            "only": {}
        }
    }"#).unwrap();
    
    let mut machine = Machine::from_config(config);
    
    // Should not crash on any event
    let result = machine.send(event("ANYTHING"));
    assert!(!result.handled);
    assert_eq!(machine.current_state(), Some("only"));
}

#[test]
fn test_parallel_final_states() {
    let config: MachineConfig = serde_json::from_str(r#"{
        "id": "parallel_final",
        "initial": { "a": "running", "b": "running" },
        "states": {},
        "regions": {
            "a": {
                "initial": "running",
                "states": {
                    "running": { "on": { "DONE_A": "finished" } },
                    "finished": { "final_state": true }
                }
            },
            "b": {
                "initial": "running",
                "states": {
                    "running": { "on": { "DONE_B": "finished" } },
                    "finished": { "final_state": true }
                }
            }
        }
    }"#).unwrap();
    
    let mut machine = Machine::from_config(config);
    
    assert!(!machine.is_done());
    
    machine.send(event("DONE_A"));
    assert!(!machine.is_done()); // Only A is done
    
    machine.send(event("DONE_B"));
    assert!(machine.is_done()); // Now both are done
}
