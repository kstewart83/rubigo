---
description: Create a new V3 SolidJS component from spec
---

# V3 Component Creation Workflow

Create a new component following the spec-driven pattern.

## Prerequisites
- Spec file exists at `specifications/primitives/{component}.sudo.md`
- Build system is working (`just spec-gen` runs successfully)

## Steps

### 1. Review the Spec
Read the spec file to understand:
- Component API (props interface)
- State machine (states, events, transitions)
- Guards and actions
- Test vectors
- Accessibility requirements

```bash
cat rubigo-v3/specifications/primitives/{component}.sudo.md
```

### 2. Generate Artifacts
// turbo
```bash
cd rubigo-v3 && just spec-gen
```
This creates `generated/{component}.json` and `generated/{component}.meta.json`.

### 3. Create config.ts
Create `components-ts/{component}/config.ts`:
- Import spec from `../../generated/{component}.json`
- Define `{Component}Context` interface matching spec context
- Create `{component}Config` with MachineConfig type
- Create `create{Component}Config(overrides?)` factory that sets initial state based on context

**Important**: The factory must set `initial` state based on context values (e.g., if `checked: true`, initial should be `'checked'`).

### 4. Create use{Component} Hook
Create `components-ts/{component}/solid/use{Component}.ts`:
- Import `createSignal`, `createMemo`, `createEffect` from solid-js
- Import `createMachine` from statechart
- Import config from `../config`
- Define `Use{Component}Options` interface (props)
- Define `Use{Component}Return` interface (returned values)
- Implement hook:
  - Create machine with initial context from options
  - Add `[version, bump]` signal for reactivity
  - Add `createEffect` for each reactive prop (disabled, checked, etc.)
  - Implement action methods (toggle, reset, send, etc.)
  - Return `rootProps()` with:
    - ARIA attributes
    - `onClick` / `onKeyDown` / `onKeyUp` handlers
    - `tabIndex` for focus management

### 5. Create {Component}.tsx
Create `components-ts/{component}/solid/{Component}.tsx`:
- Import Component, splitProps, JSX from solid-js
- Import hook and CSS module
- Define `{Component}Props` interface extending options
- Use `splitProps` to separate styling props from hook options
- Call hook with options
- Apply dynamic CSS classes based on state
- Render appropriate HTML structure with `rootProps()`

### 6. Create {Component}.module.css
Create `components-ts/{component}/{Component}.module.css`:
- Import design tokens: `@import '../tokens/variables.css';`
- Define base `.{component}` class
- Add state classes: `.checked`, `.disabled`, `.indeterminate`, etc.
- Add interactive states: `:hover`, `:focus-visible`
- Use CSS custom properties for colors, borders, transitions

### 7. Update Component Index
Update `components-ts/{component}/index.ts`:
```typescript
export { {component}Config, create{Component}Config, type {Component}Context } from './config';
export { {Component}, type {Component}Props } from './solid/{Component}';
export { use{Component}, type Use{Component}Options, type Use{Component}Return } from './solid/use{Component}';
```

### 8. Update Library Index
Add export to `components-ts/index.ts`:
```typescript
export { {Component} } from './{component}/solid/{Component}';
```

### 9. Create Tests
Create `components-ts/{component}/solid/{Component}.test.tsx`:
- Test rendering (default state, with props)
- Test state changes (from spec test vectors)
- Test disabled behavior
- Test keyboard interaction
- Test ARIA attributes
- Test prop reactivity
- Test callbacks

// turbo
```bash
cd rubigo-v3/components-ts && npx vitest run
```

### 10. Add to POC
Update `gallery/frontend/src/SpecDrivenPOC.tsx`:

1. Import component and metadata:
```typescript
import { {Component} } from '@rubigo/components/{component}';
import {component}Meta from '@generated/{component}.meta.json';
```

2. Add to COMPONENTS registry:
```typescript
const COMPONENTS = {
    // ... existing
    {component}: { meta: {component}Meta, component: {Component}, defaultChildren: 'Label' },
};
```

3. Add callback handling in `componentProps()` if needed.

### 11. Commit
// turbo
```bash
git add -A && git commit -m "feat({component}): implement SolidJS {Component} component

- use{Component} hook with state machine
- {Component}.tsx with CSS module styling
- {Component}.test.tsx with X tests
- Added to POC component selector"
```

## File Structure After Completion
```
components-ts/
├── {component}/
│   ├── config.ts
│   ├── index.ts
│   ├── {Component}.module.css
│   └── solid/
│       ├── {Component}.tsx
│       ├── {Component}.test.tsx
│       └── use{Component}.ts
```

## Reference Files
- Button: `components-ts/button/` (complete example)
- Checkbox: `components-ts/checkbox/` (complete example)
