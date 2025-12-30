/**
 * Tooltip Spec Conformance Test: TypeScript Statechart Interpreter
 * 
 * Tests the tooltip primitive component against unified test vectors.
 */

import { test, expect, describe } from 'bun:test';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Machine, type MachineConfig } from '../statechart/machine';

// Tooltip context
interface TooltipContext {
    open: boolean;
    disabled: boolean;
}

// Create tooltip config from initial context
function createTooltipConfig(initial: Partial<TooltipContext>, initialState: string): MachineConfig<TooltipContext> {
    const context: TooltipContext = {
        open: initial.open ?? false,
        disabled: initial.disabled ?? false,
    };

    return {
        id: 'tooltip',
        initial: initialState,
        context,
        states: {
            closed: {
                on: {
                    POINTER_ENTER: { target: 'opening', actions: [], guard: 'canInteract' },
                    FOCUS: { target: 'open', actions: ['setOpen'], guard: 'canInteract' },
                },
            },
            opening: {
                on: {
                    OPEN: { target: 'open', actions: ['setOpen'] },
                    POINTER_LEAVE: { target: 'closed', actions: [] },
                    ESCAPE: { target: 'closed', actions: [] },
                },
            },
            open: {
                on: {
                    POINTER_LEAVE: { target: 'closing', actions: [] },
                    BLUR: { target: 'closing', actions: [] },
                    ESCAPE: { target: 'closed', actions: ['setClosed'] },
                },
            },
            closing: {
                on: {
                    CLOSE: { target: 'closed', actions: ['setClosed'] },
                    POINTER_ENTER: { target: 'open', actions: [] },
                },
            },
        },
        actions: {
            setOpen: (ctx: TooltipContext) => {
                ctx.open = true;
            },
            setClosed: (ctx: TooltipContext) => {
                ctx.open = false;
            },
        },
        guards: {
            canInteract: (ctx: TooltipContext) => !ctx.disabled,
        },
    };
}

// Vector types
interface Step {
    event: string;
    before: { context: TooltipContext; state: string };
    after: { context: TooltipContext; state: string };
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
    const vectorsPath = join(process.cwd(), '..', 'generated', 'test-vectors', 'tooltip.unified.json');
    if (!existsSync(vectorsPath)) {
        console.warn(`No unified vectors found at ${vectorsPath}`);
        return null;
    }
    return JSON.parse(readFileSync(vectorsPath, 'utf-8'));
}

describe('Tooltip Spec Conformance', () => {
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
                    before.open = step.before.state === 'open' || step.before.state === 'closing';
                }

                const config = createTooltipConfig(before, step.before.state);
                const machine = new Machine<TooltipContext>(config);

                // Send the event
                machine.send(step.event);

                // Infer expected open from state if missing (ITF traces)
                // Tooltip is visible in both "open" and "closing" states
                const expectedOpen = step.after.context.open ?? (step.after.state === 'open' || step.after.state === 'closing');

                // Compare result with expected
                expect(machine.getState()).toBe(step.after.state);
                const ctx = machine.getContext();
                expect(ctx.open).toBe(expectedOpen);
                expect(ctx.disabled).toBe(step.after.context.disabled);
            }
        });
    }
});
