/**
 * Spec-Driven Gallery Proof of Concept
 * 
 * Demonstrates:
 * 1. Component Registry - maps spec names to actual components
 * 2. Live Component - renders actual component with its own state machine
 * 3. State Inspector - observes component context (read-only)
 * 4. Event Log - logs actions from component callbacks
 */

import { Component, createSignal, For, Show } from 'solid-js';
import { Button, useButton } from '@rubigo/components/button';

// Simulated spec (would come from API in real gallery)
const buttonSpec = {
    name: 'Button',
    id: 'button',
    context: { disabled: false, loading: false, pressed: false },
};

// Event log entry
interface LogEntry {
    timestamp: number;
    event: string;
    payload?: any;
}

const SpecDrivenPOC: Component = () => {
    // Event log
    const [eventLog, setEventLog] = createSignal<LogEntry[]>([]);

    // Use the actual hook - component owns its state
    const btn = useButton({
        onClick: () => logEvent('click'),
    });

    const logEvent = (event: string, payload?: any) => {
        setEventLog(prev => [
            { timestamp: Date.now(), event, payload },
            ...prev.slice(0, 19), // Keep last 20
        ]);
    };

    return (
        <div style={{
            display: 'grid',
            'grid-template-columns': '1fr 300px',
            height: '100vh',
            'font-family': 'system-ui, sans-serif',
        }}>
            {/* Main Preview Area */}
            <div style={{
                padding: '40px',
                display: 'flex',
                'flex-direction': 'column',
                gap: '32px',
            }}>
                <h1 style={{ margin: 0 }}>Spec-Driven Gallery POC</h1>

                {/* Live Component Preview */}
                <section style={{
                    padding: '32px',
                    background: 'var(--bg-secondary, #f9fafb)',
                    'border-radius': '12px',
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                    'min-height': '120px',
                }}>
                    {/* Render the actual Button component */}
                    <Button
                        onClick={() => logEvent('click')}
                        loading={btn.loading()}
                        disabled={btn.disabled()}
                    >
                        Click Me
                    </Button>
                </section>

                {/* Controls - call component methods directly */}
                <section>
                    <h2 style={{ 'font-size': '16px', 'margin-bottom': '12px' }}>Controls</h2>
                    <div style={{ display: 'flex', gap: '8px', 'flex-wrap': 'wrap' }}>
                        <button onClick={() => { btn.startLoading(); logEvent('startLoading'); }}>
                            Start Loading
                        </button>
                        <button onClick={() => { btn.stopLoading(); logEvent('stopLoading'); }}>
                            Stop Loading
                        </button>
                        <button onClick={() => { btn.setDisabled(!btn.disabled()); logEvent('setDisabled', { disabled: !btn.disabled() }); }}>
                            Toggle Disabled
                        </button>
                    </div>
                </section>

                {/* Reset & Event Replay (Global Events from Spec) */}
                <section>
                    <h2 style={{ 'font-size': '16px', 'margin-bottom': '12px' }}>Reset & Event Replay</h2>
                    <p style={{ 'font-size': '12px', color: '#666', 'margin-bottom': '12px' }}>
                        RESET is now a global event defined in the spec - works from any state!
                    </p>
                    <div style={{ display: 'flex', gap: '8px', 'flex-wrap': 'wrap', 'margin-bottom': '12px' }}>
                        <button
                            onClick={() => { const r = btn.send('RESET'); logEvent('RESET (global)', { handled: r.handled }); }}
                            style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 12px', 'border-radius': '4px' }}
                        >
                            Send RESET (Global Event)
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', 'flex-wrap': 'wrap' }}>
                        <button onClick={() => { const r = btn.send('PRESS_DOWN'); logEvent('send:PRESS_DOWN', { handled: r.handled }); }}>
                            Send PRESS_DOWN
                        </button>
                        <button onClick={() => { const r = btn.send('PRESS_UP'); logEvent('send:PRESS_UP', { handled: r.handled }); }}>
                            Send PRESS_UP
                        </button>
                        <button onClick={() => { const r = btn.send('START_LOADING'); logEvent('send:START_LOADING', { handled: r.handled }); }}>
                            Send START_LOADING
                        </button>
                    </div>
                </section>

                {/* State Inspector - reads from component, not shadow context */}
                <section>
                    <h2 style={{ 'font-size': '16px', 'margin-bottom': '12px' }}>State Inspector</h2>
                    <div style={{
                        background: '#1e1e1e',
                        color: '#d4d4d4',
                        padding: '16px',
                        'border-radius': '8px',
                        'font-family': 'monospace',
                        'font-size': '13px',
                    }}>
                        <div><span style={{ color: '#9cdcfe' }}>state:</span> <span style={{ color: '#ce9178' }}>"{btn.state()}"</span></div>
                        <div><span style={{ color: '#9cdcfe' }}>disabled:</span> <span style={{ color: '#569cd6' }}>{btn.disabled() ? 'true' : 'false'}</span></div>
                        <div><span style={{ color: '#9cdcfe' }}>loading:</span> <span style={{ color: '#569cd6' }}>{btn.loading() ? 'true' : 'false'}</span></div>
                        <div><span style={{ color: '#9cdcfe' }}>pressed:</span> <span style={{ color: '#569cd6' }}>{btn.pressed() ? 'true' : 'false'}</span></div>
                    </div>
                </section>
            </div>

            {/* Sidebar - Event Log */}
            <aside style={{
                'border-left': '1px solid var(--border, #e5e7eb)',
                padding: '20px',
                overflow: 'auto',
            }}>
                <h2 style={{ 'font-size': '14px', margin: '0 0 16px 0', 'text-transform': 'uppercase', color: '#666' }}>
                    Event Log ({eventLog().length})
                </h2>
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: '8px' }}>
                    <For each={eventLog()}>
                        {(entry) => (
                            <div style={{
                                padding: '8px 12px',
                                background: 'var(--bg-secondary, #f9fafb)',
                                'border-radius': '6px',
                                'font-size': '12px',
                            }}>
                                <div style={{ 'font-weight': '500' }}>{entry.event}</div>
                                <Show when={entry.payload}>
                                    <div style={{ color: '#666', 'font-family': 'monospace', 'margin-top': '4px' }}>
                                        {JSON.stringify(entry.payload)}
                                    </div>
                                </Show>
                                <div style={{ color: '#999', 'font-size': '10px', 'margin-top': '4px' }}>
                                    {new Date(entry.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                        )}
                    </For>
                    <Show when={eventLog().length === 0}>
                        <div style={{ color: '#999', 'font-size': '13px' }}>
                            No events yet. Interact with the component.
                        </div>
                    </Show>
                </div>
            </aside>
        </div>
    );
};

export default SpecDrivenPOC;
