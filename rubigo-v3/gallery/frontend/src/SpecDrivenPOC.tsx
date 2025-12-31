/**
 * Spec-Driven Gallery POC
 * 
 * Dynamically generates controls from component metadata
 */
import { Component, createSignal, createEffect, For } from 'solid-js';
import { Button } from '@rubigo/components/button';
import buttonMeta from '../../../generated/button.meta.json';

// Type for prop metadata
interface PropMeta {
    name: string;
    type: string;
    options?: string[];
    optional: boolean;
    default?: string;
    description?: string;
}

interface ComponentMeta {
    component: string;
    interface: string;
    props: PropMeta[];
}

const SpecDrivenPOC: Component = () => {
    const meta = buttonMeta as ComponentMeta;

    // Create a reactive store for all props
    const [propValues, setPropValues] = createSignal<Record<string, unknown>>(() => {
        const initial: Record<string, unknown> = {};
        for (const prop of meta.props) {
            if (prop.default) {
                if (prop.type === 'boolean') {
                    initial[prop.name] = prop.default === 'true';
                } else {
                    initial[prop.name] = prop.default;
                }
            }
        }
        return initial;
    });

    const updateProp = (name: string, value: unknown) => {
        setPropValues(prev => ({ ...prev, [name]: value }));
    };

    // Build props object for the component
    const getComponentProps = () => {
        const props: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(propValues())) {
            props[key] = value;
        }
        // Add onClick handler
        props.onClick = () => console.log('clicked');
        return props;
    };

    // Render a control for a single prop
    const renderControl = (prop: PropMeta) => {
        // Skip children and function props (not controllable)
        if (prop.name === 'children' || prop.type === 'function' || prop.type === 'Slot') {
            return null;
        }

        if (prop.type === 'boolean') {
            return (
                <label style={{ display: 'flex', gap: '8px', 'align-items': 'center' }}>
                    <input
                        type="checkbox"
                        checked={propValues()[prop.name] as boolean || false}
                        onChange={(e) => updateProp(prop.name, e.target.checked)}
                    />
                    <span>{prop.name}</span>
                    {prop.description && <small style={{ color: '#666' }}>({prop.description})</small>}
                </label>
            );
        }

        if (prop.type === 'union' && prop.options) {
            return (
                <div style={{ display: 'flex', gap: '8px', 'align-items': 'center' }}>
                    <strong>{prop.name}:</strong>
                    <select
                        value={propValues()[prop.name] as string || prop.default || ''}
                        onChange={(e) => updateProp(prop.name, e.target.value)}
                    >
                        <For each={prop.options}>
                            {(option) => <option value={option}>{option}</option>}
                        </For>
                    </select>
                </div>
            );
        }

        return null;
    };

    return (
        <div style={{ padding: '40px', 'font-family': 'system-ui' }}>
            <h1>{meta.interface.replace('Props', '')} Component</h1>

            {/* Live Preview */}
            <div style={{ padding: '40px', background: '#f5f5f5', 'border-radius': '8px', 'margin-bottom': '20px' }}>
                <Button {...getComponentProps()}>
                    Click Me
                </Button>
            </div>

            {/* Auto-generated Controls */}
            <div style={{ display: 'grid', 'grid-template-columns': 'repeat(2, 1fr)', gap: '16px' }}>
                <For each={meta.props}>
                    {(prop) => renderControl(prop)}
                </For>
            </div>
        </div>
    );
};

export default SpecDrivenPOC;
