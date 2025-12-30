/**
 * WASM Conformance Tests
 * 
 * Tests the compiled WASM module against unified test vectors.
 * This isolates the WASM layer from browser integration issues.
 * 
 * Loads the actual wasm-pack output and runs spec conformance tests.
 */

import { describe, test, expect, beforeAll } from 'bun:test';
import { readFileSync } from 'fs';
import { join } from 'path';

// WASM module paths (relative paths from tests directory)
// import.meta.dir = components-ts/tests, project root = ../..
const WASM_JS_PATH = '../../frontend/src/wasm/rubigo_statechart.js';
const WASM_BIN_PATH = '../../frontend/src/wasm/rubigo_statechart_bg.wasm';
const VECTORS_PATH = '../../generated/test-vectors/switch.unified.json';
const SPEC_PATH = '../../generated/switch.json';

// Types
interface TestContext {
    checked: boolean;
    disabled: boolean;
    readOnly: boolean;
    focused: boolean;
}

interface Step {
    event: string;
    before: { context: TestContext; state: string };
    after: { context: TestContext; state: string };
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

interface SwitchSpec {
    context: TestContext;
    machine: any;
    guards: Record<string, string>;
    actions: Record<string, { mutation: string }>;
}

// Global WASM module
let WasmMachine: any;
let initSync: any;
let wasmInitialized = false;

describe('WASM Conformance Tests', () => {
    beforeAll(async () => {
        try {
            // Load WASM binary
            const wasmPath = join(import.meta.dir, WASM_BIN_PATH);
            const wasmBuffer = readFileSync(wasmPath);

            // Import the JS glue code
            const wasmModule = await import(WASM_JS_PATH);
            WasmMachine = wasmModule.WasmMachine;
            initSync = wasmModule.initSync;

            // Initialize WASM synchronously with the buffer
            initSync(wasmBuffer);
            wasmInitialized = true;

            console.log('✓ WASM module loaded successfully');
        } catch (error) {
            console.error('Failed to load WASM:', error);
            throw error;
        }
    });

    test('WASM module loads correctly', () => {
        expect(wasmInitialized).toBe(true);
        expect(WasmMachine).toBeDefined();
    });

    describe('Spec Conformance', () => {
        test('runs all scenarios from unified vectors', () => {
            // Load spec and vectors
            const specPath = join(import.meta.dir, SPEC_PATH);
            const vectorsPath = join(import.meta.dir, VECTORS_PATH);

            const spec: SwitchSpec = JSON.parse(readFileSync(specPath, 'utf-8'));
            const vectors: UnifiedVectors = JSON.parse(readFileSync(vectorsPath, 'utf-8'));

            console.log(`Running ${vectors.scenarios.length} WASM conformance scenarios...`);

            for (const scenario of vectors.scenarios) {
                for (let i = 0; i < scenario.steps.length; i++) {
                    const step = scenario.steps[i];

                    // Build machine config from spec with before context
                    const machineConfig = {
                        id: spec.machine.id,
                        initial: spec.machine.initial,
                        context: {
                            checked: step.before.context.checked,
                            disabled: step.before.context.disabled,
                            readOnly: step.before.context.readOnly,
                            focused: step.before.context.focused,
                        },
                        states: spec.machine.states,
                        actions: spec.actions,
                        guards: spec.guards,
                    };

                    if (i === 0 && scenario.name === 'toggle from idle unchecked') {
                        console.log('  Config being passed:', JSON.stringify(machineConfig, null, 2));
                    }

                    // Create WASM machine
                    const machine = new WasmMachine(JSON.stringify(machineConfig));

                    // If before expects focused, send FOCUS first
                    if (step.before.context.focused) {
                        machine.send('FOCUS');
                    }

                    // Send the event
                    const result = machine.send(step.event);
                    if (i === 0 && scenario.name === 'toggle from idle unchecked') {
                        console.log('  Send result:', JSON.stringify(result));
                    }

                    // Get context and compare
                    const actualContext = machine.getContext();
                    console.log('  Raw getContext():', JSON.stringify(actualContext));

                    const expected = step.after.context;
                    const actual = {
                        checked: actualContext.checked,
                        disabled: actualContext.disabled,
                        readOnly: actualContext.readOnly,
                        focused: actualContext.focused,
                    };

                    expect(actual).toEqual(expected);

                    console.log(`  ✓ [${scenario.source}] ${scenario.name} - Step ${i + 1}: ${step.event}`);

                    // Clean up
                    machine.free();
                }
            }

            console.log(`✅ All ${vectors.scenarios.length} WASM scenarios passed`);
        });
    });
});
