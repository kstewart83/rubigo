/**
 * Slider Spec Conformance Test: TypeScript Statechart Interpreter
 * 
 * Tests the slider primitive component against unified test vectors.
 */

import { test, expect, describe } from 'bun:test';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Machine, type MachineConfig } from '../statechart/machine';

// Slider context
interface SliderContext {
    value: number;
    min: number;
    max: number;
    stepSize: number;
    disabled: boolean;
    dragging: boolean;
    focused: boolean;
}

// Create slider config from initial context
function createSliderConfig(initial: Partial<SliderContext>, initialState: string): MachineConfig<SliderContext> {
    const context: SliderContext = {
        value: initial.value ?? 50,
        min: initial.min ?? 0,
        max: initial.max ?? 100,
        stepSize: initial.stepSize ?? 1,
        disabled: initial.disabled ?? false,
        dragging: initial.dragging ?? false,
        focused: initial.focused ?? false,
    };

    return {
        id: 'slider',
        initial: initialState,
        context,
        states: {
            idle: {
                on: {
                    FOCUS: { target: 'focused', actions: ['setFocused'], guard: 'canInteract' },
                    DRAG_START: { target: 'dragging', actions: ['setDragging'], guard: 'canInteract' },
                },
            },
            focused: {
                on: {
                    BLUR: { target: 'idle', actions: ['clearFocused'] },
                    INCREMENT: { target: 'focused', actions: ['increment'] },
                    DECREMENT: { target: 'focused', actions: ['decrement'] },
                    SET_MIN: { target: 'focused', actions: ['setMin'] },
                    SET_MAX: { target: 'focused', actions: ['setMax'] },
                    DRAG_START: { target: 'dragging', actions: ['setDragging'] },
                },
            },
            dragging: {
                on: {
                    DRAG_END: { target: 'idle', actions: ['clearDragging'] },
                    SET_MIN: { target: 'dragging', actions: ['setMin'] },
                    SET_MAX: { target: 'dragging', actions: ['setMax'] },
                },
            },
        },
        actions: {
            setFocused: (ctx: SliderContext) => { ctx.focused = true; },
            clearFocused: (ctx: SliderContext) => { ctx.focused = false; },
            setDragging: (ctx: SliderContext) => { ctx.dragging = true; },
            clearDragging: (ctx: SliderContext) => { ctx.dragging = false; },
            increment: (ctx: SliderContext) => { ctx.value = Math.min(ctx.max, ctx.value + ctx.stepSize); },
            decrement: (ctx: SliderContext) => { ctx.value = Math.max(ctx.min, ctx.value - ctx.stepSize); },
            setMin: (ctx: SliderContext) => { ctx.value = ctx.min; },
            setMax: (ctx: SliderContext) => { ctx.value = ctx.max; },
        },
        guards: {
            canInteract: (ctx: SliderContext) => !ctx.disabled,
        },
    };
}

// Vector types
interface Step {
    event: string;
    before: { context: SliderContext; state: string };
    after: { context: SliderContext; state: string };
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
    const vectorsPath = join(process.cwd(), '..', 'generated', 'test-vectors', 'slider.unified.json');
    if (!existsSync(vectorsPath)) {
        console.warn(`No unified vectors found at ${vectorsPath}`);
        return null;
    }
    return JSON.parse(readFileSync(vectorsPath, 'utf-8'));
}

describe('Slider Spec Conformance', () => {
    const vectors = loadVectors();

    if (!vectors) {
        test.skip('No vectors available - run cargo build first', () => { });
        return;
    }

    for (const scenario of vectors.scenarios) {
        test(`[${scenario.source}] ${scenario.name}`, () => {
            for (const step of scenario.steps) {
                const config = createSliderConfig(step.before.context, step.before.state);
                const machine = new Machine<SliderContext>(config);

                // Send the event
                machine.send(step.event);

                // Compare state
                expect(machine.getState()).toBe(step.after.state);
            }
        });
    }
});
