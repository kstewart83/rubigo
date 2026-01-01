/**
 * Spec Conformance Test: TypeScript Statechart Interpreter
 * 
 * Consumes unified test vectors (derived from specifications) and verifies
 * the TS interpreter produces the correct results for every scenario.
 * 
 * These tests validate conformance to the specification, NOT comparison
 * to any other implementation.
 */

import { test, expect, describe } from 'bun:test';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Machine } from '../statechart/machine';
import { createSwitchConfig, SwitchContext } from '../switch/config';

// Types matching unified vector format
interface Context {
    checked: boolean;
    disabled: boolean;
    readOnly: boolean;
    focused: boolean;
}

interface Step {
    event: string;
    before: { context: Context; state: string };
    after: { context: Context; state: string };
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
function loadVectors(component: string): UnifiedVectors | null {
    // Vectors are at project root, not in components-ts
    const vectorsPath = join(process.cwd(), '..', 'generated', 'test-vectors', `${component}.unified.json`);
    if (!existsSync(vectorsPath)) {
        console.warn(`No unified vectors found at ${vectorsPath}`);
        console.warn('Run: just unify-vectors');
        return null;
    }
    return JSON.parse(readFileSync(vectorsPath, 'utf-8'));
}

// Map event names from vector format to machine events
function mapEvent(event: string): string {
    const mapping: Record<string, string> = {
        'TOGGLE': 'TOGGLE',
        'FOCUS': 'FOCUS',
        'BLUR': 'BLUR',
        'toggle': 'TOGGLE',
        'focus': 'FOCUS',
        'blur': 'BLUR'
    };
    return mapping[event] || event;
}

// Extract relevant context fields for comparison
function normalizeContext(ctx: any): Context {
    return {
        checked: Boolean(ctx.checked),
        disabled: Boolean(ctx.disabled),
        readOnly: Boolean(ctx.readOnly),
        focused: Boolean(ctx.focused)
    };
}

describe('Switch Spec Conformance', () => {
    const vectors = loadVectors('switch');

    if (!vectors) {
        test.skip('No vectors available - run just unify-vectors first', () => { });
        return;
    }

    for (const scenario of vectors.scenarios) {
        describe(`[${scenario.source}] ${scenario.name}`, () => {
            for (let i = 0; i < scenario.steps.length; i++) {
                const step = scenario.steps[i];

                test(`Step ${i + 1}: ${step.event}`, () => {
                    // Create fresh machine with initial state from step
                    const config = createSwitchConfig({
                        checked: step.before.context.checked,
                        disabled: step.before.context.disabled,
                        readOnly: step.before.context.readOnly
                    });

                    const machine = new Machine<SwitchContext>(config);

                    // If the before state expects focused=true, send FOCUS to get there
                    if (step.before.context.focused) {
                        machine.send('FOCUS');
                    }

                    // Send the event
                    const event = mapEvent(step.event);
                    machine.send(event);

                    // Compare result with expected (from spec)
                    const actualContext = normalizeContext(machine.context);
                    const expectedContext = normalizeContext(step.after.context);

                    expect(actualContext).toEqual(expectedContext);
                });
            }
        });
    }
});
