/**
 * Tabs Conformance Tests
 *
 * Tests the Tabs component against unified test vectors.
 */

import { describe, test, expect } from 'bun:test';
import { Machine, type MachineConfig } from '../statechart';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load unified vectors
const vectorsPath = join(import.meta.dir, '../../../generated/test-vectors/tabs.unified.json');
const specPath = join(import.meta.dir, '../../../generated/tabs.json');

interface TabsContext {
    selectedId: string;
    focusedId: string;
}

interface Step {
    event: string;
    payload?: Record<string, unknown>;
    before: { context: TabsContext; state: string };
    after: { context: TabsContext; state: string };
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

interface TabsSpec {
    context: TabsContext;
    machine: any;
    guards: Record<string, string>;
    actions: Record<string, { mutation: string }>;
}

function createTabsConfig(spec: TabsSpec, context: TabsContext, initialState: string): MachineConfig<TabsContext> {
    return {
        id: spec.machine.id,
        initial: initialState,
        context: { ...context },
        states: spec.machine.states,
        guards: {},
        actions: spec.actions,
    };
}

describe('Tabs Conformance Tests', () => {
    test('runs all scenarios from unified vectors', () => {
        const vectors: UnifiedVectors = JSON.parse(readFileSync(vectorsPath, 'utf-8'));
        const spec: TabsSpec = JSON.parse(readFileSync(specPath, 'utf-8'));

        console.log(`Running ${vectors.scenarios.length} tabs conformance scenarios...`);

        for (const scenario of vectors.scenarios) {
            for (let i = 0; i < scenario.steps.length; i++) {
                const step = scenario.steps[i];

                // Create machine with before state and context
                const config = createTabsConfig(spec, step.before.context, step.before.state);
                const machine = new Machine(config);

                // Send the event (with payload if present)
                if (step.payload) {
                    machine.send({ name: step.event, payload: step.payload });
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

                console.log(`  ✓ [${scenario.source}] ${scenario.name} - Step ${i + 1}: ${step.event}`);
            }
        }

        console.log(`✅ All ${vectors.scenarios.length} tabs scenarios passed`);
    });
});
