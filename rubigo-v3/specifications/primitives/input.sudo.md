---
type: primitive
description: Text input field for user text entry
---

# Input

A text input field for user text entry with focus, typing, and validation states.

## Requirements

```sudolang
// Input primitive requirements

The input provides single-line text entry.
Users type text via keyboard when focused.

Constraints:
  - Disabled state blocks all interactions
  - Read-only state allows focus but not editing
  - Value changes emit onChange event

Keyboard Interaction:
  - Tab: Focus/unfocus input
  - Any key: Append to value (when focused and editable)
  - Backspace: Remove last character
  - Enter: Submit/blur (optional)

Error Handling:
  - Invalid input displays error state
  - Screen readers announce errors
```

---

## Design Guidelines

```sudolang
Visual Design:
  Touch target: minimum 44px height
  Border: visible focus ring on keyboard focus
  Transition: 150ms for state changes

States:
  - Default: neutral border
  - Focused: accent border, focus ring
  - Error: error border color
  - Disabled: reduced opacity

Placeholder:
  - Shown when value is empty
  - Lighter text color than content
```

---

## Component API

```sudolang
interface Input {
  // State inputs
  disabled = false
  
  // Callbacks
  onChange: () => void
  
  // Content
  children: slot
}
```

## Formal Model

```quint
module input {
  var value: str
  var disabled: bool
  var readOnly: bool
  var focused: bool
  var error: str
  var _state: str
  var _action: str

  action init = all {
    value' = "",
    disabled' = false,
    readOnly' = false,
    focused' = false,
    error' = "",
    _state' = "idle",
    _action' = "init"
  }

  action focus = all {
    not(disabled),
    focused' = true,
    value' = value,
    disabled' = disabled,
    readOnly' = readOnly,
    error' = error,
    _state' = "focused",
    _action' = "FOCUS"
  }

  action blur = all {
    focused,
    focused' = false,
    value' = value,
    disabled' = disabled,
    readOnly' = readOnly,
    error' = error,
    _state' = "idle",
    _action' = "BLUR"
  }

  action change = all {
    focused,
    not(disabled),
    not(readOnly),
    value' = "changed",
    focused' = focused,
    disabled' = disabled,
    readOnly' = readOnly,
    error' = error,
    _state' = _state,
    _action' = "CHANGE"
  }

  action step = any {
    focus,
    blur,
    change
  }

  val canEdit = focused and not(disabled) and not(readOnly)
  val hasError = error != ""
}
```

---

## Test Vectors

```test-vectors
- scenario: "focus when enabled"
  given:
    context: { value: "", disabled: false, readOnly: false, focused: false, error: "" }
    state: "idle"
  when: FOCUS
  then:
    context: { value: "", disabled: false, readOnly: false, focused: true, error: "" }
    state: "focused"

- scenario: "cannot focus when disabled"
  given:
    context: { value: "", disabled: true, readOnly: false, focused: false, error: "" }
    state: "idle"
  when: FOCUS
  then:
    context: { value: "", disabled: true, readOnly: false, focused: false, error: "" }
    state: "idle"

- scenario: "change value when focused"
  given:
    context: { value: "", disabled: false, readOnly: false, focused: true, error: "" }
    state: "focused"
  when: CHANGE
  then:
    context: { value: "hello", disabled: false, readOnly: false, focused: true, error: "" }
    state: "focused"

- scenario: "cannot change when read-only"
  given:
    context: { value: "", disabled: false, readOnly: true, focused: true, error: "" }
    state: "focused"
  when: CHANGE
  then:
    context: { value: "", disabled: false, readOnly: true, focused: true, error: "" }
    state: "focused"

- scenario: "blur from focused"
  given:
    context: { value: "test", disabled: false, readOnly: false, focused: true, error: "" }
    state: "focused"
  when: BLUR
  then:
    context: { value: "test", disabled: false, readOnly: false, focused: false, error: "" }
    state: "idle"
```

---

## Context Schema

```cue
context: {
    value:    ""      // Current input text
    disabled: false   // Whether input is disabled
    readOnly: false   // Whether input is read-only
    focused:  false   // Whether input has focus
    error:    ""      // Error message (empty = no error)
}
```

---

## State Machine

```cue
machine: {
    id:      "input"
    initial: "idle"
    
    states: {
        idle: {
            on: {
                FOCUS: {target: "focused", actions: ["setFocused"], guard: "canFocus"}
            }
        }
        focused: {
            on: {
                BLUR:   {target: "idle", actions: ["clearFocused"]}
                CHANGE: {target: "focused", actions: ["setValue"], guard: "canEdit"}
            }
        }
    }
}
```

---

## Guards

```cue
guards: {
    canFocus: "!context.disabled"
    canEdit:  "context.focused && !context.disabled && !context.readOnly"
}
```

---

## Actions

```cue
actions: {
    setFocused: {
        mutation: "context.focused = true"
    }
    clearFocused: {
        mutation: "context.focused = false"
    }
    setValue: {
        mutation:    "context.value = event.payload.value"
        emits:       ["onChange"]
    }
}
```

---

## Accessibility

```sudolang
Role: textbox
ARIA attributes:
  - aria-disabled: reflects context.disabled
  - aria-readonly: reflects context.readOnly
  - aria-invalid: reflects context.error !== ""
  - aria-errormessage: ID of error element when error present

Focus Management:
  - Must be focusable via Tab when not disabled
  - Focus ring visible on keyboard focus

Screen Reader:
  - Announce placeholder when empty
  - Announce error messages on validation failure
```
