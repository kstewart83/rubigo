/**
 * Spec-Driven Gallery POC
 * 
 * Controls are dynamically generated from component metadata.
 * Supports switching between implemented components.
 */
import { Component, createSignal, createMemo, For, Show, Accessor, JSX } from 'solid-js';
import { SpecTestRunner } from './SpecTestRunner';
import { Button } from '@rubigo/components/button';
import { Checkbox } from '@rubigo/components/checkbox';
import { Switch } from '@rubigo/components/switch';
import { Input } from '@rubigo/components/input';
import { Tabs } from '@rubigo/components/tabs';
import { Slider } from '@rubigo/components/slider';
import { Collapsible } from '@rubigo/components/collapsible';
import { ToggleGroup } from '@rubigo/components/togglegroup';
import { Tooltip } from '@rubigo/components/tooltip';
import { Dialog } from '@rubigo/components/dialog';
import { Select } from '@rubigo/components/select';
import buttonMeta from '@generated/button.meta.json';
import checkboxMeta from '@generated/checkbox.meta.json';
import switchMeta from '@generated/switch.meta.json';
import inputMeta from '@generated/input.meta.json';
import tabsMeta from '@generated/tabs.meta.json';
import sliderMeta from '@generated/slider.meta.json';
import collapsibleMeta from '@generated/collapsible.meta.json';
import togglegroupMeta from '@generated/togglegroup.meta.json';
import tooltipMeta from '@generated/tooltip.meta.json';
import dialogMeta from '@generated/dialog.meta.json';
import selectMeta from '@generated/select.meta.json';
import { getExamplesFor, type Example } from './examples';

// Available components registry
const COMPONENTS = {
    button: { meta: buttonMeta, component: Button, defaultChildren: 'Click Me' },
    checkbox: { meta: checkboxMeta, component: Checkbox, defaultChildren: 'Accept Terms' },
    switch: { meta: switchMeta, component: Switch, defaultChildren: 'Dark Mode' },
    input: { meta: inputMeta, component: Input, defaultChildren: '' },
    tabs: { meta: tabsMeta, component: Tabs, defaultChildren: '' },
    slider: { meta: sliderMeta, component: Slider, defaultChildren: '' },
    collapsible: { meta: collapsibleMeta, component: Collapsible, defaultChildren: '' },
    togglegroup: { meta: togglegroupMeta, component: ToggleGroup, defaultChildren: '' },
    tooltip: { meta: tooltipMeta, component: Tooltip, defaultChildren: '' },
    dialog: { meta: dialogMeta, component: Dialog, defaultChildren: '' },
    select: { meta: selectMeta, component: Select, defaultChildren: '' },
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
    // -1 = Interactive mode (uses controls), 0+ = spec examples
    const [selectedExample, setSelectedExample] = createSignal<number>(-1);

    // Get examples for current component
    const getExamples = createMemo(() => getExamplesFor(selectedComponent()));

    // Check if component is compound (needs special structure, not just props)
    // These components require sub-components like Tabs.List, Dialog.Portal, etc.
    const COMPOUND_COMPONENTS: ComponentKey[] = ['tabs', 'collapsible', 'togglegroup', 'tooltip', 'dialog', 'select'];
    const isCompoundComponent = createMemo(() => COMPOUND_COMPONENTS.includes(selectedComponent()));

    // Handle component switch
    const switchComponent = (key: ComponentKey) => {
        setSelectedComponent(key);
        const config = COMPONENTS[key];
        setPropValues(getInitialProps(config.meta));
        setChildrenText(config.defaultChildren);
        setEventLog([]);
        // Compound components start at example 0, simple components start at Interactive (-1)
        setSelectedExample(COMPOUND_COMPONENTS.includes(key) ? 0 : -1);
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
    const displayProps = () => {
        const props = { ...propValues() };
        const meta = getMeta();
        // Only show children if component uses simple children (not value prop, not Slot type)
        const hasValueProp = meta.props.some((p: PropMeta) => p.name === 'value');
        const hasSlotChildren = meta.props.some((p: PropMeta) => p.name === 'children' && p.type === 'Slot');
        if (!hasValueProp && !hasSlotChildren) {
            (props as any).children = childrenText();
        }
        return props;
    };

    // Render preview component
    const renderPreview = () => {
        const examples = getExamples();
        const exampleIdx = selectedExample();

        // If a specific example is selected (not Interactive mode), render it
        if (exampleIdx >= 0 && examples.length > 0) {
            const example = examples[exampleIdx];
            if (example) {
                const ExampleComp = example.component;
                return <ExampleComp />;
            }
        }

        // Interactive mode (-1) - render with controls
        // But compound components can't use Interactive mode
        if (COMPOUND_COMPONENTS.includes(selectedComponent())) {
            return <div style={{ color: 'var(--rubigo-text-muted)', 'font-style': 'italic' }}>
                Select an example above to preview this compound component.
            </div>;
        }

        const Comp = componentConfig().component as Component<Record<string, unknown>>;
        // Input is a self-closing component that uses value, not children
        if (selectedComponent() === 'input') {
            return <Comp {...componentProps()} placeholder="Type here..." />;
        }
        return (
            <Comp {...componentProps()}>
                {childrenText()}
            </Comp>
        );
    };

    // Get current example source code for display
    const getExampleSource = () => {
        const exampleIdx = selectedExample();
        if (exampleIdx < 0) return ''; // Interactive mode has no source
        const examples = getExamples();
        if (examples.length > 0) {
            return examples[exampleIdx]?.source ?? '';
        }
        return '';
    };

    // Check if currently in Interactive mode
    const isInteractiveMode = () => selectedExample() === -1;

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
                        {(key) => <option value={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</option>}
                    </For>
                </select>
            </div>

            <ControlPanel
                title="Controls"
                interfaceName={getMeta().interface}
                onReset={resetToDefaults}
            >
                {/* Disable controls when viewing examples */}
                <div style={{
                    opacity: isInteractiveMode() ? 1 : 0.5,
                    'pointer-events': isInteractiveMode() ? 'auto' : 'none',
                }}>
                    {/* Children input - show for simple components (not compound, not value-based) */}
                    <Show when={!COMPOUND_COMPONENTS.includes(selectedComponent()) &&
                        !getMeta().props.some((p: PropMeta) => p.name === 'value')}>
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
                    </Show>

                    {/* Dynamic controls from metadata */}
                    <For each={getMeta().props as PropMeta[]}>
                        {(prop) => renderControl(prop)}
                    </For>
                </div>
                <Show when={!isInteractiveMode()}>
                    <span style={{ 'font-size': '12px', color: 'var(--rubigo-text-muted)', 'font-style': 'italic' }}>
                        Switch to Interactive mode to use controls
                    </span>
                </Show>
            </ControlPanel>

            {/* Example selector - always show for components with examples or simple components */}
            <div style={{
                display: 'flex',
                'align-items': 'center',
                gap: '12px',
                'margin-bottom': '16px'
            }}>
                <span style={{ 'font-weight': '500', color: 'var(--rubigo-text-muted)' }}>Mode:</span>
                <select
                    value={selectedExample()}
                    onChange={(e) => setSelectedExample(parseInt(e.target.value))}
                    style={{
                        padding: '6px 10px',
                        'border-radius': '6px',
                        border: '1px solid var(--rubigo-border)',
                        background: 'var(--rubigo-bg-panel)',
                        color: 'var(--rubigo-text)',
                    }}
                >
                    {/* Interactive mode - only for simple components */}
                    <Show when={!isCompoundComponent()}>
                        <option value={-1}>⚡ Interactive (use controls)</option>
                    </Show>
                    {/* Spec examples */}
                    <For each={getExamples()}>
                        {(ex, i) => <option value={i()}>📄 {ex.name} - {ex.description}</option>}
                    </For>
                </select>
            </div>

            <Preview>
                {renderPreview()}
            </Preview>

            {/* Source code display for examples */}
            <Show when={getExampleSource()}>
                <div style={{
                    'margin-top': '16px',
                    padding: '16px',
                    background: '#1e1e1e',
                    'border-radius': '8px',
                    'overflow-x': 'auto'
                }}>
                    <div style={{
                        display: 'flex',
                        'justify-content': 'space-between',
                        'align-items': 'center',
                        'margin-bottom': '8px'
                    }}>
                        <span style={{ color: '#888', 'font-size': '12px' }}>TSX Source</span>
                    </div>
                    <pre style={{
                        margin: 0,
                        'font-family': 'monospace',
                        'font-size': '12px',
                        color: '#e0e0e0',
                        'white-space': 'pre-wrap'
                    }}>
                        {getExampleSource()}
                    </pre>
                </div>
            </Show>

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

            {/* Spec Test Runner - always visible at bottom */}
            <div style={{ 'margin-top': '32px', 'border-top': '1px solid var(--rubigo-border)', 'padding-top': '24px' }}>
                <SpecTestRunner component={selectedComponent()} />
            </div>
        </div>
    );
};

export default SpecDrivenPOC;
