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
            ) : props.spec?.name?.toLowerCase().includes('tooltip') ? (
                <div style={{
                    display: 'flex',
                    'flex-direction': 'column',
                    'align-items': 'center',
                    gap: '24px',
                    position: 'relative'
                }}>
                    <button
                        onMouseEnter={() => !props.context.disabled && props.onAction('pointer_enter', {})}
                        onMouseLeave={() => props.onAction('pointer_leave', {})}
                        style={{
                            padding: '10px 20px',
                            background: 'var(--accent)',
                            color: 'white',
                            border: 'none',
                            'border-radius': '6px',
                            cursor: props.context.disabled ? 'not-allowed' : 'pointer',
                            opacity: props.context.disabled ? 0.5 : 1,
                            'font-size': '14px'
                        }}
                    >
                        Hover me
                    </button>
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        'margin-top': '8px',
                        padding: '8px 12px',
                        background: 'var(--text-primary)',
                        color: 'var(--bg-primary)',
                        'border-radius': '4px',
                        'font-size': '12px',
                        'white-space': 'nowrap',
                        opacity: props.context.open ? 1 : 0,
                        visibility: props.context.open ? 'visible' : 'hidden',
                        transition: 'opacity 0.15s, visibility 0.15s',
                        'box-shadow': '0 2px 8px rgba(0,0,0,0.2)'
                    }}>
                        This is a tooltip!
                    </div>
                    <div style={{ color: 'var(--text-secondary)', 'font-size': '11px' }}>
                        Current state: {props.currentState}
                    </div>
                </div>
            ) : props.spec?.name?.toLowerCase().includes('dialog') ? (
                <div style={{
                    display: 'flex',
                    'flex-direction': 'column',
                    'align-items': 'center',
                    gap: '16px'
                }}>
                    <button
                        onClick={() => props.onAction('open', {})}
                        style={{
                            padding: '10px 20px',
                            background: 'var(--accent)',
                            color: 'white',
                            border: 'none',
                            'border-radius': '6px',
                            cursor: 'pointer',
                            'font-size': '14px'
                        }}
                    >
                        Open Dialog
                    </button>
                    {props.context.open && (
                        <div style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            'align-items': 'center',
                            'justify-content': 'center',
                            'z-index': 1000
                        }} onClick={() => !props.context.preventClose && props.onAction('backdrop_click', {})}>
                            <div style={{
                                background: 'var(--bg-primary)',
                                padding: '24px',
                                'border-radius': '12px',
                                'max-width': '400px',
                                'box-shadow': '0 8px 32px rgba(0,0,0,0.3)'
                            }} onClick={(e) => e.stopPropagation()}>
                                <h3 style={{ margin: '0 0 12px 0', color: 'var(--text-primary)' }}>Dialog Title</h3>
                                <p style={{ margin: '0 0 20px 0', color: 'var(--text-secondary)', 'font-size': '14px' }}>
                                    This is a modal dialog. Press Escape or click outside to close.
                                </p>
                                <button
                                    onClick={() => props.onAction('close', {})}
                                    style={{
                                        padding: '8px 16px',
                                        background: 'var(--accent)',
                                        color: 'white',
                                        border: 'none',
                                        'border-radius': '6px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
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
