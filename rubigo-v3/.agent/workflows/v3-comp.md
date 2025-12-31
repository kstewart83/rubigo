---
description: Create a new Rubigo V3 component from spec to integration
---

# /v3-comp Workflow

Creates a new Rubigo V3 component following the spec-first architecture.

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

## Step 6: Create Component Config

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

## Step 10: Create Component Tests

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

## Step 11: Update Exports

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

## Step 13: Commit

```
git add -A && git commit -m "feat(<component>): implement <Component> component

- Spec: requirements, state machine, test vectors
- Hook: use<Component> with state management
- Component: <Component>.tsx with styling
- Tests: comprehensive test suite
- Gallery: added to POC selector"
```

---

## Checklist

- [ ] Spec created and validated (`just build` passes)
- [ ] config.ts with machine config
- [ ] use<Component>.ts hook
- [ ] <Component>.tsx component
- [ ] <Component>.module.css styles
- [ ] <Component>.test.tsx tests (all pass)
- [ ] Exports updated (component and library index)
- [ ] Added to POC gallery
- [ ] Committed with conventional commit message
