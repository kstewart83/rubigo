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
    const isCheckbox = () => props.spec?.name?.toLowerCase().includes('checkbox');

    const handleToggle = () => {
        if (props.context.disabled || props.context.readOnly) return;
        props.onAction('toggle');
        // Toggle the checked state (in real implementation, this would go through the state machine)
    };

    const handleCheckboxToggle = () => {
        if (props.context.disabled) return;
        props.onAction('toggle');
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
            ) : isCheckbox() ? (
                <button
                    onClick={handleCheckboxToggle}
                    style={{
                        width: '24px',
                        height: '24px',
                        'border-radius': '4px',
                        border: `2px solid ${props.context.checked || props.context.indeterminate ? 'var(--accent)' : 'var(--border)'}`,
                        background: props.context.checked || props.context.indeterminate ? 'var(--accent)' : 'transparent',
                        cursor: props.context.disabled ? 'not-allowed' : 'pointer',
                        opacity: props.context.disabled ? 0.5 : 1,
                        transition: 'all 0.15s',
                        display: 'flex',
                        'align-items': 'center',
                        'justify-content': 'center',
                        color: '#fff',
                        'font-size': '16px',
                        'font-weight': 'bold'
                    }}
                >
                    {props.context.indeterminate ? '−' : props.context.checked ? '✓' : ''}
                </button>
            ) : props.spec?.name?.toLowerCase().includes('button') ? (
                <button
                    onClick={() => !props.context.disabled && !props.context.loading && props.onAction('click')}
                    style={{
                        padding: '12px 24px',
                        'border-radius': '6px',
                        border: 'none',
                        background: props.context.pressed ? 'var(--accent-dark, #0066cc)' : props.context.loading ? 'var(--bg-tertiary)' : 'var(--accent)',
                        color: '#fff',
                        cursor: props.context.disabled || props.context.loading ? 'not-allowed' : 'pointer',
                        opacity: props.context.disabled ? 0.5 : 1,
                        transform: props.context.pressed ? 'scale(0.98)' : 'scale(1)',
                        transition: 'all 0.1s',
                        'font-size': '14px',
                        'font-weight': '500',
                        display: 'flex',
                        'align-items': 'center',
                        gap: '8px'
                    }}
                >
                    {props.context.loading ? (
                        <span style={{
                            width: '14px',
                            height: '14px',
                            border: '2px solid rgba(255,255,255,0.3)',
                            'border-top-color': '#fff',
                            'border-radius': '50%',
                            animation: 'spin 0.8s linear infinite'
                        }} />
                    ) : null}
                    {props.context.loading ? 'Loading...' : 'Click Me'}
                </button>
            ) : props.spec?.name?.toLowerCase().includes('toggle') ? (
                <div style={{
                    display: 'flex',
                    gap: '2px',
                    background: 'var(--bg-tertiary)',
                    'border-radius': '6px',
                    padding: '2px'
                }}>
                    <button
                        onClick={() => !props.context.disabled && props.onAction('select', { id: 'item-0' })}
                        style={{
                            padding: '8px 16px',
                            'border-radius': '4px',
                            border: 'none',
                            background: props.context.selectedId === 'item-0' ? 'var(--accent)' : 'transparent',
                            color: props.context.selectedId === 'item-0' ? '#fff' : 'var(--text-primary)',
                            cursor: props.context.disabled ? 'not-allowed' : 'pointer',
                            opacity: props.context.disabled ? 0.5 : 1,
                            transition: 'all 0.15s',
                            'font-size': '13px',
                            'font-weight': '500'
                        }}
                    >
                        TypeScript
                    </button>
                    <button
                        onClick={() => !props.context.disabled && props.onAction('select', { id: 'item-1' })}
                        style={{
                            padding: '8px 16px',
                            'border-radius': '4px',
                            border: 'none',
                            background: props.context.selectedId === 'item-1' ? 'var(--accent)' : 'transparent',
                            color: props.context.selectedId === 'item-1' ? '#fff' : 'var(--text-primary)',
                            cursor: props.context.disabled ? 'not-allowed' : 'pointer',
                            opacity: props.context.disabled ? 0.5 : 1,
                            transition: 'all 0.15s',
                            'font-size': '13px',
                            'font-weight': '500'
                        }}
                    >
                        WASM
                    </button>
                </div>
            ) : props.spec?.name?.toLowerCase().includes('collapsible') ? (
                <div style={{
                    width: '100%',
                    'max-width': '300px',
                    border: '1px solid var(--border)',
                    'border-radius': '8px',
                    overflow: 'hidden'
                }}>
                    <button
                        onClick={() => !props.context.disabled && props.onAction('toggle', {})}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            background: 'var(--bg-secondary)',
                            border: 'none',
                            display: 'flex',
                            'align-items': 'center',
                            'justify-content': 'space-between',
                            cursor: props.context.disabled ? 'not-allowed' : 'pointer',
                            opacity: props.context.disabled ? 0.5 : 1,
                            color: 'var(--text-primary)',
                            'font-size': '14px',
                            'font-weight': '500'
                        }}
                    >
                        <span>Click to {props.context.open ? 'Collapse' : 'Expand'}</span>
                        <span style={{
                            transform: props.context.open ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s'
                        }}>▼</span>
                    </button>
                    <div style={{
                        'max-height': props.context.open ? '200px' : '0',
                        overflow: 'hidden',
                        transition: 'max-height 0.2s ease-out',
                        background: 'var(--bg-primary)'
                    }}>
                        <div style={{ padding: '16px', color: 'var(--text-secondary)', 'font-size': '13px' }}>
                            This is the collapsible content panel. It expands and collapses
                            with smooth animation when the trigger is clicked.
                        </div>
                    </div>
                </div>
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
