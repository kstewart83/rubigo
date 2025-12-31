/**
 * Spec-Driven Gallery POC
 * 
 * Controls are dynamically generated from component metadata.
 * Supports switching between implemented components.
 */
import { Component, createSignal, createMemo, For, Show, Accessor, JSX } from 'solid-js';
import { Button } from '@rubigo/components/button';
import { Checkbox } from '@rubigo/components/checkbox';
import { Switch } from '@rubigo/components/switch';
import { Input } from '@rubigo/components/input';
import buttonMeta from '@generated/button.meta.json';
import checkboxMeta from '@generated/checkbox.meta.json';
import switchMeta from '@generated/switch.meta.json';
import inputMeta from '@generated/input.meta.json';

// Available components registry
const COMPONENTS = {
    button: { meta: buttonMeta, component: Button, defaultChildren: 'Click Me' },
    checkbox: { meta: checkboxMeta, component: Checkbox, defaultChildren: 'Accept Terms' },
    switch: { meta: switchMeta, component: Switch, defaultChildren: 'Dark Mode' },
    input: { meta: inputMeta, component: Input, defaultChildren: '' },
} as const;

type ComponentKey = keyof typeof COMPONENTS;

// Types from metadata
interface PropMeta {
    name: string;
    type: string;
    options?: string[];
    optional: boolean;
    default?: string;
    description?: string;
}

// ===== Component: ControlPanel =====
interface ControlPanelProps {
    title: string;
    interfaceName: string;
    onReset: () => void;
    children: JSX.Element;
}

const ControlPanel: Component<ControlPanelProps> = (props) => {
    return (
        <div style={{
            padding: '20px',
            border: '1px solid var(--rubigo-border)',
            'border-radius': '8px',
            'margin-bottom': '30px',
            'background': 'var(--rubigo-bg-panel)'
        }}>
            <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center', 'margin-bottom': '16px' }}>
                <h3 style={{ margin: '0', 'font-size': '14px', color: 'var(--rubigo-text-muted)' }}>
                    {props.title} (from {props.interfaceName})
                </h3>
                <Button onClick={props.onReset} variant="secondary" size="sm">
                    Reset to Defaults
                </Button>
            </div>
            <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
                {props.children}
            </div>
        </div>
    );
};

// ===== Component: Preview =====
interface PreviewProps {
    children: JSX.Element;
}

const Preview: Component<PreviewProps> = (props) => {
    return (
        <div style={{
            padding: '40px',
            border: '1px solid var(--rubigo-border)',
            'border-radius': '8px',
            display: 'flex',
            'justify-content': 'center',
            'align-items': 'center',
            'min-height': '100px',
            'background': 'var(--rubigo-bg-panel)'
        }}>
            {props.children}
        </div>
    );
};

// ===== Component: EventLog =====
interface EventLogProps {
    events: Accessor<string[]>;
    onClear: () => void;
}

const EventLog: Component<EventLogProps> = (props) => {
    return (
        <div>
            <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center', 'margin-bottom': '8px' }}>
                <h4 style={{ margin: '0', 'font-size': '12px', color: 'var(--rubigo-text-muted)' }}>Event Log</h4>
                <Button onClick={props.onClear} variant="ghost" size="sm">
                    Clear
                </Button>
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
                <For each={props.events()}>
                    {(line) => <div>{line}</div>}
                </For>
                {props.events().length === 0 && <span style={{ color: '#666' }}>No events yet...</span>}
            </div>
        </div>
    );
};

// ===== Component: PropsPanel =====
interface PropsPanelProps {
    props: Accessor<Record<string, unknown>>;
}

const PropsPanel: Component<PropsPanelProps> = (props) => {
    return (
        <div>
            <h4 style={{ margin: '0 0 8px 0', 'font-size': '12px', color: 'var(--rubigo-text-muted)' }}>Current Props</h4>
            <pre style={{
                height: '120px',
                'overflow-y': 'auto',
                margin: '0',
                padding: '8px',
                'background': 'var(--rubigo-bg-code)',
                'border-radius': '4px',
                'font-size': '11px',
                color: 'var(--rubigo-text)'
            }}>
                {JSON.stringify(props.props(), null, 2)}
            </pre>
        </div>
    );
};

// ===== Main Component =====
const SpecDrivenPOC: Component = () => {
    // Component selection
    const [selectedComponent, setSelectedComponent] = createSignal<ComponentKey>('checkbox');

    // Get current component config
    const componentConfig = createMemo(() => COMPONENTS[selectedComponent()]);
    const getMeta = () => componentConfig().meta;

    // Initialize props from metadata defaults
    const getInitialProps = (meta: typeof buttonMeta): Record<string, unknown> => {
        const props: Record<string, unknown> = {};
        for (const prop of meta.props as PropMeta[]) {
            if (prop.default !== undefined) {
                if (prop.type === 'boolean') {
                    props[prop.name] = prop.default === 'true';
                } else {
                    props[prop.name] = prop.default;
                }
            }
        }
        return props;
    };

    const [propValues, setPropValues] = createSignal<Record<string, unknown>>(getInitialProps(getMeta()));
    const [childrenText, setChildrenText] = createSignal<string>(componentConfig().defaultChildren);
    const [eventLog, setEventLog] = createSignal<string[]>([]);

    // Handle component switch
    const switchComponent = (key: ComponentKey) => {
        setSelectedComponent(key);
        const config = COMPONENTS[key];
        setPropValues(getInitialProps(config.meta));
        setChildrenText(config.defaultChildren);
        setEventLog([]);
        logEvent(`Switched to ${key}`);
    };

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
        setPropValues(getInitialProps(getMeta()));
        setChildrenText(componentConfig().defaultChildren);
        logEvent('Reset to defaults');
    };

    // Render control based on prop type
    const renderControl = (prop: PropMeta) => {
        const value = () => propValues()[prop.name];

        // Skip children and callbacks (handled separately)
        if (prop.name === 'children') return null;
        if (prop.name === 'onClick') return null;
        if (prop.name === 'onChange') return null;

        switch (prop.type) {
            case 'boolean':
                return (
                    <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                        <Checkbox
                            checked={value() as boolean}
                            onChange={(checked) => updateProp(prop.name, checked)}
                        >
                            {prop.name}
                        </Checkbox>
                        <Show when={prop.description}>
                            <span style={{ color: 'var(--rubigo-text-muted)', 'font-size': '12px' }}>({prop.description})</span>
                        </Show>
                    </div>
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
                            <span style={{ color: 'var(--rubigo-text-muted)', 'font-size': '12px' }}>({prop.description})</span>
                        </Show>
                    </label>
                );

            default:
                return null;
        }
    };

    // Build component props dynamically
    const componentProps = () => {
        const props: Record<string, unknown> = { ...propValues() };
        // Add appropriate callback based on component
        if (selectedComponent() === 'button') {
            props.onClick = () => logEvent('onClick fired');
        } else if (selectedComponent() === 'checkbox' || selectedComponent() === 'switch') {
            props.onChange = (checked: boolean) => {
                updateProp('checked', checked);
                logEvent(`onChange fired: checked=${checked}`);
            };
        } else if (selectedComponent() === 'input') {
            props.onChange = (value: string) => {
                updateProp('value', value);
                logEvent(`onChange fired: value="${value}"`);
            };
        }
        return props;
    };

    // Combined props for display
    const displayProps = () => ({ children: childrenText(), ...propValues() });

    // Render preview component
    const renderPreview = () => {
        const Comp = componentConfig().component;
        return (
            <Comp {...componentProps()}>
                {childrenText()}
            </Comp>
        );
    };

    return (
        <div style={{
            padding: '40px',
            'font-family': 'system-ui, sans-serif',
            'min-height': '100vh',
            'color-scheme': 'light dark',
            background: 'var(--rubigo-bg)',
            color: 'var(--rubigo-text)'
        }}>
            {/* Header with component selector */}
            <div style={{ display: 'flex', 'align-items': 'center', gap: '16px', 'margin-bottom': '20px' }}>
                <h2 style={{ margin: '0', color: 'var(--rubigo-text)' }}>
                    Spec-Driven Controls:
                </h2>
                <select
                    value={selectedComponent()}
                    onChange={(e) => switchComponent(e.target.value as ComponentKey)}
                    style={{
                        padding: '8px 12px',
                        'font-size': '16px',
                        'font-weight': 'bold',
                        'border-radius': '6px',
                        border: '1px solid var(--rubigo-border)',
                        background: 'var(--rubigo-bg-panel)',
                        color: 'var(--rubigo-text)',
                        cursor: 'pointer'
                    }}
                >
                    <For each={Object.keys(COMPONENTS) as ComponentKey[]}>
                        {(key) => <option value={key}>{key}</option>}
                    </For>
                </select>
            </div>

            <ControlPanel
                title="Controls"
                interfaceName={getMeta().interface}
                onReset={resetToDefaults}
            >
                {/* Children input */}
                <label style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                    <span>children:</span>
                    <input
                        type="text"
                        value={childrenText()}
                        onInput={(e) => setChildrenText(e.target.value)}
                        style={{ padding: '4px 8px', 'border-radius': '4px', border: '1px solid var(--rubigo-input-border)', background: 'var(--rubigo-bg-panel)', color: 'var(--rubigo-text)' }}
                    />
                    <span style={{ color: 'var(--rubigo-text-muted)', 'font-size': '12px' }}>(Label content)</span>
                </label>

                {/* Dynamic controls from metadata */}
                <For each={getMeta().props as PropMeta[]}>
                    {(prop) => renderControl(prop)}
                </For>
            </ControlPanel>

            <Preview>
                {renderPreview()}
            </Preview>

            {/* Bottom panels */}
            <div style={{
                'margin-top': '20px',
                display: 'grid',
                'grid-template-columns': '1fr 1fr',
                gap: '16px'
            }}>
                <EventLog events={eventLog} onClear={() => setEventLog([])} />
                <PropsPanel props={displayProps} />
            </div>
        </div>
    );
};

export default SpecDrivenPOC;
