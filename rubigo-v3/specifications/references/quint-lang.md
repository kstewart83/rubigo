# Quint Language Reference

Quint is an executable specification language for formal verification,
based on TLA+ but with programmer-friendly syntax.

**Full documentation:** https://quint-lang.org/docs/lang

---

## Quick Reference

### Modules and Variables

```quint
module MyModule {
  // Constants (rigid variables)
  const N: int
  const Procs: Set[str]

  // State variables (flexible)
  var checked: bool
  var count: int
  var state: str
}
```

### Definitions

```quint
// Pure function (no state access)
pure def double(x: int): int = x * 2

// Value (can read state)
val isPositive = count > 0

// Action (can modify state)
action increment = {
  count' = count + 1
}
```

### Actions and Assignments

```quint
// x' = e assigns value e to x in the NEXT state
action toggle = {
  checked' = not(checked)
}

// Multiple assignments with all { }
action reset = all {
  count' = 0,
  checked' = false,
  state' = "idle"
}
```

### Guards and Conditions

```quint
// Use all { } for conjunction (AND)
action toggleIfEnabled = all {
  not(disabled),       // guard: must be true
  not(readOnly),       // guard: must be true
  checked' = not(checked)  // action: update state
}

// Use any { } for disjunction (OR)
action step = any {
  toggle,
  focus,
  blur
}
```

### Invariants (Properties)

```quint
// Values that must always be true
val never_negative = count >= 0

val disabled_blocks_toggle = 
  disabled implies unchanged(checked)

// unchanged(x) means x' = x
```

### Temporal Operators

```quint
// always: holds in every state
temporal always_valid = always(count >= 0)

// eventually: holds in some future state
temporal will_terminate = eventually(state == "done")

// leads to: if A then eventually B
temporal focus_leads_to_blur = 
  (state == "focused") leads to (state == "idle")
```

### Control Flow

```quint
// If-then-else
if (count > 0) count - 1 else 0

// Match (pattern matching)
match state {
  | "idle" => 0
  | "focused" => 1
  | _ => -1
}
```

### Types

| Type | Example |
|------|---------|
| `bool` | `true`, `false` |
| `int` | `0`, `42`, `-1` |
| `str` | `"hello"` |
| `Set[T]` | `Set(1, 2, 3)` |
| `List[T]` | `[1, 2, 3]` |
| `T -> U` | Map from T to U |
| `(T, U)` | Tuple |
| `{ field: T }` | Record |

---

## CLI Commands

```bash
# Type check
quint typecheck myspec.qnt

# Run simulation
quint run myspec.qnt

# Check invariant
quint run myspec.qnt --invariant=my_invariant

# Generate trace (test vector)
quint run myspec.qnt --out-itf=trace.json
```

---

## Installation

```bash
# Global install
npm install -g @informalsystems/quint

# Or use npx
npx @informalsystems/quint run myspec.qnt
```

---

## Example: Switch Formal Model

```quint
module switch {
  var checked: bool
  var disabled: bool
  var state: str  // "idle" | "focused"

  action init = all {
    checked' = false,
    disabled' = false,
    state' = "idle"
  }

  action toggle = all {
    not(disabled),
    checked' = not(checked),
    state' = state
  }

  action focus = {
    state' = "focused"
  }

  action blur = {
    state' = "idle"
  }

  action step = any {
    toggle,
    focus,
    blur
  }

  // Invariants
  val disabled_blocks_toggle = 
    disabled implies unchanged(checked)

  val valid_state = 
    state == "idle" or state == "focused"
}
```
