/**
 * Checkbox Spec Conformance Test: TypeScript Statechart Interpreter
 * 
 * Tests the checkbox primitive component against unified test vectors.
 */

import { test, expect, describe } from 'bun:test';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Machine, type MachineConfig } from '../statechart/machine';

// Checkbox context
interface CheckboxContext {
    checked: boolean;
    disabled: boolean;
    indeterminate: boolean;
}

// Create checkbox config from initial context
function createCheckboxConfig(initial: Partial<CheckboxContext>, initialState: string): MachineConfig<CheckboxContext> {
    const context: CheckboxContext = {
        checked: initial.checked ?? false,
        disabled: initial.disabled ?? false,
        indeterminate: initial.indeterminate ?? false,
    };

    return {
        id: 'checkbox',
        initial: initialState,
        context,
        states: {
            unchecked: {
                on: {
                    TOGGLE: { target: 'checked', actions: ['setChecked'], guard: 'canToggle' },
                    SET_CHECKED: { target: 'checked', actions: ['setChecked'], guard: 'canToggle' },
                    SET_INDETERMINATE: { target: 'indeterminate', actions: ['setIndeterminate'], guard: 'canToggle' },
                },
            },
            checked: {
                on: {
                    TOGGLE: { target: 'unchecked', actions: ['setUnchecked'], guard: 'canToggle' },
                    SET_UNCHECKED: { target: 'unchecked', actions: ['setUnchecked'], guard: 'canToggle' },
                    SET_INDETERMINATE: { target: 'indeterminate', actions: ['setIndeterminate'], guard: 'canToggle' },
                },
            },
            indeterminate: {
                on: {
                    TOGGLE: { target: 'checked', actions: ['setChecked'], guard: 'canToggle' },
                    SET_CHECKED: { target: 'checked', actions: ['setChecked'], guard: 'canToggle' },
                    SET_UNCHECKED: { target: 'unchecked', actions: ['setUnchecked'], guard: 'canToggle' },
                },
            },
        },
        // Closure-based actions - full language power, type-safe
        actions: {
            setChecked: (ctx: CheckboxContext) => {
                ctx.checked = true;
                ctx.indeterminate = false;
            },
            setUnchecked: (ctx: CheckboxContext) => {
                ctx.checked = false;
                ctx.indeterminate = false;
            },
            setIndeterminate: (ctx: CheckboxContext) => {
                ctx.indeterminate = true;
            },
        },
        // Closure-based guard - can have complex logic
        guards: {
            canToggle: (ctx: CheckboxContext) => !ctx.disabled,
        },
    };
}

// Vector types
interface Step {
    event: string;
    before: { context: CheckboxContext; state: string };
    after: { context: CheckboxContext; state: string };
}

interface Scenario {
    name: string;
    source: 'yaml' | 'itf';
    steps: Step[];
}

interface UnifiedVectors {
    component: string;
    scenarios: Scenario[];
}

// Load unified vectors
function loadVectors(): UnifiedVectors | null {
    const vectorsPath = join(process.cwd(), '..', 'generated', 'test-vectors', 'checkbox.unified.json');
    if (!existsSync(vectorsPath)) {
        console.warn(`No unified vectors found at ${vectorsPath}`);
        return null;
    }
    return JSON.parse(readFileSync(vectorsPath, 'utf-8'));
}

describe('Checkbox Spec Conformance', () => {
    const vectors = loadVectors();

    if (!vectors) {
        test.skip('No vectors available - run just unify-vectors first', () => { });
        return;
    }

    for (const scenario of vectors.scenarios) {
        test(`[${scenario.source}] ${scenario.name}`, () => {
            const step = scenario.steps[0]; // Each scenario has one step in our format

            // Create machine with initial state from step
            const config = createCheckboxConfig(step.before.context, step.before.state);
            const machine = new Machine<CheckboxContext>(config);

            // Send the event
            machine.send(step.event);

            // Compare result with expected
            expect(machine.getState()).toBe(step.after.state);
            const ctx = machine.getContext();
            expect(ctx.checked).toBe(step.after.context.checked);
            expect(ctx.disabled).toBe(step.after.context.disabled);
            expect(ctx.indeterminate).toBe(step.after.context.indeterminate);
        });
    }
});
