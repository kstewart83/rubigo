# Rubigo Component Specification Template

This document defines the structure of `.sudo.md` specification files.
Specs use a **three-layer approach** combining Sudolang, Quint, and CUE.

## Language References

| Language | Purpose | Reference |
|----------|---------|-----------|
| **Sudolang** | Human intent, requirements, accessibility | `references/sudolang-v2.0.md` |
| **Quint** | Formal verification, invariants, state logic | `references/quint-lang.md` |
| **CUE** | Runtime config generation, type constraints | `references/cuelang-v0.15.1.md` |

---

## Frontmatter

Every spec starts with YAML frontmatter:

```yaml
---
type: component           # or "schema"
description: Brief description
---
```

| Type | Description | Validation |
|------|-------------|------------|
| `component` | UI component with state machine | Full validation |
| `schema` | Type definitions only | CUE syntax only |

---

## Layer 1: Requirements (Sudolang)

Natural language specification for humans and LLMs.
Use Sudolang for intent, constraints, and UX requirements.

**Best used for:**
- User requirements and design intent
- Accessibility guidelines
- Edge cases and error handling
- LLM implementation guidance

```sudolang
The switch represents a binary on/off control.
Users can toggle via click, touch, or keyboard.

Constraints:
  - Disabled switches cannot be toggled by any means
  - Toggling must update checked state atomically
  - Screen readers announce state changes

Accessibility:
  Role: switch
  ARIA: aria-checked reflects checked state
  Keyboard: Space and Enter trigger toggle
```

---

## Layer 2: Formal Model (Quint)

Verifiable behavioral specification. The model checker proves invariants
and generates counterexamples when properties are violated.

**Best used for:**
- State machine behavior
- Guards and conditions
- Invariants and properties
- Temporal logic (always, eventually)

```quint
module switch {
  // State variables
  var checked: bool
  var disabled: bool
  var readOnly: bool
  var state: str  // "idle" | "focused"

  // Actions
  action init = all {
    checked' = false,
    disabled' = false,
    readOnly' = false,
    state' = "idle"
  }

  action toggle = all {
    not(disabled),
    not(readOnly),
    checked' = not(checked),
    state' = state
  }

  action focus = all {
    state' = "focused"
  }

  action blur = all {
    state' = "idle"
  }

  // Invariants (properties that must always hold)
  val disabled_blocks_toggle = 
    disabled implies unchanged(checked)

  val state_is_valid = 
    state == "idle" or state == "focused"

  // Temporal property: focus always leads to eventual blur
  temporal focus_blur_cycle = 
    always(state == "focused" implies eventually(state == "idle"))
}
```

Run verification: `quint run switch.qnt --invariant=disabled_blocks_toggle`

---

## Layer 3: Runtime Config (CUE)

Machine-readable configuration exported to JSON for interpreters.

**Best used for:**
- Concrete data structures
- Default values
- Type constraints
- Generated config for TS/Rust interpreters

### Context Schema

```cue
context: {
    checked:  false   // Current toggle state
    disabled: false   // If true, all interactions blocked
    readOnly: false   // If true, user cannot change value
    focused:  false   // Currently has keyboard focus
}
```

### State Machine

```cue
machine: {
    id:      "switch"
    initial: "idle"
    
    states: {
        idle: {
            on: {
                FOCUS:  { target: "focused", actions: ["setFocused"] }
                TOGGLE: { target: "idle", actions: ["toggle"], guard: "canToggle" }
            }
        }
        focused: {
            on: {
                BLUR:   { target: "idle", actions: ["clearFocused"] }
                TOGGLE: { target: "focused", actions: ["toggle"], guard: "canToggle" }
            }
        }
    }
}
```

### Guards

```cue
guards: {
    canToggle: "!context.disabled && !context.readOnly"
}
```

### Actions

```cue
actions: {
    toggle: {
        mutation: "context.checked = !context.checked"
        emits:    ["onCheckedChange"]
    }
    setFocused: {
        mutation: "context.focused = true"
    }
    clearFocused: {
        mutation: "context.focused = false"
    }
}
```

---

## Validation Rules

The build system validates specs at compile time:

| Check | Description |
|-------|-------------|
| Frontmatter | Type must be `component` or `schema` |
| Title (H1) | Required for all specs |
| CUE blocks | Must pass `cue vet` |
| Quint blocks | Must pass `quint typecheck` (optional) |

For `component` specs, required sections:
- Context Schema
- State Machine
- Guards
- Actions

---

## Complete Example Structure

```markdown
---
type: component
description: Binary toggle switch control
---

# Switch Component

## Requirements

\`\`\`sudolang
The switch represents a binary on/off control.
[... constraints, accessibility, etc.]
\`\`\`

## Formal Model

\`\`\`quint
module switch {
  var checked: bool
  var disabled: bool
  // [... actions, invariants ...]
}
\`\`\`

## Context Schema

\`\`\`cue
context: {
    checked:  false
    disabled: false
}
\`\`\`

## State Machine

\`\`\`cue
machine: { ... }
\`\`\`

## Guards

\`\`\`cue
guards: { ... }
\`\`\`

## Actions

\`\`\`cue
actions: { ... }
\`\`\`
```

---

## When to Use Each Layer

| Question | Use |
|----------|-----|
| "What should this feel like to users?" | Sudolang |
| "Will this always be true?" | Quint invariant |
| "What happens when X then Y?" | Quint action/temporal |
| "What's the JSON structure?" | CUE |
| "What's the default value?" | CUE |
| "How do we handle screen readers?" | Sudolang |
