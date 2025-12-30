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

    // Handle an action - log it and execute mutations
    const handleAction = (name: string, payload?: any) => {
        // Log the action
        setActions(prev => [...prev, { timestamp: Date.now(), name, payload }]);

        // Get the spec's actions definitions
        const spec = currentSpec();
        if (!spec?.machine) return;

        // Execute common actions based on action name
        // These align with standard statechart action names from specs
        setContext(prev => {
            const next = { ...prev };
            switch (name) {
                // Toggle actions (switch, checkbox)
                case 'toggle':
                    next.checked = !prev.checked;
                    break;
                case 'check':
                    next.checked = true;
                    break;
                case 'uncheck':
                    next.checked = false;
                    break;
                case 'setIndeterminate':
                    next.indeterminate = true;
                    next.checked = false;
                    break;

                // Focus actions
                case 'focus':
                    next.focused = true;
                    break;
                case 'blur':
                    next.focused = false;
                    break;
                case 'setFocused':
                    next.focused = true;
                    break;
                case 'clearFocused':
                    next.focused = false;
                    break;

                // Input/change actions
                case 'change':
                    if (payload?.value !== undefined) {
                        next.value = payload.value;
                    }
                    break;

                // Button actions
                case 'click':
                case 'press':
                    next.pressed = true;
                    break;
                case 'release':
                    next.pressed = false;
                    break;

                // Collapsible actions
                case 'open':
                    next.open = true;
                    break;
                case 'close':
                    next.open = false;
                    break;
                case 'toggleOpen':
                    next.open = !prev.open;
                    break;

                // Select actions
                case 'select':
                    if (payload?.id !== undefined) {
                        next.selectedId = payload.id;
                    }
                    if (payload?.value !== undefined) {
                        next.value = payload.value;
                    }
                    break;

                // Slider actions
                case 'increment':
                    next.value = Math.min(prev.max ?? 100, (prev.value ?? 0) + (prev.stepSize ?? prev.step ?? 1));
                    break;
                case 'decrement':
                    next.value = Math.max(prev.min ?? 0, (prev.value ?? 0) - (prev.stepSize ?? prev.step ?? 1));
                    break;
                case 'setDragging':
                    next.dragging = true;
                    break;
                case 'clearDragging':
                    next.dragging = false;
                    break;

                // Tabs actions
                case 'selectTab':
                    if (payload?.id !== undefined) {
                        next.activeTabId = payload.id;
                    }
                    break;
            }
            return next;
        });
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
