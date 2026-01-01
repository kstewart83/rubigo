import type { Component } from 'solid-js';

interface Props {
    state: string;
    context: Record<string, any>;
}

export const StateInspector: Component<Props> = (props) => {
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
                State Inspector
            </h3>

            <div style={{ 'margin-bottom': '12px' }}>
                <div style={{ 'font-size': '11px', color: 'var(--text-secondary)', 'margin-bottom': '4px' }}>
                    Current State
                </div>
                <div style={{
                    'font-family': 'monospace',
                    'font-size': '14px',
                    color: 'var(--accent)',
                    background: 'var(--bg-tertiary)',
                    padding: '8px 12px',
                    'border-radius': '4px'
                }}>
                    {props.state || 'unknown'}
                </div>
            </div>

            <div>
                <div style={{ 'font-size': '11px', color: 'var(--text-secondary)', 'margin-bottom': '4px' }}>
                    Context
                </div>
                <pre style={{
                    'font-family': 'monospace',
                    'font-size': '12px',
                    color: 'var(--text-primary)',
                    background: 'var(--bg-tertiary)',
                    padding: '8px 12px',
                    'border-radius': '4px',
                    overflow: 'auto',
                    margin: 0
                }}>
                    {JSON.stringify(props.context, null, 2)}
                </pre>
            </div>
        </div>
    );
};
