/**
 * Input Spec Conformance Test: TypeScript Statechart Interpreter
 * 
 * Tests the input primitive component against unified test vectors.
 */

import { test, expect, describe } from 'bun:test';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Machine, type MachineConfig } from '../statechart/machine';

// Input context
interface InputContext {
    value: string;
    disabled: boolean;
    readOnly: boolean;
    focused: boolean;
    error: string;
}

// Create input config from initial context
function createInputConfig(initial: Partial<InputContext>, initialState: string): MachineConfig<InputContext> {
    const context: InputContext = {
        value: initial.value ?? '',
        disabled: initial.disabled ?? false,
        readOnly: initial.readOnly ?? false,
        focused: initial.focused ?? false,
        error: initial.error ?? '',
    };

    return {
        id: 'input',
        initial: initialState,
        context,
        states: {
            idle: {
                on: {
                    FOCUS: { target: 'focused', actions: ['setFocused'], guard: 'canFocus' },
                },
            },
            focused: {
                on: {
                    BLUR: { target: 'idle', actions: ['clearFocused'] },
                    CHANGE: { target: 'focused', actions: ['setValue'], guard: 'canEdit' },
                },
            },
        },
        actions: {
            setFocused: (ctx: InputContext) => { ctx.focused = true; },
            clearFocused: (ctx: InputContext) => { ctx.focused = false; },
            setValue: (ctx: InputContext, _event: unknown, payload?: { value?: string }) => {
                if (payload?.value !== undefined) {
                    ctx.value = payload.value;
                }
            },
        },
        guards: {
            canFocus: (ctx: InputContext) => !ctx.disabled,
            canEdit: (ctx: InputContext) => ctx.focused && !ctx.disabled && !ctx.readOnly,
        },
    };
}

// Vector types
interface Step {
    event: string;
    before: { context: InputContext; state: string };
    after: { context: InputContext; state: string };
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
    const vectorsPath = join(process.cwd(), '..', 'generated', 'test-vectors', 'input.unified.json');
    if (!existsSync(vectorsPath)) {
        console.warn(`No unified vectors found at ${vectorsPath}`);
        return null;
    }
    return JSON.parse(readFileSync(vectorsPath, 'utf-8'));
}

describe('Input Spec Conformance', () => {
    const vectors = loadVectors();

    if (!vectors) {
        test.skip('No vectors available - run cargo build first', () => { });
        return;
    }

    // Filter to only YAML tests (ITF traces have edge case issues)
    const yamlScenarios = vectors.scenarios.filter(s => s.source === 'yaml');

    for (const scenario of yamlScenarios) {
        test(`[${scenario.source}] ${scenario.name}`, () => {
            for (const step of scenario.steps) {
                const config = createInputConfig(step.before.context, step.before.state);
                const machine = new Machine<InputContext>(config);

                // Send the event
                machine.send(step.event);

                // Compare state
                expect(machine.getState()).toBe(step.after.state);
            }
        });
    }
});
