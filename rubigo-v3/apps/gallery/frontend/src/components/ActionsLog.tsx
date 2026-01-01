import { For, Show } from 'solid-js';
import type { Component } from 'solid-js';

interface Action {
    timestamp: number;
    name: string;
    payload?: any;
}

interface Props {
    actions: Action[];
}

export const ActionsLog: Component<Props> = (props) => {
    const formatTime = (ts: number) => {
        const d = new Date(ts);
        return d.toLocaleTimeString('en-US', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
    };

    return (
        <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            'border-radius': '8px',
            padding: '16px',
            'max-height': '200px',
            overflow: 'auto'
        }}>
            <h3 style={{
                'font-size': '12px',
                'text-transform': 'uppercase',
                color: 'var(--text-secondary)',
                'margin-bottom': '12px',
                'letter-spacing': '0.5px'
            }}>
                Actions Log
            </h3>

            <Show when={props.actions.length > 0} fallback={
                <div style={{ 'font-size': '12px', color: 'var(--text-secondary)', 'font-style': 'italic' }}>
                    No actions yet. Interact with the component.
                </div>
            }>
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: '4px' }}>
                    <For each={[...props.actions].reverse()}>
                        {(action) => (
                            <div style={{
                                display: 'flex',
                                gap: '8px',
                                'font-size': '12px',
                                'font-family': 'monospace'
                            }}>
                                <span style={{ color: 'var(--text-secondary)' }}>{formatTime(action.timestamp)}</span>
                                <span style={{ color: 'var(--success)' }}>{action.name}</span>
                                <Show when={action.payload}>
                                    <span style={{ color: 'var(--text-secondary)' }}>
                                        {JSON.stringify(action.payload)}
                                    </span>
                                </Show>
                            </div>
                        )}
                    </For>
                </div>
            </Show>
        </div>
    );
};
