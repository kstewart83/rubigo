import { createSignal, createResource, For, Show } from 'solid-js';
import type { Component } from 'solid-js';
import { ComponentPreview } from './components/ComponentPreview';
import { ControlsPanel } from './components/ControlsPanel';
import { StateInspector } from './components/StateInspector';
import { ActionsLog } from './components/ActionsLog';

interface SpecListItem {
    id: string;
    name: string;
    path: string;
}

interface SpecResponse {
    id: string;
    name: string;
    content: string;
    frontmatter: any;
    machine: any;
    actions?: Record<string, { mutation: string; description?: string; emits?: string[] }>;
    guards?: Record<string, string>;
}

const fetchSpecs = async (): Promise<SpecListItem[]> => {
    const res = await fetch('/api/specs');
    return res.json();
};

const fetchSpec = async (id: string): Promise<SpecResponse | null> => {
    if (!id) return null;
    const res = await fetch(`/api/specs/${id}`);
    if (!res.ok) return null;
    return res.json();
};

const App: Component = () => {
    const [selectedId, setSelectedId] = createSignal<string>('');
    const [engine, setEngine] = createSignal<'ts' | 'wasm'>('ts');
    const [activeTab, setActiveTab] = createSignal<'preview' | 'docs' | 'vectors' | 'source'>('preview');

    // Machine state
    const [context, setContext] = createSignal<Record<string, any>>({});
    const [currentState, setCurrentState] = createSignal<string>('');
    const [actions, setActions] = createSignal<{ timestamp: number; name: string; payload?: any }[]>([]);

    const [specs] = createResource(fetchSpecs);
    const [currentSpec] = createResource(selectedId, fetchSpec);

    // Initialize context when spec loads
    const initializeContext = () => {
        const spec = currentSpec();
        if (spec?.machine?.context) {
            setContext({ ...spec.machine.context });
            setCurrentState(spec.machine.initial || 'idle');
            setActions([]);
        }
    };

    // Update context value
    const updateContext = (key: string, value: any) => {
        setContext(prev => ({ ...prev, [key]: value }));
    };

    // Handle an action - log it and execute mutations from spec
    const handleAction = (name: string, payload?: any) => {
        // Log the action
        setActions(prev => [...prev, { timestamp: Date.now(), name, payload }]);

        // Get the spec's actions definitions
        const spec = currentSpec();
        if (!spec) return;

        // Get action definition - check both top-level actions and machine.actions
        const actionDef = spec.actions?.[name] || spec.machine?.actions?.[name];

        setContext(prev => {
            const next = { ...prev };

            // If we have a spec-defined action with a mutation expression, use it
            if (actionDef?.mutation) {
                applyMutation(next, actionDef.mutation, prev, payload);
            } else {
                // Fallback for common actions not in spec (focus/blur, change with payload)
                switch (name) {
                    case 'focus':
                    case 'setFocused':
                        next.focused = true;
                        break;
                    case 'blur':
                    case 'clearFocused':
                        next.focused = false;
                        break;
                    case 'change':
                        if (payload?.value !== undefined) {
                            next.value = payload.value;
                        }
                        break;
                    case 'select':
                        // Select with payload - used by select, tabs
                        if (payload?.id !== undefined) next.selectedId = payload.id;
                        if (payload?.value !== undefined) next.selectedValue = payload.value;
                        break;
                    case 'setValue':
                        if (payload?.value !== undefined) {
                            next.value = Math.max(prev.min ?? 0, Math.min(prev.max ?? 100, payload.value));
                        }
                        break;
                }
            }

            return next;
        });
    };

    /**
     * Apply a mutation expression to context.
     * Supports expressions like:
     *   - "context.open = true"
     *   - "context.checked = !context.checked"
     *   - "context.value = context.value + context.step"
     */
    const applyMutation = (
        ctx: Record<string, any>,
        mutation: string,
        prev: Record<string, any>,
        payload?: any
    ) => {
        // Parse "context.key = expression" format
        const match = mutation.match(/^context\.(\w+)\s*=\s*(.+)$/);
        if (!match) return;

        const [, key, expr] = match;

        // Evaluate the expression
        const value = evaluateExpression(expr.trim(), prev, payload);
        ctx[key] = value;
    };

    /**
     * Evaluate a simple expression used in mutation strings.
     * Supports: true, false, numbers, !context.x, context.x, context.x + context.y
     */
    const evaluateExpression = (expr: string, ctx: Record<string, any>, payload?: any): any => {
        // Boolean literals
        if (expr === 'true') return true;
        if (expr === 'false') return false;

        // Number literals
        if (/^-?\d+(\.\d+)?$/.test(expr)) return parseFloat(expr);

        // Negation: !context.key
        if (expr.startsWith('!context.')) {
            const key = expr.slice(9); // "!context.".length = 9
            return !ctx[key];
        }

        // Simple reference: context.key
        if (expr.startsWith('context.')) {
            const key = expr.slice(8); // "context.".length = 8
            return ctx[key];
        }

        // Addition/subtraction: context.value + context.step, context.value - 1
        const addMatch = expr.match(/^context\.(\w+)\s*\+\s*(.+)$/);
        if (addMatch) {
            const [, key, rightExpr] = addMatch;
            const left = ctx[key] ?? 0;
            const right = evaluateExpression(rightExpr.trim(), ctx, payload);
            return left + right;
        }

        const subMatch = expr.match(/^context\.(\w+)\s*-\s*(.+)$/);
        if (subMatch) {
            const [, key, rightExpr] = subMatch;
            const left = ctx[key] ?? 0;
            const right = evaluateExpression(rightExpr.trim(), ctx, payload);
            return left - right;
        }

        // Default: return the expression as-is (string)
        return expr;
    };


    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            overflow: 'hidden'
        }}>
            {/* Sidebar */}
            <aside style={{
                width: '240px',
                'border-right': '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                display: 'flex',
                'flex-direction': 'column'
            }}>
                <header style={{
                    padding: '16px',
                    'border-bottom': '1px solid var(--border)',
                    'font-weight': '600',
                    'font-size': '14px',
                    color: 'var(--text-primary)'
                }}>
                    🖼️ Component Gallery
                </header>

                <nav style={{ padding: '8px', flex: 1, overflow: 'auto' }}>
                    <div style={{
                        'font-size': '11px',
                        'text-transform': 'uppercase',
                        color: 'var(--text-secondary)',
                        padding: '8px',
                        'letter-spacing': '0.5px'
                    }}>
                        Components
                    </div>
                    <Show when={specs.loading}>
                        <div style={{ padding: '8px', color: 'var(--text-secondary)' }}>Loading...</div>
                    </Show>
                    <For each={specs()}>
                        {(spec) => (
                            <button
                                onClick={() => {
                                    setSelectedId(spec.id);
                                    setTimeout(initializeContext, 100);
                                }}
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: '8px 12px',
                                    background: selectedId() === spec.id ? 'var(--bg-tertiary)' : 'transparent',
                                    border: 'none',
                                    color: selectedId() === spec.id ? 'var(--accent)' : 'var(--text-primary)',
                                    'text-align': 'left',
                                    cursor: 'pointer',
                                    'border-radius': '4px',
                                    'font-size': '14px'
                                }}
                            >
                                {spec.name}
                            </button>
                        )}
                    </For>
                </nav>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, display: 'flex', 'flex-direction': 'column', overflow: 'hidden' }}>
                {/* Top Bar */}
                <header style={{
                    display: 'flex',
                    'justify-content': 'space-between',
                    'align-items': 'center',
                    padding: '12px 16px',
                    'border-bottom': '1px solid var(--border)',
                    background: 'var(--bg-secondary)'
                }}>
                    <h1 style={{ 'font-size': '18px', 'font-weight': '500' }}>
                        {currentSpec()?.name || 'Select a component'}
                    </h1>

                    {/* Engine Toggle */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                            onClick={() => setEngine('ts')}
                            style={{
                                padding: '6px 12px',
                                background: engine() === 'ts' ? 'var(--accent)' : 'var(--bg-tertiary)',
                                border: 'none',
                                color: engine() === 'ts' ? '#fff' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                'border-radius': '4px 0 0 4px',
                                'font-size': '12px',
                                'font-weight': '500'
                            }}
                        >
                            TypeScript
                        </button>
                        <button
                            onClick={() => setEngine('wasm')}
                            style={{
                                padding: '6px 12px',
                                background: engine() === 'wasm' ? 'var(--accent)' : 'var(--bg-tertiary)',
                                border: 'none',
                                color: engine() === 'wasm' ? '#fff' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                'border-radius': '0 4px 4px 0',
                                'font-size': '12px',
                                'font-weight': '500'
                            }}
                        >
                            WASM
                        </button>
                    </div>
                </header>

                {/* Tab Bar */}
                <div style={{
                    display: 'flex',
                    gap: '2px',
                    padding: '0 16px',
                    'border-bottom': '1px solid var(--border)',
                    background: 'var(--bg-tertiary)'
                }}>
                    <For each={['preview', 'docs', 'vectors', 'source'] as const}>
                        {(tab) => (
                            <button
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    padding: '10px 16px',
                                    background: activeTab() === tab ? 'var(--bg-primary)' : 'transparent',
                                    border: 'none',
                                    'border-bottom': activeTab() === tab ? '2px solid var(--accent)' : '2px solid transparent',
                                    color: activeTab() === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    'font-size': '13px',
                                    'font-weight': activeTab() === tab ? '500' : '400',
                                    'text-transform': 'capitalize',
                                    'margin-bottom': '-1px'
                                }}
                            >
                                {tab}
                            </button>
                        )}
                    </For>
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, display: 'flex', 'flex-direction': 'column', overflow: 'hidden' }}>
                    <Show when={currentSpec()} fallback={
                        <div style={{
                            display: 'flex',
                            'align-items': 'center',
                            'justify-content': 'center',
                            height: '100%',
                            color: 'var(--text-secondary)'
                        }}>
                            Select a component from the sidebar to begin
                        </div>
                    }>
                        {/* Preview Tab */}
                        <Show when={activeTab() === 'preview'}>
                            <div style={{ flex: 1, display: 'flex', gap: '16px', padding: '16px', overflow: 'auto' }}>
                                {/* Left: Preview */}
                                <div style={{ flex: 1, display: 'flex', 'flex-direction': 'column', gap: '16px' }}>
                                    <ComponentPreview
                                        spec={currentSpec()!}
                                        engine={engine()}
                                        context={context()}
                                        currentState={currentState()}
                                        onStateChange={setCurrentState}
                                        onAction={handleAction}
                                    />
                                </div>

                                {/* Right: Controls & State */}
                                <div style={{ width: '300px', display: 'flex', 'flex-direction': 'column', gap: '16px' }}>
                                    <ControlsPanel
                                        spec={currentSpec()!}
                                        context={context()}
                                        onUpdate={updateContext}
                                    />
                                    <StateInspector
                                        state={currentState()}
                                        context={context()}
                                    />
                                    <ActionsLog actions={actions()} />
                                </div>
                            </div>
                        </Show>

                        {/* Docs Tab */}
                        <Show when={activeTab() === 'docs'}>
                            <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
                                <div style={{
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border)',
                                    'border-radius': '8px',
                                    padding: '16px'
                                }}>
                                    <h3 style={{ margin: '0 0 12px', 'font-size': '16px' }}>Documentation</h3>
                                    <pre style={{
                                        background: 'var(--bg-tertiary)',
                                        padding: '12px',
                                        'border-radius': '6px',
                                        overflow: 'auto',
                                        'font-size': '13px',
                                        'line-height': '1.5'
                                    }}>
                                        {currentSpec()?.content || 'No documentation available'}
                                    </pre>
                                </div>
                            </div>
                        </Show>

                        {/* Vectors Tab */}
                        <Show when={activeTab() === 'vectors'}>
                            <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
                                <div style={{
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border)',
                                    'border-radius': '8px',
                                    padding: '16px'
                                }}>
                                    <h3 style={{ margin: '0 0 12px', 'font-size': '16px' }}>Test Vectors</h3>
                                    <pre style={{
                                        background: 'var(--bg-tertiary)',
                                        padding: '12px',
                                        'border-radius': '6px',
                                        overflow: 'auto',
                                        'font-size': '13px',
                                        'line-height': '1.5'
                                    }}>
                                        {JSON.stringify(currentSpec()?.machine, null, 2) || 'No vectors available'}
                                    </pre>
                                </div>
                            </div>
                        </Show>

                        {/* Source Tab */}
                        <Show when={activeTab() === 'source'}>
                            <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
                                <div style={{
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border)',
                                    'border-radius': '8px',
                                    padding: '16px'
                                }}>
                                    <h3 style={{ margin: '0 0 12px', 'font-size': '16px' }}>State Machine Source</h3>
                                    <pre style={{
                                        background: 'var(--bg-tertiary)',
                                        padding: '12px',
                                        'border-radius': '6px',
                                        overflow: 'auto',
                                        'font-size': '13px',
                                        'line-height': '1.5'
                                    }}>
                                        {JSON.stringify(currentSpec()?.machine, null, 2) || 'No source available'}
                                    </pre>
                                </div>
                            </div>
                        </Show>
                    </Show>
                </div>
            </main>
        </div>
    );
};

export default App;
