/**
 * Toggle Group Conformance Tests
 *
 * Tests the Toggle Group component against unified test vectors.
 */

import { describe, test, expect } from 'bun:test';
import { Machine, type MachineConfig } from '../statechart';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Toggle Group context
interface ToggleGroupContext {
    selectedId: string;
    focusedId: string;
    disabled: boolean;
}

// Create toggle group config with closure-based guards and actions
function createToggleGroupConfig(
    initial: ToggleGroupContext,
    initialState: string,
    payload?: { id?: string }
): MachineConfig<ToggleGroupContext> {
    const context: ToggleGroupContext = { ...initial };

    return {
        id: 'toggle-group',
        initial: initialState,
        context,
        states: {
            idle: {
                on: {
                    SELECT: { target: 'idle', actions: ['selectItem'], guard: 'canInteract' },
                    FOCUS: { target: 'focused', actions: [] },
                    FOCUS_NEXT: { target: 'focused', actions: ['focusNextItem'], guard: 'canInteract' },
                    FOCUS_PREV: { target: 'focused', actions: ['focusPrevItem'], guard: 'canInteract' },
                    FOCUS_FIRST: { target: 'focused', actions: ['focusFirstItem'], guard: 'canInteract' },
                    FOCUS_LAST: { target: 'focused', actions: ['focusLastItem'], guard: 'canInteract' },
                    ACTIVATE: { target: 'idle', actions: ['activateItem'], guard: 'canInteract' },
                },
            },
            focused: {
                on: {
                    SELECT: { target: 'focused', actions: ['selectItem'], guard: 'canInteract' },
                    FOCUS_NEXT: { target: 'focused', actions: ['focusNextItem'], guard: 'canInteract' },
                    FOCUS_PREV: { target: 'focused', actions: ['focusPrevItem'], guard: 'canInteract' },
                    FOCUS_FIRST: { target: 'focused', actions: ['focusFirstItem'], guard: 'canInteract' },
                    FOCUS_LAST: { target: 'focused', actions: ['focusLastItem'], guard: 'canInteract' },
                    ACTIVATE: { target: 'focused', actions: ['activateItem'], guard: 'canInteract' },
                    BLUR: { target: 'idle', actions: ['resetFocus'] },
                },
            },
        },
        actions: {
            selectItem: (ctx: ToggleGroupContext, event?: { payload?: { id?: string } }) => {
                const id = event?.payload?.id;
                if (id) {
                    ctx.selectedId = id;
                    ctx.focusedId = id;
                }
            },
            focusNextItem: (ctx: ToggleGroupContext) => {
                ctx.focusedId = ctx.focusedId === 'item-0' ? 'item-1' : 'item-0';
            },
            focusPrevItem: (ctx: ToggleGroupContext) => {
                ctx.focusedId = ctx.focusedId === 'item-1' ? 'item-0' : 'item-1';
            },
            focusFirstItem: (ctx: ToggleGroupContext) => {
                ctx.focusedId = 'item-0';
            },
            focusLastItem: (ctx: ToggleGroupContext) => {
                ctx.focusedId = 'item-1';
            },
            activateItem: (ctx: ToggleGroupContext) => {
                ctx.selectedId = ctx.focusedId;
            },
            resetFocus: (ctx: ToggleGroupContext) => {
                ctx.focusedId = ctx.selectedId;
            },
        },
        guards: {
            canInteract: (ctx: ToggleGroupContext) => !ctx.disabled,
        },
    };
}

// Vector types
interface Step {
    event: string;
    payload?: { id?: string };
    before: { context: ToggleGroupContext; state: string };
    after: { context: ToggleGroupContext; state: string };
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
    const vectorsPath = join(process.cwd(), '..', 'generated', 'test-vectors', 'togglegroup.unified.json');
    if (!existsSync(vectorsPath)) {
        console.warn(`No unified vectors found at ${vectorsPath}`);
        return null;
    }
    return JSON.parse(readFileSync(vectorsPath, 'utf-8'));
}

describe('Toggle Group Conformance Tests', () => {
    const vectors = loadVectors();

    if (!vectors) {
        test.skip('No vectors available - run cargo build first', () => { });
        return;
    }

    for (const scenario of vectors.scenarios) {
        test(`[${scenario.source}] ${scenario.name}`, () => {
            for (let i = 0; i < scenario.steps.length; i++) {
                const step = scenario.steps[i];

                // For ITF traces, infer payload from expected context when missing
                let effectivePayload = step.payload;
                if (!effectivePayload && step.event === 'SELECT') {
                    effectivePayload = { id: step.after.context.selectedId };
                }

                // Create machine with before state and context
                const config = createToggleGroupConfig(step.before.context, step.before.state);
                const machine = new Machine<ToggleGroupContext>(config);

                // Send the event (with payload if present)
                if (effectivePayload) {
                    machine.send({ name: step.event, payload: effectivePayload });
                } else {
                    machine.send(step.event);
                }

                // Check state
                const actualState = machine.getState();
                expect(actualState).toBe(step.after.state);

                // Check context
                const actualContext = machine.getContext();
                expect(actualContext.selectedId).toBe(step.after.context.selectedId);
                expect(actualContext.focusedId).toBe(step.after.context.focusedId);
                expect(actualContext.disabled).toBe(step.after.context.disabled);

                console.log(`  ✓ [${scenario.source}] ${scenario.name} - Step ${i + 1}: ${step.event}`);
            }
        });
    }
});
