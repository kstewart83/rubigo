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
                    onKeyDown={(e) => {
                        if (props.context.disabled || props.context.readOnly) return;
                        if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            props.onAction('toggle');
                        }
                    }}
                    onFocus={() => !props.context.disabled && props.onAction('focus')}
                    onBlur={() => props.onAction('blur')}
                    style={{
                        width: '56px',
                        height: '32px',
                        'border-radius': '16px',
                        border: props.context.focused ? '2px solid var(--accent)' : 'none',
                        background: props.context.checked ? 'var(--accent)' : 'var(--bg-tertiary)',
                        cursor: props.context.disabled || props.context.readOnly ? 'not-allowed' : 'pointer',
                        opacity: props.context.disabled ? 0.5 : 1,
                        transition: 'background 0.2s',
                        position: 'relative',
                        outline: 'none'
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
                    onKeyDown={(e) => {
                        if (props.context.disabled) return;
                        if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            props.onAction('toggle');
                        }
                    }}
                    onFocus={() => !props.context.disabled && props.onAction('focus')}
                    onBlur={() => props.onAction('blur')}
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
                        'font-weight': 'bold',
                        outline: props.context.focused ? '2px solid var(--accent)' : 'none',
                        'outline-offset': '2px'
                    }}
                >
                    {props.context.indeterminate ? '−' : props.context.checked ? '✓' : ''}
                </button>
            ) : props.spec?.name?.toLowerCase().includes('button') ? (
                <button
                    onMouseDown={() => !props.context.disabled && !props.context.loading && props.onAction('pressDown')}
                    onMouseUp={() => !props.context.disabled && !props.context.loading && props.onAction('pressUp')}
                    onMouseLeave={() => props.context.pressed && props.onAction('cancelPress')}
                    onKeyDown={(e) => {
                        if (props.context.disabled || props.context.loading) return;
                        if (e.key === ' ') {
                            e.preventDefault();
                            props.onAction('pressDown');
                        } else if (e.key === 'Enter') {
                            e.preventDefault();
                            props.onAction('click');
                        }
                    }}
                    onKeyUp={(e) => {
                        if (props.context.disabled || props.context.loading) return;
                        if (e.key === ' ') {
                            e.preventDefault();
                            props.onAction('pressUp');
                            props.onAction('click');
                        }
                    }}
                    onFocus={() => !props.context.disabled && props.onAction('focus')}
                    onBlur={() => props.onAction('blur')}
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
                        onKeyDown={(e) => {
                            if (props.context.disabled) return;
                            if (e.key === ' ' || e.key === 'Enter') {
                                e.preventDefault();
                                props.onAction('toggle', {});
                            }
                        }}
                        onFocus={() => !props.context.disabled && props.onAction('focus')}
                        onBlur={() => props.onAction('blur')}
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
                            'font-weight': '500',
                            outline: props.context.focused ? '2px solid var(--accent)' : 'none',
                            'outline-offset': '-2px'
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
            ) : props.spec?.name?.toLowerCase().includes('select') ? (
                <div style={{
                    display: 'flex',
                    'flex-direction': 'column',
                    'align-items': 'center',
                    gap: '8px',
                    position: 'relative'
                }}>
                    <button
                        onClick={() => props.context.open ? props.onAction('close', {}) : props.onAction('open', {})}
                        style={{
                            padding: '10px 16px',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border)',
                            'border-radius': '6px',
                            cursor: props.context.disabled ? 'not-allowed' : 'pointer',
                            opacity: props.context.disabled ? 0.5 : 1,
                            'min-width': '180px',
                            display: 'flex',
                            'justify-content': 'space-between',
                            'align-items': 'center',
                            'font-size': '14px'
                        }}
                    >
                        <span>{props.context.selectedValue || 'Select...'}</span>
                        <span style={{ transform: props.context.open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                    </button>
                    {props.context.open && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border)',
                            'border-radius': '6px',
                            'margin-top': '4px',
                            'box-shadow': '0 4px 12px rgba(0,0,0,0.15)',
                            overflow: 'hidden'
                        }}>
                            {['Option 1', 'Option 2', 'Option 3'].map((opt) => (
                                <div
                                    onClick={() => props.onAction('select', { value: opt })}
                                    style={{
                                        padding: '10px 16px',
                                        cursor: 'pointer',
                                        background: props.context.highlightedValue === opt ? 'var(--accent)' : 'transparent',
                                        color: props.context.highlightedValue === opt ? 'white' : 'var(--text-primary)',
                                        'font-size': '14px'
                                    }}
                                >
                                    {opt}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : props.spec?.name?.toLowerCase().includes('slider') ? (
                <div
                    tabIndex={props.context.disabled ? -1 : 0}
                    onKeyDown={(e) => {
                        if (props.context.disabled) return;
                        const step = props.context.stepSize ?? props.context.step ?? 1;
                        const largeStep = step * 10;
                        switch (e.key) {
                            case 'ArrowRight':
                            case 'ArrowUp':
                                e.preventDefault();
                                props.onAction('increment', {});
                                break;
                            case 'ArrowLeft':
                            case 'ArrowDown':
                                e.preventDefault();
                                props.onAction('decrement', {});
                                break;
                            case 'PageUp':
                                e.preventDefault();
                                props.onAction('setValue', { value: Math.min(props.context.max ?? 100, (props.context.value ?? 0) + largeStep) });
                                break;
                            case 'PageDown':
                                e.preventDefault();
                                props.onAction('setValue', { value: Math.max(props.context.min ?? 0, (props.context.value ?? 0) - largeStep) });
                                break;
                            case 'Home':
                                e.preventDefault();
                                props.onAction('setValue', { value: props.context.min ?? 0 });
                                break;
                            case 'End':
                                e.preventDefault();
                                props.onAction('setValue', { value: props.context.max ?? 100 });
                                break;
                        }
                    }}
                    onFocus={() => !props.context.disabled && props.onAction('focus')}
                    onBlur={() => props.onAction('blur')}
                    style={{
                        display: 'flex',
                        'flex-direction': 'column',
                        'align-items': 'center',
                        gap: '16px',
                        width: '100%',
                        'max-width': '300px',
                        outline: props.context.focused ? '2px solid var(--accent)' : 'none',
                        'outline-offset': '4px',
                        'border-radius': '4px'
                    }}
                >
                    <div style={{
                        width: '100%',
                        height: '8px',
                        background: 'var(--bg-secondary)',
                        'border-radius': '4px',
                        position: 'relative',
                        cursor: props.context.disabled ? 'not-allowed' : 'pointer',
                        opacity: props.context.disabled ? 0.5 : 1
                    }}>
                        <div style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: `${((props.context.value - props.context.min) / (props.context.max - props.context.min)) * 100}%`,
                            background: 'var(--accent)',
                            'border-radius': '4px'
                        }} />
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: `${((props.context.value - props.context.min) / (props.context.max - props.context.min)) * 100}%`,
                            transform: 'translate(-50%, -50%)',
                            width: '20px',
                            height: '20px',
                            background: 'var(--accent)',
                            'border-radius': '50%',
                            'box-shadow': props.context.dragging ? '0 0 0 4px rgba(var(--accent-rgb), 0.3)' : 'none',
                            transition: 'box-shadow 0.15s'
                        }} />
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <button
                            onClick={() => props.onAction('decrement', {})}
                            style={{
                                padding: '6px 12px',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border)',
                                'border-radius': '4px',
                                cursor: 'pointer'
                            }}
                        >−</button>
                        <span style={{ color: 'var(--text-primary)', 'font-weight': 'bold' }}>{props.context.value}</span>
                        <button
                            onClick={() => props.onAction('increment', {})}
                            style={{
                                padding: '6px 12px',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border)',
                                'border-radius': '4px',
                                cursor: 'pointer'
                            }}
                        >+</button>
                    </div>
                </div>
            ) : props.spec?.name?.toLowerCase().includes('input') ? (
                <div style={{
                    display: 'flex',
                    'flex-direction': 'column',
                    gap: '12px',
                    'min-width': '280px'
                }}>
                    <input
                        type="text"
                        value={props.context.value || ''}
                        placeholder="Type something..."
                        disabled={props.context.disabled}
                        readOnly={props.context.readOnly}
                        onFocus={() => !props.context.disabled && props.onAction('focus')}
                        onBlur={() => props.onAction('blur')}
                        onInput={(e) => props.onAction('change', { value: (e.target as HTMLInputElement).value })}
                        style={{
                            padding: '12px 16px',
                            'border-radius': '6px',
                            border: `2px solid ${props.context.error ? 'var(--error, #ef4444)' :
                                props.context.focused ? 'var(--accent)' : 'var(--border)'
                                }`,
                            background: props.context.disabled ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            cursor: props.context.disabled ? 'not-allowed' : 'text',
                            opacity: props.context.disabled ? 0.6 : 1,
                            outline: 'none',
                            'font-size': '14px',
                            transition: 'border-color 0.15s'
                        }}
                    />
                    {props.context.error && (
                        <div style={{
                            color: 'var(--error, #ef4444)',
                            'font-size': '12px',
                            'margin-top': '-4px'
                        }}>
                            {props.context.error}
                        </div>
                    )}
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        'justify-content': 'center'
                    }}>
                        <span style={{
                            padding: '4px 8px',
                            'border-radius': '4px',
                            'font-size': '11px',
                            background: props.context.focused ? 'var(--accent)' : 'var(--bg-tertiary)',
                            color: props.context.focused ? '#fff' : 'var(--text-secondary)'
                        }}>
                            {props.context.focused ? '● Focused' : '○ Idle'}
                        </span>
                        {props.context.disabled && (
                            <span style={{
                                padding: '4px 8px',
                                'border-radius': '4px',
                                'font-size': '11px',
                                background: 'var(--bg-tertiary)',
                                color: 'var(--text-secondary)'
                            }}>
                                🚫 Disabled
                            </span>
                        )}
                        {props.context.readOnly && (
                            <span style={{
                                padding: '4px 8px',
                                'border-radius': '4px',
                                'font-size': '11px',
                                background: 'var(--bg-tertiary)',
                                color: 'var(--text-secondary)'
                            }}>
                                🔒 Read-only
                            </span>
                        )}
                    </div>
                </div>
            ) : props.spec?.name?.toLowerCase().includes('card') ? (
                <div style={{
                    display: 'flex',
                    'flex-direction': 'column',
                    gap: '16px',
                    width: '280px'
                }}>
                    <div style={{
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border)',
                        'border-radius': '8px',
                        'box-shadow': '0 2px 8px rgba(0,0,0,0.08)',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            padding: '16px',
                            'border-bottom': '1px solid var(--border)'
                        }}>
                            <div style={{ 'font-weight': '600', 'font-size': '14px' }}>Card Title</div>
                            <div style={{ color: 'var(--text-secondary)', 'font-size': '12px', 'margin-top': '4px' }}>
                                Card description text
                            </div>
                        </div>
                        <div style={{ padding: '16px', color: 'var(--text-primary)', 'font-size': '14px' }}>
                            Card body content goes here. Cards are presentational components for grouping content.
                        </div>
                        <div style={{
                            padding: '12px 16px',
                            background: 'var(--bg-secondary)',
                            'font-size': '12px',
                            color: 'var(--text-secondary)'
                        }}>
                            Card footer
                        </div>
                    </div>
                    <span style={{
                        'font-size': '11px',
                        color: 'var(--text-secondary)',
                        'text-align': 'center'
                    }}>
                        📦 Presentational component (no state)
                    </span>
                </div>
            ) : props.spec?.name?.toLowerCase().includes('separator') ? (
                <div style={{
                    display: 'flex',
                    'flex-direction': 'column',
                    gap: '16px',
                    width: '280px'
                }}>
                    <div style={{ color: 'var(--text-primary)', 'font-size': '14px' }}>
                        Content above separator
                    </div>
                    <hr style={{
                        width: '100%',
                        border: 'none',
                        'border-top': '1px solid var(--border)',
                        margin: '8px 0'
                    }} />
                    <div style={{ color: 'var(--text-primary)', 'font-size': '14px' }}>
                        Content below separator
                    </div>
                    <div style={{ display: 'flex', 'align-items': 'center', gap: '16px', 'margin-top': '16px' }}>
                        <span style={{ color: 'var(--text-primary)', 'font-size': '13px' }}>Left</span>
                        <div style={{
                            width: '1px',
                            height: '24px',
                            background: 'var(--border)'
                        }} />
                        <span style={{ color: 'var(--text-primary)', 'font-size': '13px' }}>Right</span>
                    </div>
                    <span style={{
                        'font-size': '11px',
                        color: 'var(--text-secondary)',
                        'text-align': 'center'
                    }}>
                        ➖ Horizontal & vertical variants
                    </span>
                </div>
            ) : props.spec?.name?.toLowerCase().includes('scrollarea') || props.spec?.name?.toLowerCase().includes('scroll') ? (
                <div style={{
                    display: 'flex',
                    'flex-direction': 'column',
                    gap: '12px',
                    width: '280px'
                }}>
                    <div style={{
                        height: '160px',
                        overflow: 'auto',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border)',
                        'border-radius': '6px',
                        padding: '12px',
                        'font-size': '13px',
                        color: 'var(--text-primary)'
                    }}>
                        <p style={{ margin: '0 0 12px' }}>Scroll me! ↓</p>
                        <p style={{ margin: '0 0 12px' }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                        <p style={{ margin: '0 0 12px' }}>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                        <p style={{ margin: '0 0 12px' }}>Ut enim ad minim veniam, quis nostrud exercitation.</p>
                        <p style={{ margin: '0 0 12px' }}>Duis aute irure dolor in reprehenderit in voluptate.</p>
                        <p style={{ margin: 0 }}>Excepteur sint occaecat cupidatat non proident.</p>
                    </div>
                    <span style={{
                        'font-size': '11px',
                        color: 'var(--text-secondary)',
                        'text-align': 'center'
                    }}>
                        📜 Custom scrollbars with styling
                    </span>
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
