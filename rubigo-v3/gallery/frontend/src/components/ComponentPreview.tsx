import type { Component } from 'solid-js';

interface Props {
    spec: {
        id: string;
        name: string;
        machine: any;
    };
    engine: 'ts' | 'wasm';
    context: Record<string, any>;
    currentState: string;
    onStateChange: (state: string) => void;
    onAction: (name: string, payload?: any) => void;
}

export const ComponentPreview: Component<Props> = (props) => {
    // For Switch component, render a styled toggle
    const isSwitch = () => props.spec?.name?.toLowerCase().includes('switch');

    const handleToggle = () => {
        if (props.context.disabled || props.context.readOnly) return;
        props.onAction('toggle');
        // Toggle the checked state (in real implementation, this would go through the state machine)
    };

    return (
        <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            'border-radius': '8px',
            padding: '24px',
            display: 'flex',
            'flex-direction': 'column',
            'align-items': 'center',
            'justify-content': 'center',
            'min-height': '200px'
        }}>
            <div style={{
                'font-size': '11px',
                'text-transform': 'uppercase',
                color: 'var(--text-secondary)',
                'margin-bottom': '16px',
                'letter-spacing': '0.5px'
            }}>
                Component Preview ({props.engine.toUpperCase()})
            </div>

            {isSwitch() ? (
                <button
                    onClick={handleToggle}
                    style={{
                        width: '56px',
                        height: '32px',
                        'border-radius': '16px',
                        border: 'none',
                        background: props.context.checked ? 'var(--accent)' : 'var(--bg-tertiary)',
                        cursor: props.context.disabled || props.context.readOnly ? 'not-allowed' : 'pointer',
                        opacity: props.context.disabled ? 0.5 : 1,
                        transition: 'background 0.2s',
                        position: 'relative'
                    }}
                >
                    <span style={{
                        position: 'absolute',
                        top: '4px',
                        left: props.context.checked ? '28px' : '4px',
                        width: '24px',
                        height: '24px',
                        'border-radius': '12px',
                        background: '#fff',
                        transition: 'left 0.2s',
                        'box-shadow': '0 2px 4px rgba(0,0,0,0.2)'
                    }} />
                </button>
            ) : (
                <div style={{ color: 'var(--text-secondary)' }}>
                    No preview available for {props.spec?.name}
                </div>
            )}

            <div style={{
                'margin-top': '16px',
                'font-size': '12px',
                color: 'var(--text-secondary)'
            }}>
                State: <span style={{ color: 'var(--accent)' }}>{props.currentState}</span>
            </div>
        </div>
    );
};
