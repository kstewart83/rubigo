---
description: Create a new Rubigo V3 component from spec to integration
---

# /v3-comp Workflow

Creates a new Rubigo V3 component following the spec-first architecture with **both TypeScript/SolidJS and Rust/WASM** implementations.

## Command Format

```
/v3-comp <component-name>
```

Example: `/v3-comp input`

---

## Step 1: Clarify Design Intent

If the component is not obvious, ask clarifying questions:
- What is the primary purpose?
- What states does it have?
- What user interactions does it support?
- Are there any special accessibility requirements?

---

## Step 2: Research Component UX

Research the component by examining:

1. **ShadCN UI**: https://ui.shadcn.com/docs/components
   - Understand their API design and prop naming conventions
   
2. **Zag.js**: https://zagjs.com/components
   - Study their state machine implementation
   - Note keyboard interactions and ARIA attributes

3. **ARIA Authoring Practices**: https://www.w3.org/WAI/ARIA/apg/patterns/
   - Identify required ARIA roles and attributes
   - Document keyboard interaction requirements

4. **Radix UI**: https://www.radix-ui.com/primitives
   - Reference for headless component patterns

Document findings briefly before proceeding.

---

## Step 3: Review Spec Template

Read the template file to understand the required spec structure:

```
// turbo
cat specifications/TEMPLATE.md
```

Key sections for primitive components:
- Requirements (Sudolang)
- Component API (TypeScript interface)
- Formal Model (Quint)
- Test Vectors
- Context Schema (CUE)
- State Machine (CUE)
- Guards (CUE)
- Actions (CUE)
- Accessibility (Sudolang)

---

## Step 4: Create Component Specification

Create the spec file at `specifications/primitives/<component>.sudo.md`:

1. Copy structure from TEMPLATE.md
2. Fill in all required sections based on research
3. Define the Component API with TypeScript interface
4. Model the state machine in CUE
5. Write Quint formal model for invariants
6. Add test vectors for key scenarios

---

## Step 5: Validate and Generate Artifacts

Build to validate the spec and generate artifacts:

```
// turbo
just build
```

This generates:
- `generated/<component>.json` - State machine config
- `generated/<component>.meta.json` - Component metadata
- `generated/<component>.types.ts` - TypeScript types

Fix any validation errors **and warnings** before proceeding.

---

# Part A: TypeScript / SolidJS Implementation

---

## Step 6: Create Component Config (TS)

Create `components-ts/<component>/config.ts`:

```typescript
import spec from '../../generated/<component>.json';
import type { MachineConfig } from '../statechart';

export interface <Component>Context {
  // Context properties from spec
}

export const <component>Config: MachineConfig<<Component>Context> = {
  id: spec.machine.id,
  initial: spec.machine.initial,
  context: spec.context as <Component>Context,
  states: spec.machine.states,
  guards: spec.guards,
  actions: spec.actions,
};

export function create<Component>Config(
  overrides?: Partial<<Component>Context>
): MachineConfig<<Component>Context> {
  // Set initial state based on context if needed
  return { ...<component>Config, context: { ...<component>Config.context, ...overrides } };
}
```

---

## Step 7: Create SolidJS Hook

Create `components-ts/<component>/solid/use<Component>.ts`:

1. Define `Use<Component>Options` and `Use<Component>Return` interfaces
2. Create state machine instance with `createMachine`
3. Add `createEffect` hooks for prop synchronization
4. Implement public methods (e.g., toggle, setValue, reset)
5. Build `rootProps` with ARIA attributes and event handlers
6. Return reactive accessors and methods

Follow the pattern from `useButton.ts` or `useCheckbox.ts`.

---

## Step 8: Create SolidJS Component

Create `components-ts/<component>/solid/<Component>.tsx`:

1. Import the hook and CSS module
2. Define `<Component>Props` interface
3. Use `splitProps` to separate component-specific props
4. Call `use<Component>` hook with options
5. Apply dynamic CSS classes based on state
6. Render with `rootProps()` spread

---

## Step 9: Create CSS Module

Create `components-ts/<component>/<Component>.module.css`:

1. Import shared design tokens: `@import '../tokens/variables.css';`
2. Define base styles using `--rubigo-*` variables
3. Add state-specific styles (disabled, focused, etc.)
4. Ensure dark mode compatibility via CSS variables

---

## Step 10: Create Component Tests (TS)

Create `components-ts/<component>/solid/<Component>.test.tsx`:

1. Test rendering and default state
2. Test prop reactivity (use `createSignal`)
3. Test user interactions (click, keyboard)
4. Test disabled state blocks interactions
5. Test ARIA attributes
6. Test callbacks fire with correct values

Run tests:
```
// turbo
cd components-ts && npx vitest run
```

---

## Step 11: Update TS Exports

Update `components-ts/<component>/index.ts`:
```typescript
export { <component>Config, create<Component>Config, type <Component>Context } from './config';
export { <Component>, type <Component>Props } from './solid/<Component>';
export { use<Component>, type Use<Component>Options, type Use<Component>Return } from './solid/use<Component>';
```

Update `components-ts/index.ts`:
```typescript
export { <Component> } from './<component>/solid/<Component>';
```

---

## Step 12: Add to POC Gallery

Update `gallery/frontend/src/SpecDrivenPOC.tsx`:

1. Import the component and its metadata
2. Add to `COMPONENTS` registry
3. Test in browser to verify controls and preview work

---

# Part B: Rust / WASM Implementation

---

## Step 13: Create Rust WASM Component

Create `components-rs/components/<component>/src/main.rs`:

```rust
//! <Component> Component WASM Entry Point

use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

/// <Component> context - the extended state
#[derive(Debug, Clone, Serialize, Deserialize)]
#[wasm_bindgen]
pub struct <Component>Context {
    // Context fields from spec
}

#[wasm_bindgen]
impl <Component>Context {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            // Default values
        }
    }
}

/// <Component> state enum
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum <Component>State {
    // States from spec
}

/// <Component> component - wraps state machine and context
#[wasm_bindgen]
pub struct <Component> {
    context: <Component>Context,
    state: <Component>State,
}

#[wasm_bindgen]
impl <Component> {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            context: <Component>Context::new(),
            state: <Component>State::default(),
        }
    }

    // Guards
    fn can_act(&self) -> bool {
        !self.context.disabled
    }

    // Event handlers matching spec
    pub fn send_event(&mut self, event: &str) -> bool {
        // Match events to state transitions
        false
    }

    // ARIA attributes as JSON
    pub fn aria_attrs(&self) -> String {
        format!(r#"{{"role":"<role>","aria-disabled":"{}"}}"#, self.context.disabled)
    }
}

#[wasm_bindgen(start)]
pub fn main() {}
```

---

## Step 14: Update Rust Cargo Configuration

Update `components-rs/components/Cargo.toml` to add the new component as a binary target:

```toml
[[bin]]
name = "<component>"
path = "<component>/src/main.rs"
```

---

## Step 15: Build and Test WASM

Build the Rust WASM component:

```
// turbo
cd components-rs/components && cargo build --target wasm32-unknown-unknown --release
```

Verify the WASM file is generated at `target/wasm32-unknown-unknown/release/<component>.wasm`.

---

## Step 16: Create Rust Unit Tests

Add tests in `components-rs/components/<component>/src/main.rs` or a separate test module:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_initial_state() {
        let comp = <Component>::new();
        // Assert initial values
    }

    #[test]
    fn test_disabled_blocks_interaction() {
        let mut comp = <Component>::new();
        comp.context.disabled = true;
        // Assert interaction blocked
    }
}
```

Run Rust tests:
```
// turbo
cd components-rs/components && cargo test
```

---

# Part C: Finalize

---

## Step 17: Commit

```
git add -A && git commit -m "feat(<component>): implement <Component> component

TypeScript/SolidJS:
- config.ts, use<Component>.ts hook, <Component>.tsx component
- CSS module with design tokens
- Comprehensive test suite

Rust/WASM:
- WASM entry point with wasm_bindgen
- State machine and context structs
- Unit tests"
```

---

## Checklist

### Specification
- [ ] Spec created at `specifications/primitives/<component>.sudo.md`
- [ ] `just build` passes with no errors/warnings

### TypeScript/SolidJS
- [ ] `components-ts/<component>/config.ts`
- [ ] `components-ts/<component>/solid/use<Component>.ts`
- [ ] `components-ts/<component>/solid/<Component>.tsx`
- [ ] `components-ts/<component>/<Component>.module.css`
- [ ] `components-ts/<component>/solid/<Component>.test.tsx` (all pass)
- [ ] Exports updated (component and library index)
- [ ] Added to POC gallery `COMPONENTS` registry

### Rust/WASM
- [ ] `components-rs/components/<component>/src/main.rs`
- [ ] Added to `Cargo.toml` as binary target
- [ ] WASM builds successfully
- [ ] Rust unit tests pass

### Final
- [ ] Committed with conventional commit message
