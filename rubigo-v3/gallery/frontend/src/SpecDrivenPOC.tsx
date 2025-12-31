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

    // Update a single prop value
    const updateProp = (name: string, value: unknown) => {
        setPropValues(prev => ({ ...prev, [name]: value }));
    };

    // Reset all props to metadata defaults
    const resetToDefaults = () => {
        setPropValues(initialProps);
        setChildrenText('Click Me');
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
        props.onClick = () => console.log('Button clicked!', props);
        return props;
    };

    return (
        <div style={{ padding: '40px', 'font-family': 'system-ui, sans-serif' }}>
            <h2 style={{ 'margin-bottom': '20px' }}>
                Spec-Driven Controls: {buttonMeta.component}
            </h2>

            {/* Control Panel */}
            <div style={{
                padding: '20px',
                border: '1px solid #ddd',
                'border-radius': '8px',
                'margin-bottom': '30px',
                'background': '#f9f9f9'
            }}>
                <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center', 'margin-bottom': '16px' }}>
                    <h3 style={{ margin: '0', 'font-size': '14px', color: '#666' }}>
                        Controls (from {buttonMeta.interface})
                    </h3>
                    <button
                        onClick={resetToDefaults}
                        style={{
                            padding: '4px 12px',
                            'font-size': '12px',
                            background: '#f0f0f0',
                            border: '1px solid #ccc',
                            'border-radius': '4px',
                            cursor: 'pointer'
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
                            style={{ padding: '4px 8px', 'border-radius': '4px', border: '1px solid #ccc' }}
                        />
                        <span style={{ color: '#666', 'font-size': '12px' }}>(Button label content)</span>
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
                border: '1px solid #ddd',
                'border-radius': '8px',
                display: 'flex',
                'justify-content': 'center',
                'align-items': 'center',
                'min-height': '100px',
                'background': '#fff'
            }}>
                <Button {...buttonProps()}>
                    {childrenText()}
                </Button>
            </div>

            {/* Debug: show current props */}
            <pre style={{
                'margin-top': '20px',
                padding: '12px',
                'background': '#f0f0f0',
                'border-radius': '4px',
                'font-size': '12px',
                overflow: 'auto'
            }}>
                {JSON.stringify({ children: childrenText(), ...propValues() }, null, 2)}
            </pre>
        </div>
    );
};

export default SpecDrivenPOC;
