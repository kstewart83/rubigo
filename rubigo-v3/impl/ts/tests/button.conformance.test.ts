/**
 * Button Conformance Tests
 *
 * Tests the Button component against unified test vectors.
 */

import { describe, test, expect } from 'bun:test';
import { Machine, type MachineConfig } from '../statechart';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load unified vectors
const vectorsPath = join(import.meta.dir, '../../../generated/test-vectors/button.unified.json');
const specPath = join(import.meta.dir, '../../../generated/button.json');

interface ButtonContext {
    disabled: boolean;
    loading: boolean;
    pressed: boolean;
}

interface Step {
    event: string;
    before: { context: ButtonContext; state: string };
    after: { context: ButtonContext; state: string };
}

interface Scenario {
    name: string;
    source: string;
    steps: Step[];
}

interface UnifiedVectors {
    component: string;
    scenarios: Scenario[];
}

interface ButtonSpec {
    context: ButtonContext;
    machine: any;
    guards: Record<string, string>;
    actions: Record<string, { mutation: string }>;
}

function createButtonConfig(spec: ButtonSpec, context: ButtonContext, initialState: string): MachineConfig<ButtonContext> {
    return {
        id: spec.machine.id,
        initial: initialState,
        context: { ...context },
        states: spec.machine.states,
        guards: {
            canInteract: (ctx: ButtonContext) => !ctx.disabled && !ctx.loading,
        },
        actions: {
            triggerAction: {
                mutation: "", // No mutation, just emits event
            },
            setPressedTrue: {
                mutation: "context.pressed = true",
            },
            setPressedFalse: {
                mutation: "context.pressed = false",
            },
            setLoadingTrue: {
                mutation: "context.loading = true; context.pressed = false",
            },
            setLoadingFalse: {
                mutation: "context.loading = false",
            },
            setFocused: {
                mutation: "", // Ignored for core test
            },
            clearFocused: {
                mutation: "", // Ignored for core test
            },
        },
    };
}

describe('Button Conformance Tests', () => {
    test('runs all scenarios from unified vectors', () => {
        const vectors: UnifiedVectors = JSON.parse(readFileSync(vectorsPath, 'utf-8'));
        const spec: ButtonSpec = JSON.parse(readFileSync(specPath, 'utf-8'));

        console.log(`Running ${vectors.scenarios.length} button conformance scenarios...`);

        for (const scenario of vectors.scenarios) {
            for (let i = 0; i < scenario.steps.length; i++) {
                const step = scenario.steps[i];

                // Create machine with before state and context
                const config = createButtonConfig(spec, step.before.context, step.before.state);
                const machine = new Machine(config);

                // Send the event
                machine.send(step.event);

                // Check state
                const actualState = machine.getState();
                expect(actualState).toBe(step.after.state);

                // Check context
                const actualContext = machine.getContext();
                expect(actualContext.disabled).toBe(step.after.context.disabled);
                expect(actualContext.loading).toBe(step.after.context.loading);
                expect(actualContext.pressed).toBe(step.after.context.pressed);

                console.log(`  ✓ [${scenario.source}] ${scenario.name} - Step ${i + 1}: ${step.event}`);
            }
        }

        console.log(`✅ All ${vectors.scenarios.length} button scenarios passed`);
    });
});
