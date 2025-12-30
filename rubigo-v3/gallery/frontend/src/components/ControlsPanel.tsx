import { For } from 'solid-js';
import type { Component } from 'solid-js';

interface Props {
    spec: {
        machine?: {
            context?: Record<string, any>;
        };
    };
    context: Record<string, any>;
    onUpdate: (key: string, value: any) => void;
}

export const ControlsPanel: Component<Props> = (props) => {
    const contextKeys = () => Object.keys(props.context);

    return (
        <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            'border-radius': '8px',
            padding: '16px'
        }}>
            <h3 style={{
                'font-size': '12px',
                'text-transform': 'uppercase',
                color: 'var(--text-secondary)',
                'margin-bottom': '12px',
                'letter-spacing': '0.5px'
            }}>
                Controls
            </h3>

            <div style={{ display: 'flex', 'flex-direction': 'column', gap: '12px' }}>
                <For each={contextKeys()}>
                    {(key) => {
                        const value = () => props.context[key];
                        const isBool = () => typeof value() === 'boolean';

                        return (
                            <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center' }}>
                                <label style={{ 'font-size': '14px', color: 'var(--text-primary)' }}>{key}</label>
                                {isBool() ? (
                                    <input
                                        type="checkbox"
                                        checked={value()}
                                        onChange={(e) => props.onUpdate(key, e.currentTarget.checked)}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        value={String(value())}
                                        onChange={(e) => props.onUpdate(key, e.currentTarget.value)}
                                        style={{
                                            background: 'var(--bg-tertiary)',
                                            border: '1px solid var(--border)',
                                            'border-radius': '4px',
                                            padding: '4px 8px',
                                            color: 'var(--text-primary)',
                                            width: '100px'
                                        }}
                                    />
                                )}
                            </div>
                        );
                    }}
                </For>
            </div>
        </div>
    );
};
