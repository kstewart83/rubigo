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

// === Checkbox WASM Conformance ===

const CHECKBOX_VECTORS_PATH = '../../generated/test-vectors/checkbox.unified.json';
const CHECKBOX_SPEC_PATH = '../../generated/checkbox.json';

interface CheckboxContext {
    checked: boolean;
    disabled: boolean;
    indeterminate: boolean;
}

interface CheckboxStep {
    event: string;
    before: { context: CheckboxContext; state: string };
    after: { context: CheckboxContext; state: string };
}

interface CheckboxScenario {
    name: string;
    source: string;
    steps: CheckboxStep[];
}

interface CheckboxVectors {
    component: string;
    scenarios: CheckboxScenario[];
}

interface CheckboxSpec {
    context: CheckboxContext;
    machine: any;
    guards: Record<string, string>;
    actions: Record<string, { mutation: string }>;
}

describe('WASM Checkbox Conformance Tests', () => {
    test('runs all checkbox scenarios from unified vectors', () => {
        if (!wasmInitialized) {
            console.log('WASM not initialized, skipping checkbox tests');
            return;
        }

        // Load spec and vectors
        const specPath = join(import.meta.dir, CHECKBOX_SPEC_PATH);
        const vectorsPath = join(import.meta.dir, CHECKBOX_VECTORS_PATH);

        const spec: CheckboxSpec = JSON.parse(readFileSync(specPath, 'utf-8'));
        const vectors: CheckboxVectors = JSON.parse(readFileSync(vectorsPath, 'utf-8'));

        console.log(`Running ${vectors.scenarios.length} WASM checkbox conformance scenarios...`);

        for (const scenario of vectors.scenarios) {
            for (let i = 0; i < scenario.steps.length; i++) {
                const step = scenario.steps[i];

                // Build machine config from spec with before context and state
                const machineConfig = {
                    id: spec.machine.id,
                    initial: step.before.state, // Use state from vector, not spec default
                    context: {
                        checked: step.before.context.checked,
                        disabled: step.before.context.disabled,
                        indeterminate: step.before.context.indeterminate,
                    },
                    states: spec.machine.states,
                    actions: spec.actions,
                    guards: spec.guards,
                };

                // Create WASM machine
                const machine = new WasmMachine(JSON.stringify(machineConfig));

                // Send the event
                const result = machine.send(step.event);

                // Get context and compare
                const actualContext = machine.getContext();

                const expected = step.after.context;
                const actual = {
                    checked: actualContext.checked,
                    disabled: actualContext.disabled,
                    indeterminate: actualContext.indeterminate,
                };

                expect(actual).toEqual(expected);

                console.log(`  ✓ [${scenario.source}] ${scenario.name} - Step ${i + 1}: ${step.event}`);

                // Clean up
                machine.free();
            }
        }

        console.log(`✅ All ${vectors.scenarios.length} WASM checkbox scenarios passed`);
    });
});

// === Button WASM Conformance ===

const BUTTON_VECTORS_PATH = '../../generated/test-vectors/button.unified.json';
const BUTTON_SPEC_PATH = '../../generated/button.json';

interface ButtonContext {
    disabled: boolean;
    loading: boolean;
    pressed: boolean;
}

interface ButtonStep {
    event: string;
    before: { context: ButtonContext; state: string };
    after: { context: ButtonContext; state: string };
}

interface ButtonScenario {
    name: string;
    source: string;
    steps: ButtonStep[];
}

interface ButtonVectors {
    component: string;
    scenarios: ButtonScenario[];
}

interface ButtonSpec {
    context: ButtonContext;
    machine: any;
    guards: Record<string, string>;
    actions: Record<string, { mutation: string }>;
}

describe('WASM Button Conformance Tests', () => {
    test('runs all button scenarios from unified vectors', () => {
        if (!wasmInitialized) {
            console.log('WASM not initialized, skipping button tests');
            return;
        }

        // Load spec and vectors
        const specPath = join(import.meta.dir, BUTTON_SPEC_PATH);
        const vectorsPath = join(import.meta.dir, BUTTON_VECTORS_PATH);

        const spec: ButtonSpec = JSON.parse(readFileSync(specPath, 'utf-8'));
        const vectors: ButtonVectors = JSON.parse(readFileSync(vectorsPath, 'utf-8'));

        console.log(`Running ${vectors.scenarios.length} WASM button conformance scenarios...`);

        for (const scenario of vectors.scenarios) {
            for (let i = 0; i < scenario.steps.length; i++) {
                const step = scenario.steps[i];

                // Build machine config from spec with before context and state
                const machineConfig = {
                    id: spec.machine.id,
                    initial: step.before.state,
                    context: {
                        disabled: step.before.context.disabled,
                        loading: step.before.context.loading,
                        pressed: step.before.context.pressed,
                    },
                    states: spec.machine.states,
                    actions: spec.actions,
                    guards: spec.guards,
                };

                // Create WASM machine
                const machine = new WasmMachine(JSON.stringify(machineConfig));

                // Send the event
                machine.send(step.event);

                // Get context and compare
                const actualContext = machine.getContext();

                const expected = step.after.context;
                const actual = {
                    disabled: actualContext.disabled,
                    loading: actualContext.loading,
                    pressed: actualContext.pressed,
                };

                expect(actual).toEqual(expected);

                console.log(`  ✓ [${scenario.source}] ${scenario.name} - Step ${i + 1}: ${step.event}`);

                // Clean up
                machine.free();
            }
        }

        console.log(`✅ All ${vectors.scenarios.length} WASM button scenarios passed`);
    });
});

// === Tabs WASM Conformance ===

const TABS_VECTORS_PATH = '../../generated/test-vectors/tabs.unified.json';
const TABS_SPEC_PATH = '../../generated/tabs.json';

interface TabsContext {
    selectedId: string;
    focusedId: string;
}

interface TabsStep {
    event: string;
    payload?: Record<string, unknown>;
    before: { context: TabsContext; state: string };
    after: { context: TabsContext; state: string };
}

interface TabsScenario {
    name: string;
    source: string;
    steps: TabsStep[];
}

interface TabsVectors {
    component: string;
    scenarios: TabsScenario[];
}

interface TabsSpec {
    context: TabsContext;
    machine: any;
    guards: Record<string, string>;
    actions: Record<string, { mutation: string }>;
}

describe('WASM Tabs Conformance Tests', () => {
    test('runs all tabs scenarios from unified vectors', () => {
        if (!wasmInitialized) {
            console.log('WASM not initialized, skipping tabs tests');
            return;
        }

        const specPath = join(import.meta.dir, TABS_SPEC_PATH);
        const vectorsPath = join(import.meta.dir, TABS_VECTORS_PATH);

        const spec: TabsSpec = JSON.parse(readFileSync(specPath, 'utf-8'));
        const vectors: TabsVectors = JSON.parse(readFileSync(vectorsPath, 'utf-8'));

        console.log(`Running ${vectors.scenarios.length} WASM tabs conformance scenarios...`);

        for (const scenario of vectors.scenarios) {
            for (let i = 0; i < scenario.steps.length; i++) {
                const step = scenario.steps[i];

                const machineConfig = {
                    id: spec.machine.id,
                    initial: step.before.state,
                    context: {
                        selectedId: step.before.context.selectedId,
                        focusedId: step.before.context.focusedId,
                    },
                    states: spec.machine.states,
                    actions: spec.actions,
                    guards: spec.guards,
                };

                const machine = new WasmMachine(JSON.stringify(machineConfig));

                // Send event with payload if present
                if (step.payload) {
                    machine.sendWithPayload(step.event, step.payload);
                } else {
                    machine.send(step.event);
                }

                const actualContext = machine.getContext();

                const expected = step.after.context;
                const actual = {
                    selectedId: actualContext.selectedId,
                    focusedId: actualContext.focusedId,
                };

                expect(actual).toEqual(expected);

                console.log(`  ✓ [${scenario.source}] ${scenario.name} - Step ${i + 1}: ${step.event}`);

                machine.free();
            }
        }

        console.log(`✅ All ${vectors.scenarios.length} WASM tabs scenarios passed`);
    });
});

