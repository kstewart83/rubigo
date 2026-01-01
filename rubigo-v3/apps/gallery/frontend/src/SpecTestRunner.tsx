/**
 * SpecTestRunner - In-browser spec conformance testing
 * 
 * Runs unified vectors against the actual rendered component in the browser,
 * using DOM-level assertions to catch integration bugs that isolated tests miss.
 * 
 * Tests run automatically on mount and when component changes.
 */

import { Component, createSignal, createEffect, onMount, For, Show } from 'solid-js';
import { Checkbox } from '@rubigo/components/checkbox';

// Types from unified vectors
interface TestContext {
    checked: boolean;
    disabled: boolean;
    indeterminate: boolean;
}

interface TestStep {
    event: string;
    before: { context: TestContext; state: string };
    after: { context: TestContext; state: string };
}

interface Scenario {
    name: string;
    source: 'yaml' | 'itf';
    steps: TestStep[];
}

interface TestResult {
    scenario: string;
    source: 'yaml' | 'itf';
    passed: boolean;
    expected: string;
    actual: string;
    error?: string;
}

// Checkbox unified vectors (subset for testing)
const checkboxScenarios: Scenario[] = [
    {
        name: 'toggle from unchecked',
        source: 'yaml',
        steps: [{
            event: 'TOGGLE',
            before: { context: { checked: false, disabled: false, indeterminate: false }, state: 'unchecked' },
            after: { context: { checked: true, disabled: false, indeterminate: false }, state: 'checked' }
        }]
    },
    {
        name: 'toggle from checked',
        source: 'yaml',
        steps: [{
            event: 'TOGGLE',
            before: { context: { checked: true, disabled: false, indeterminate: false }, state: 'checked' },
            after: { context: { checked: false, disabled: false, indeterminate: false }, state: 'unchecked' }
        }]
    },
    {
        name: 'toggle from indeterminate',
        source: 'yaml',
        steps: [{
            event: 'TOGGLE',
            before: { context: { checked: false, disabled: false, indeterminate: true }, state: 'indeterminate' },
            after: { context: { checked: true, disabled: false, indeterminate: false }, state: 'checked' }
        }]
    },
    {
        name: 'disabled blocks toggle',
        source: 'yaml',
        steps: [{
            event: 'TOGGLE',
            before: { context: { checked: false, disabled: true, indeterminate: false }, state: 'unchecked' },
            after: { context: { checked: false, disabled: true, indeterminate: false }, state: 'unchecked' }
        }]
    },
];

// Get expected aria-checked value
function expectedAriaChecked(ctx: TestContext): string {
    if (ctx.indeterminate) return 'mixed';
    return String(ctx.checked);
}

interface SpecTestRunnerProps {
    component?: string;
}

export const SpecTestRunner: Component<SpecTestRunnerProps> = (props) => {
    const [results, setResults] = createSignal<TestResult[]>([]);
    const [running, setRunning] = createSignal(false);
    const [currentScenario, setCurrentScenario] = createSignal<number>(-1);

    // Current test component props (controlled)
    const [testProps, setTestProps] = createSignal<TestContext>({
        checked: false,
        disabled: false,
        indeterminate: false,
    });

    // Ref to the test checkbox element
    let checkboxRef: HTMLSpanElement | undefined;

    const runNextTest = async () => {
        const idx = currentScenario();
        if (idx >= checkboxScenarios.length - 1) {
            setRunning(false);
            setCurrentScenario(-1);
            return;
        }

        const nextIdx = idx + 1;
        setCurrentScenario(nextIdx);

        const scenario = checkboxScenarios[nextIdx];
        const step = scenario.steps[0];

        // Set up before state
        setTestProps(step.before.context);

        // Wait for render
        await new Promise(r => setTimeout(r, 100));

        // Verify before state
        const checkboxEl = checkboxRef;
        if (!checkboxEl) {
            setResults(prev => [...prev, {
                scenario: scenario.name,
                source: scenario.source,
                passed: false,
                expected: '',
                actual: '',
                error: 'Checkbox element not found'
            }]);
            runNextTest();
            return;
        }

        // Simulate the event
        if (step.event === 'TOGGLE') {
            checkboxEl.click();
        }

        // Wait for update
        await new Promise(r => setTimeout(r, 100));

        // Read actual DOM state
        const actualAriaChecked = checkboxEl.getAttribute('aria-checked') || '';
        const expectedAria = expectedAriaChecked(step.after.context);

        const passed = actualAriaChecked === expectedAria;

        setResults(prev => [...prev, {
            scenario: scenario.name,
            source: scenario.source,
            passed,
            expected: `aria-checked="${expectedAria}"`,
            actual: `aria-checked="${actualAriaChecked}"`,
        }]);

        // Run next test after a short delay
        setTimeout(runNextTest, 150);
    };

    const runAllTests = () => {
        if (running()) return;
        setRunning(true);
        setResults([]);
        setCurrentScenario(-1);
        runNextTest();
    };

    // Auto-run tests on mount and when component changes
    onMount(() => {
        // Small delay to ensure DOM is ready
        setTimeout(runAllTests, 100);
    });

    // Re-run when component prop changes
    createEffect(() => {
        const comp = props.component;
        // Only run for checkbox for now
        if (comp === 'checkbox') {
            setTimeout(runAllTests, 100);
        }
    });

    const passCount = () => results().filter(r => r.passed).length;
    const failCount = () => results().filter(r => !r.passed).length;

    return (
        <div style={{ 'font-family': 'system-ui' }}>
            <h3 style={{ margin: '0 0 12px', color: 'var(--rubigo-text)', 'font-size': '16px' }}>
                🧪 Spec Conformance: Checkbox
            </h3>

            {/* Hidden test component */}
            <div style={{
                position: 'absolute',
                left: '-9999px',
                visibility: 'hidden',
            }}>
                <Checkbox
                    checked={testProps().checked}
                    disabled={testProps().disabled}
                    indeterminate={testProps().indeterminate}
                    ref={(el: HTMLSpanElement) => checkboxRef = el}
                >
                    Test
                </Checkbox>
            </div>

            {/* Summary */}
            <Show when={running()}>
                <div style={{
                    padding: '8px 12px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    'border-radius': '6px',
                    color: '#3b82f6',
                    'font-size': '13px',
                }}>
                    ⏳ Running scenario {currentScenario() + 1}/{checkboxScenarios.length}...
                </div>
            </Show>

            <Show when={results().length > 0 && !running()}>
                <div style={{
                    padding: '8px 12px',
                    background: failCount() > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                    'border-radius': '6px',
                    'margin-bottom': '12px',
                    color: failCount() > 0 ? '#ef4444' : '#22c55e',
                    'font-weight': 'bold',
                    'font-size': '14px',
                }}>
                    {failCount() > 0 ? '❌' : '✅'} {passCount()} passed, {failCount()} failed
                </div>
            </Show>

            {/* Compact Test Results */}
            <div style={{ display: 'flex', 'flex-wrap': 'wrap', gap: '6px' }}>
                <For each={results()}>
                    {(result) => (
                        <div
                            style={{
                                padding: '4px 8px',
                                background: result.passed ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                'border-radius': '4px',
                                border: `1px solid ${result.passed ? '#22c55e' : '#ef4444'}`,
                                'font-size': '12px',
                                cursor: result.passed ? 'default' : 'help',
                            }}
                            title={result.passed ? '' : `Expected: ${result.expected}\nActual: ${result.actual}`}
                        >
                            {result.passed ? '✅' : '❌'} {result.scenario}
                        </div>
                    )}
                </For>
            </div>

            {/* Show failures in detail */}
            <Show when={failCount() > 0 && !running()}>
                <div style={{ 'margin-top': '12px' }}>
                    <For each={results().filter(r => !r.passed)}>
                        {(result) => (
                            <div style={{
                                padding: '8px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                'border-radius': '4px',
                                'margin-bottom': '6px',
                                'font-size': '12px',
                                'font-family': 'monospace',
                            }}>
                                <div style={{ 'font-weight': 'bold', color: '#ef4444' }}>❌ {result.scenario}</div>
                                <div style={{ color: 'var(--rubigo-text-muted)' }}>Expected: {result.expected}</div>
                                <div style={{ color: 'var(--rubigo-text-muted)' }}>Actual: {result.actual}</div>
                            </div>
                        )}
                    </For>
                </div>
            </Show>
        </div>
    );
};
