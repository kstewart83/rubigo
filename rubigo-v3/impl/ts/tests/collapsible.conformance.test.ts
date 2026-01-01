/**
 * Collapsible Spec Conformance Test: TypeScript Statechart Interpreter
 * 
 * Tests the collapsible primitive component against unified test vectors.
 */

import { test, expect, describe } from 'bun:test';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Machine, type MachineConfig } from '../statechart/machine';

// Collapsible context
interface CollapsibleContext {
    open: boolean;
    disabled: boolean;
}

// Create collapsible config from initial context
function createCollapsibleConfig(initial: Partial<CollapsibleContext>, initialState: string): MachineConfig<CollapsibleContext> {
    const context: CollapsibleContext = {
        open: initial.open ?? false,
        disabled: initial.disabled ?? false,
    };

    return {
        id: 'collapsible',
        initial: initialState,
        context,
        states: {
            collapsed: {
                on: {
                    TOGGLE: { target: 'expanded', actions: ['expand'], guard: 'canInteract' },
                    EXPAND: { target: 'expanded', actions: ['expand'], guard: 'canInteract' },
                },
            },
            expanded: {
                on: {
                    TOGGLE: { target: 'collapsed', actions: ['collapse'], guard: 'canInteract' },
                    COLLAPSE: { target: 'collapsed', actions: ['collapse'], guard: 'canInteract' },
                },
            },
        },
        // Closure-based actions
        actions: {
            expand: (ctx: CollapsibleContext) => {
                ctx.open = true;
            },
            collapse: (ctx: CollapsibleContext) => {
                ctx.open = false;
            },
        },
        // Closure-based guard
        guards: {
            canInteract: (ctx: CollapsibleContext) => !ctx.disabled,
        },
    };
}

// Vector types
interface Step {
    event: string;
    before: { context: CollapsibleContext; state: string };
    after: { context: CollapsibleContext; state: string };
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
    const vectorsPath = join(process.cwd(), '..', 'generated', 'test-vectors', 'collapsible.unified.json');
    if (!existsSync(vectorsPath)) {
        console.warn(`No unified vectors found at ${vectorsPath}`);
        return null;
    }
    return JSON.parse(readFileSync(vectorsPath, 'utf-8'));
}

describe('Collapsible Spec Conformance', () => {
    const vectors = loadVectors();

    if (!vectors) {
        test.skip('No vectors available - run cargo build first', () => { });
        return;
    }

    for (const scenario of vectors.scenarios) {
        test(`[${scenario.source}] ${scenario.name}`, () => {
            for (const step of scenario.steps) {
                // Create machine with initial state from step
                // Infer open from state if missing in context (ITF traces)
                const before = step.before.context;
                if (before.open === undefined) {
                    before.open = step.before.state === 'expanded';
                }

                const config = createCollapsibleConfig(before, step.before.state);
                const machine = new Machine<CollapsibleContext>(config);

                // Send the event
                machine.send(step.event);

                // Infer expected open from state if missing (ITF traces)
                const expectedOpen = step.after.context.open ?? (step.after.state === 'expanded');

                // Compare result with expected
                expect(machine.getState()).toBe(step.after.state);
                const ctx = machine.getContext();
                expect(ctx.open).toBe(expectedOpen);
                expect(ctx.disabled).toBe(step.after.context.disabled);
            }
        });
    }
});
