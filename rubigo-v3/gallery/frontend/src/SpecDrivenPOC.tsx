/**
 * Spec-Driven Gallery POC
 * 
 * Controls are dynamically generated from button.meta.json
 */
import { Component, createSignal, For, Show } from 'solid-js';
import { Button } from '@rubigo/components/button';
import buttonMeta from '@generated/button.meta.json';

// Types from metadata
interface PropMeta {
    name: string;
    type: string;
    options?: string[];
    optional: boolean;
    default?: string;
    description?: string;
}

const SpecDrivenPOC: Component = () => {
    // Initialize state from metadata defaults
    const initialProps: Record<string, unknown> = {};
    for (const prop of buttonMeta.props as PropMeta[]) {
        if (prop.default !== undefined) {
            if (prop.type === 'boolean') {
                initialProps[prop.name] = prop.default === 'true';
            } else {
                initialProps[prop.name] = prop.default;
            }
        }
    }

    const [propValues, setPropValues] = createSignal<Record<string, unknown>>(initialProps);
    const [childrenText, setChildrenText] = createSignal('Click Me');
    const [eventLog, setEventLog] = createSignal<string[]>([]);

    // Log an event to the UI
    const logEvent = (event: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setEventLog(prev => [`[${timestamp}] ${event}`, ...prev].slice(0, 20));
    };

    // Update a single prop value
    const updateProp = (name: string, value: unknown) => {
        setPropValues(prev => ({ ...prev, [name]: value }));
    };

    // Reset all props to metadata defaults
    const resetToDefaults = () => {
        setPropValues(initialProps);
        setChildrenText('Click Me');
        logEvent('Reset to defaults');
    };

    // Render control based on prop type
    const renderControl = (prop: PropMeta) => {
        const value = () => propValues()[prop.name];

        // Skip children and onClick (handled separately)
        if (prop.name === 'children') return null;
        if (prop.name === 'onClick') return null;

        switch (prop.type) {
            case 'boolean':
                return (
                    <label style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                        <input
                            type="checkbox"
                            checked={value() as boolean}
                            onChange={(e) => updateProp(prop.name, e.target.checked)}
                        />
                        <span>{prop.name}</span>
                        <Show when={prop.description}>
                            <span style={{ color: '#666', 'font-size': '12px' }}>({prop.description})</span>
                        </Show>
                    </label>
                );

            case 'union':
                return (
                    <label style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                        <span>{prop.name}:</span>
                        <select
                            value={value() as string}
                            onChange={(e) => updateProp(prop.name, e.target.value)}
                        >
                            <For each={prop.options}>
                                {(option) => <option value={option}>{option}</option>}
                            </For>
                        </select>
                        <Show when={prop.description}>
                            <span style={{ color: '#666', 'font-size': '12px' }}>({prop.description})</span>
                        </Show>
                    </label>
                );

            default:
                return null;
        }
    };

    // Build button props dynamically
    const buttonProps = () => {
        const props: Record<string, unknown> = { ...propValues() };
        props.onClick = () => logEvent('onClick fired');
        return props;
    };

    return (
        <div style={{
            padding: '40px',
            'font-family': 'system-ui, sans-serif',
            'min-height': '100vh',
            'color-scheme': 'light dark',
            background: 'var(--bg, #fff)',
            color: 'var(--text, #1f2937)'
        }}>
            <style>{`
                :root {
                    --bg: #fff;
                    --bg-panel: #f9f9f9;
                    --bg-code: #f0f0f0;
                    --border: #ddd;
                    --text: #1f2937;
                    --text-muted: #666;
                    --input-bg: #fff;
                    --input-border: #ccc;
                }
                @media (prefers-color-scheme: dark) {
                    :root {
                        --bg: #1a1a1a;
                        --bg-panel: #2a2a2a;
                        --bg-code: #333;
                        --border: #444;
                        --text: #e5e5e5;
                        --text-muted: #999;
                        --input-bg: #333;
                        --input-border: #555;
                    }
                }
            `}</style>
            <h2 style={{ 'margin-bottom': '20px', color: 'var(--text)' }}>
                Spec-Driven Controls: {buttonMeta.component}
            </h2>

            {/* Control Panel */}
            <div style={{
                padding: '20px',
                border: '1px solid var(--border)',
                'border-radius': '8px',
                'margin-bottom': '30px',
                'background': 'var(--bg-panel)'
            }}>
                <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center', 'margin-bottom': '16px' }}>
                    <h3 style={{ margin: '0', 'font-size': '14px', color: 'var(--text-muted)' }}>
                        Controls (from {buttonMeta.interface})
                    </h3>
                    <button
                        onClick={resetToDefaults}
                        style={{
                            padding: '4px 12px',
                            'font-size': '12px',
                            background: 'var(--bg-code)',
                            border: '1px solid var(--input-border)',
                            'border-radius': '4px',
                            cursor: 'pointer',
                            color: 'var(--text)'
                        }}
                    >
                        Reset to Defaults
                    </button>
                </div>

                <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
                    {/* Children input */}
                    <label style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                        <span>children:</span>
                        <input
                            type="text"
                            value={childrenText()}
                            onInput={(e) => setChildrenText(e.target.value)}
                            style={{ padding: '4px 8px', 'border-radius': '4px', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text)' }}
                        />
                        <span style={{ color: 'var(--text-muted)', 'font-size': '12px' }}>(Button label content)</span>
                    </label>

                    {/* Dynamic controls from metadata */}
                    <For each={buttonMeta.props as PropMeta[]}>
                        {(prop) => renderControl(prop)}
                    </For>
                </div>
            </div>

            {/* Preview */}
            <div style={{
                padding: '40px',
                border: '1px solid var(--border)',
                'border-radius': '8px',
                display: 'flex',
                'justify-content': 'center',
                'align-items': 'center',
                'min-height': '100px',
                'background': 'var(--bg-panel)'
            }}>
                <Button {...buttonProps()}>
                    {childrenText()}
                </Button>
            </div>

            {/* Event Log */}
            <div style={{
                'margin-top': '20px',
                display: 'grid',
                'grid-template-columns': '1fr 1fr',
                gap: '16px'
            }}>
                <div>
                    <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center', 'margin-bottom': '8px' }}>
                        <h4 style={{ margin: '0', 'font-size': '12px', color: 'var(--text-muted)' }}>Event Log</h4>
                        <button
                            onClick={() => setEventLog([])}
                            style={{ padding: '2px 8px', 'font-size': '10px', background: 'var(--bg-code)', border: '1px solid var(--input-border)', 'border-radius': '3px', cursor: 'pointer', color: 'var(--text)' }}
                        >
                            Clear
                        </button>
                    </div>
                    <div style={{
                        height: '120px',
                        'overflow-y': 'auto',
                        padding: '8px',
                        background: '#1e1e1e',
                        color: '#0f0',
                        'border-radius': '4px',
                        'font-family': 'monospace',
                        'font-size': '11px'
                    }}>
                        <For each={eventLog()}>
                            {(line) => <div>{line}</div>}
                        </For>
                        {eventLog().length === 0 && <span style={{ color: '#666' }}>No events yet...</span>}
                    </div>
                </div>
                <div>
                    <h4 style={{ margin: '0 0 8px 0', 'font-size': '12px', color: 'var(--text-muted)' }}>Current Props</h4>
                    <pre style={{
                        height: '120px',
                        'overflow-y': 'auto',
                        margin: '0',
                        padding: '8px',
                        'background': 'var(--bg-code)',
                        'border-radius': '4px',
                        'font-size': '11px',
                        color: 'var(--text)'
                    }}>
                        {JSON.stringify({ children: childrenText(), ...propValues() }, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    );
};

export default SpecDrivenPOC;
