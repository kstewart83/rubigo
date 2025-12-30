---
type: schema
description: Type definitions for the statechart interpreter
---

# Statechart Interpreter Specification

The canonical specification for the statechart interpreter. Both Rust (`components-rs/statechart`) 
and TypeScript (`components-ts/statechart`) implementations MUST conform to this behavior.

## Intent

A statechart interpreter executes state machine configurations at runtime. Given a machine config 
and an event, it determines the next state, evaluates guards, and executes actions.

Constraint: Identical inputs MUST produce identical outputs across Rust and TypeScript.
Constraint: Guards are evaluated before transitions occur.
Constraint: Actions are executed in order: exit → transition → entry.

## Context Schema

```cue
#InterpreterContext: {
    // Current state for each region
    current_states: {[string]: string}
    
    // History of states for "history" pseudo-states (future)
    history: {[string]: string}
}
```

## Machine Configuration Schema

```cue
#MachineConfig: {
    id: string
    initial: string
    
    context: {...}  // User-defined extended state
    
    states: {
        [string]: #StateConfig
    }
    
    // Future: parallel regions
    regions?: {
        [string]: #RegionConfig
    }
}

#StateConfig: {
    entry?: [...string]  // Actions on entering
    exit?: [...string]   // Actions on exiting
    
    on: {
        [string]: #TransitionConfig
    }
}

#TransitionConfig: {
    target: string
    actions?: [...string]
    guard?: string
} | string  // Shorthand: just target state
```

## Event Schema

```cue
#Event: {
    name: string
    payload?: {...}
}
```

## Interpreter State Machine

The interpreter itself follows a simple execution model:

```cue
interpreter: {
    id: "statechart_interpreter"
    initial: "idle"
    
    states: {
        idle: {
            on: {
                SEND: {target: "resolving", actions: ["captureEvent"]}
            }
        }
        resolving: {
            entry: ["findTransition"]
            on: {
                TRANSITION_FOUND: {target: "executing", guard: "guardPasses"}
                TRANSITION_FOUND: {target: "idle", guard: "guardFails"}
                NO_TRANSITION: {target: "idle"}
            }
        }
        executing: {
            entry: ["executeExitActions", "executeTransitionActions", "updateState", "executeEntryActions"]
            on: {
                DONE: {target: "idle"}
            }
        }
    }
}
```

## Core Algorithm

### send(machine, event) → TransitionResult

1. Get current state from `machine.current_states["main"]`
2. Look up state config in `machine.states[current_state]`
3. Find transition: `state_config.on[event.name]`
4. If no transition found → return `{ handled: false }`
5. Evaluate guard (if present):
   - Parse guard expression
   - Evaluate against machine context
   - If false → return `{ handled: false }`
6. Execute exit actions from current state
7. Execute transition actions
8. Update current state to transition target
9. Execute entry actions on new state
10. Return `{ handled: true, new_state, actions_executed }`

## Guards

Guards are string expressions evaluated against context:

```cue
guards: {
    canToggle: "!context.disabled && !context.readOnly"
    isChecked: "context.checked === true"
}
```

### Evaluation Rules

- `context.X` references the machine's context
- Boolean operators: `&&`, `||`, `!`
- Comparisons: `===`, `!==`, `>`, `<`, `>=`, `<=`
- Parentheses for grouping

## Actions

Actions are named mutations or side effects:

```cue
actions: {
    toggle: {
        mutation: "context.checked = !context.checked"
    }
    setFocused: {
        mutation: "context.focused = true"
    }
}
```

### Execution Order

1. **Exit actions**: From current state's `exit` array
2. **Transition actions**: From transition's `actions` array
3. **Entry actions**: From target state's `entry` array

## TransitionResult

```cue
#TransitionResult: {
    handled: bool
    new_state?: string
    actions_executed: [...string]
}
```

## Invariants

```cue
invariants: [
    // Determinism
    "same input → same output across Rust and TypeScript",
    
    // Guard semantics
    "guard failure prevents state change",
    "guard failure prevents action execution",
    
    // Action ordering
    "exit actions execute before transition actions",
    "transition actions execute before entry actions",
    
    // State validity
    "current_state is always a valid state in machine.states",
]
```

## Test Vectors

Implementations should pass these test cases:

### Test 1: Simple Transition
```json
{
  "input": {
    "machine": { "id": "test", "initial": "a", "states": { "a": { "on": { "GO": "b" } }, "b": {} } },
    "event": { "name": "GO" }
  },
  "expected": { "handled": true, "new_state": "a.b" }
}
```

### Test 2: Guard Blocks Transition
```json
{
  "input": {
    "machine": { "id": "test", "initial": "a", "context": { "allowed": false },
      "states": { "a": { "on": { "GO": { "target": "b", "guard": "context.allowed" } } }, "b": {} } },
    "event": { "name": "GO" }
  },
  "expected": { "handled": false }
}
```

### Test 3: Guard Allows Transition
```json
{
  "input": {
    "machine": { "id": "test", "initial": "a", "context": { "allowed": true },
      "states": { "a": { "on": { "GO": { "target": "b", "guard": "context.allowed" } } }, "b": {} } },
    "event": { "name": "GO" }
  },
  "expected": { "handled": true, "new_state": "b" }
}
```
