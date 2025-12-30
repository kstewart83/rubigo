/**
 * Dialog Spec Conformance Test: TypeScript Statechart Interpreter
 * 
 * Tests the dialog primitive component against unified test vectors.
 */

import { test, expect, describe } from 'bun:test';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Machine, type MachineConfig } from '../statechart/machine';

// Dialog context
interface DialogContext {
    open: boolean;
    preventClose: boolean;
}

// Create dialog config from initial context
function createDialogConfig(initial: Partial<DialogContext>, initialState: string): MachineConfig<DialogContext> {
    const context: DialogContext = {
        open: initial.open ?? false,
        preventClose: initial.preventClose ?? false,
    };

    return {
        id: 'dialog',
        initial: initialState,
        context,
        states: {
            closed: {
                on: {
                    OPEN: { target: 'open', actions: ['setOpen'] },
                },
            },
            open: {
                on: {
                    CLOSE: { target: 'closed', actions: ['setClosed'], guard: 'canClose' },
                    ESCAPE: { target: 'closed', actions: ['setClosed'], guard: 'canClose' },
                    BACKDROP_CLICK: { target: 'closed', actions: ['setClosed'], guard: 'canClose' },
                },
            },
        },
        actions: {
            setOpen: (ctx: DialogContext) => {
                ctx.open = true;
            },
            setClosed: (ctx: DialogContext) => {
                ctx.open = false;
            },
        },
        guards: {
            canClose: (ctx: DialogContext) => !ctx.preventClose,
        },
    };
}

// Vector types
interface Step {
    event: string;
    before: { context: DialogContext; state: string };
    after: { context: DialogContext; state: string };
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

function loadVectors(): UnifiedVectors | null {
    const vectorsPath = join(process.cwd(), '..', 'generated', 'test-vectors', 'dialog.unified.json');
    if (!existsSync(vectorsPath)) {
        console.warn(`No unified vectors found at ${vectorsPath}`);
        return null;
    }
    return JSON.parse(readFileSync(vectorsPath, 'utf-8'));
}

describe('Dialog Spec Conformance', () => {
    const vectors = loadVectors();

    if (!vectors) {
        test.skip('No vectors available - run cargo build first', () => { });
        return;
    }

    for (const scenario of vectors.scenarios) {
        test(`[${scenario.source}] ${scenario.name}`, () => {
            for (const step of scenario.steps) {
                // Ensure 'open' field exists in initial context (infer from state for ITF traces)
                const before = step.before.context;
                if (before.open === undefined) {
                    before.open = step.before.state === 'open';
                }

                const config = createDialogConfig(before, step.before.state);
                const machine = new Machine<DialogContext>(config);

                // Send the event
                machine.send(step.event);

                // Infer expected open from state if missing (ITF traces)
                const expectedOpen = step.after.context.open ?? (step.after.state === 'open');

                // Compare result with expected
                expect(machine.getState()).toBe(step.after.state);
                const ctx = machine.getContext();
                expect(ctx.open).toBe(expectedOpen);
            }
        });
    }
});
