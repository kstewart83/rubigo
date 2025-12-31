---
type: primitive
description: Interactive button with loading, disabled, and pressed states
---

# Button

A button enables users to trigger actions. It supports loading states for async operations,
disabled states to prevent interaction, and pressed states for toggle-button behavior.

## Language References

| Language | Purpose | Reference |
|----------|---------|-----------| 
| Sudolang | Human intent, requirements, accessibility | `references/sudolang-v2.0.md` |
| Quint | Formal verification, invariants | `references/quint-lang.md` |
| CUE | Runtime config, type constraints | `references/cuelang-v0.15.1.md` |

---

## Requirements

```typescript
// Button Component Requirements

The button triggers actions when activated by click, touch, or keyboard.
It communicates current state via visual cues and ARIA attributes.

States:
  - idle: Default interactive state
  - pressed: Active/down state during click
  - loading: Async operation in progress
  
Constraints:
  - Disabled button blocks ALL interactions (click, keyboard, focus)
  - Loading state automatically disables further activation
  - Press must complete (press down + release) to trigger action
  - State changes are atomic and predictable

Keyboard Interaction:
  - Tab: Focus/unfocus the button
  - Space: Activate on key up (with pressed visual on key down)
  - Enter: Activate immediately (no pressed state)

Error Handling:
  - Failed async operations should exit loading state
  - Screen readers announce state changes
```

---

## Design Guidelines

```typescript
// Visual Design Guidelines

Visual Variants (styling concern, not state machine):
  primary, secondary, outline, ghost, destructive, link
  
Size Variants:
  sm, default, lg, icon

Visual States:
  Normal: Base appearance
  Hover: Slight background shift
  Focused: Visible focus ring (2px outline)
  Pressed: Darker background, slight scale/inset
  Loading: Spinner overlay, reduced opacity
  Disabled: 50% opacity, not-allowed cursor

Touch Targets:
  Minimum 44x44px for touch accessibility
  
Transition:
  All state changes: 150ms ease-out
```

---

## Component API

```typescript
interface ButtonProps {
  /** Prevents interaction when true */
  disabled?: boolean;  // default: false
  
  /** Shows loading state and blocks interaction */
  loading?: boolean;   // default: false
  
  /** Visual style variant */
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "link";  // default: "primary"
  
  /** Size of the button */
  size?: "sm" | "md" | "lg" | "icon";  // default: "md"
  
  /** Called when button is activated */
  onClick?: () => void;
  
  /** Button label content */
  children: Slot;
}
```

---

## Formal Model

```quint
module button {
  // State variables
  var disabled: bool
  var loading: bool
  var pressed: bool
  var focused: bool  // Visual focus state
  var state: str  // "idle" | "pressed" | "loading" - matches CUE state machine
  var _action: str  // Tracks action name for ITF traces
  
  // Initialize
  action init = all {
    disabled' = false,
    loading' = false,
    pressed' = false,
    focused' = false,
    state' = "idle",
    _action' = "init"
  }
  
  // Click action - high-level composite event (triggers from idle)
  action click = all {
    not(disabled),
    not(loading),
    state == "idle",  // Can only click from idle state
    pressed' = false,
    disabled' = disabled,
    loading' = loading,
    focused' = focused,
    state' = "idle",
    _action' = "CLICK"
  }
  
  // Press down (mouse down or space key down)
  action pressDown = all {
    not(disabled),
    not(loading),
    pressed' = true,
    disabled' = disabled,
    loading' = loading,
    focused' = focused,
    state' = "pressed",
    _action' = "PRESS_DOWN"
  }
  
  // Press up (mouse up or space key up) - triggers action
  action pressUp = all {
    pressed,
    pressed' = false,
    disabled' = disabled,
    loading' = loading,
    focused' = focused,
    state' = "idle",
    _action' = "PRESS_UP"
  }
  
  // Cancel press (mouse leaves while pressed)
  action cancelPress = all {
    pressed,  // guard: can only cancel when pressed
    pressed' = false,
    disabled' = disabled,
    loading' = loading,
    focused' = focused,
    state' = "idle",
    _action' = "PRESS_CANCEL"
  }
  
  // Start loading (async operation)
  action startLoading = all {
    not(disabled),
    not(loading),  // guard: can only start loading when not already loading
    not(pressed),  // guard: can only start loading from idle state
    loading' = true,
    pressed' = false,
    disabled' = disabled,
    focused' = focused,
    state' = "loading",
    _action' = "START_LOADING"
  }
  
  // Stop loading (async complete)
  action stopLoading = all {
    loading,  // guard: can only stop when loading
    loading' = false,
    disabled' = disabled,
    pressed' = false,
    focused' = focused,
    state' = "idle",
    _action' = "STOP_LOADING"
  }
  
  // Focus the button
  action focus = all {
    focused' = true,
    pressed' = pressed,
    disabled' = disabled,
    loading' = loading,
    state' = state,
    _action' = "FOCUS"
  }
  
  // Blur the button (lose focus)
  action blur = all {
    focused' = false,
    pressed' = pressed,
    disabled' = disabled,
    loading' = loading,
    state' = state,
    _action' = "BLUR"
  }
  
  // Reset to initial state (global event - works from any state)
  action reset = all {
    disabled' = false,
    loading' = false,
    pressed' = false,
    focused' = false,
    state' = "idle",
    _action' = "RESET"
  }
  
  // Step action for simulation (excludes init - that's for initialization only)
  action step = any {
    click,
    pressDown,
    pressUp,
    cancelPress,
    startLoading,
    stopLoading,
    focus,
    blur,
    reset
  }
  
  // Invariants
  val pressed_is_boolean = pressed == true or pressed == false
  val loading_is_boolean = loading == true or loading == false
  val disabled_is_boolean = disabled == true or disabled == false
  val focused_is_boolean = focused == true or focused == false
  val state_is_valid = state == "idle" or state == "pressed" or state == "loading"
}
```

---

## Test Vectors

```test-vectors
# Button conformance test scenarios

- scenario: "click triggers action"
  given:
    context: { disabled: false, loading: false, pressed: false, focused: false }
    state: "idle"
  when: CLICK
  then:
    context: { disabled: false, loading: false, pressed: false, focused: false }
    state: "idle"

- scenario: "disabled blocks click"
  given:
    context: { disabled: true, loading: false, pressed: false, focused: false }
    state: "idle"
  when: CLICK
  then:
    context: { disabled: true, loading: false, pressed: false, focused: false }
    state: "idle"

- scenario: "press down shows pressed"
  given:
    context: { disabled: false, loading: false, pressed: false, focused: false }
    state: "idle"
  when: PRESS_DOWN
  then:
    context: { disabled: false, loading: false, pressed: true, focused: false }
    state: "pressed"

- scenario: "press up clears pressed"
  given:
    context: { disabled: false, loading: false, pressed: true, focused: false }
    state: "pressed"
  when: PRESS_UP
  then:
    context: { disabled: false, loading: false, pressed: false, focused: false }
    state: "idle"

- scenario: "loading blocks press"
  given:
    context: { disabled: false, loading: true, pressed: false, focused: false }
    state: "loading"
  when: PRESS_DOWN
  then:
    context: { disabled: false, loading: true, pressed: false, focused: false }
    state: "loading"

- scenario: "start loading"
  given:
    context: { disabled: false, loading: false, pressed: false, focused: false }
    state: "idle"
  when: START_LOADING
  then:
    context: { disabled: false, loading: true, pressed: false, focused: false }
    state: "loading"

- scenario: "stop loading returns to idle"
  given:
    context: { disabled: false, loading: true, pressed: false, focused: false }
    state: "loading"
  when: STOP_LOADING
  then:
    context: { disabled: false, loading: false, pressed: false, focused: false }
    state: "idle"
```

---

## Context Schema

```cue
context: {
    disabled: false   // Whether button is disabled
    loading:  false   // Whether async operation is in progress
    pressed:  false   // Whether button is currently pressed down
    focused:  false   // Whether button has visual focus
}
```

---

## State Machine

```cue
machine: {
    id:      "button"
    initial: "idle"
    
    // Global events apply from any state
    global: {
        RESET: {target: "idle", actions: ["resetContext"]}
    }
    
    states: {
        idle: {
            on: {
                CLICK:         {target: "idle", actions: ["triggerAction"], guard: "canInteract"}
                PRESS_DOWN:    {target: "pressed", actions: ["setPressedTrue"], guard: "canInteract"}
                START_LOADING: {target: "loading", actions: ["setLoadingTrue"], guard: "canInteract"}
                FOCUS:         {target: "idle", actions: ["setFocused"]}
                BLUR:          {target: "idle", actions: ["clearFocused"]}
            }
        }
        pressed: {
            on: {
                PRESS_UP:      {target: "idle", actions: ["setPressedFalse", "triggerAction"]}
                PRESS_CANCEL:  {target: "idle", actions: ["setPressedFalse"]}
                FOCUS:         {target: "pressed", actions: ["setFocused"]}
                BLUR:          {target: "pressed", actions: ["clearFocused"]}
            }
        }
        loading: {
            on: {
                STOP_LOADING:  {target: "idle", actions: ["setLoadingFalse"]}
                FOCUS:         {target: "loading", actions: ["setFocused"]}
                BLUR:          {target: "loading", actions: ["clearFocused"]}
            }
        }
    }
}
```

---

## Guards

```cue
guards: {
    canInteract: "!context.disabled && !context.loading"
}
```

---

## Actions

```cue
actions: {
    triggerAction: {
        description: "Emit click/activation event"
        mutation:    ""
        emits:       ["onClick"]
    }
    setPressedTrue: {
        description: "Set pressed state to true"
        mutation:    "context.pressed = true"
    }
    setPressedFalse: {
        description: "Set pressed state to false"
        mutation:    "context.pressed = false"
    }
    setLoadingTrue: {
        description: "Start loading state"
        mutation:    "context.loading = true; context.pressed = false"
    }
    setLoadingFalse: {
        description: "End loading state"
        mutation:    "context.loading = false"
    }
    setFocused: {
        mutation: "context.focused = true"
    }
    clearFocused: {
        mutation: "context.focused = false"
    }
    resetContext: {
        description: "Reset all context to initial values"
        mutation:    "context.disabled = false; context.loading = false; context.pressed = false; context.focused = false"
    }
}
```

---

## Accessibility

```typescript
// Button Accessibility Requirements

Role: button (native <button> element preferred)

ARIA Attributes:
  - aria-disabled: Reflects context.disabled
  - aria-busy: Reflects context.loading  
  - aria-pressed: For toggle buttons only (not standard buttons)

Focus Management:
  - Focusable via Tab when enabled (!disabled)
  - Not focusable when disabled (no tabindex or tabindex="-1")
  - Focus ring visible on keyboard focus

Screen Reader:
  - Announce button label and role
  - Announce "disabled" when disabled
  - Announce "loading" or "busy" during async operations
```

---

## State Diagram

```mermaid
stateDiagram-v2
    [*] --> idle
    idle --> pressed: PRESS_DOWN [canInteract]
    idle --> loading: START_LOADING [canInteract]
    idle --> idle: CLICK [canInteract] / triggerAction
    pressed --> idle: PRESS_UP / triggerAction
    pressed --> idle: PRESS_CANCEL
    loading --> idle: STOP_LOADING
```
