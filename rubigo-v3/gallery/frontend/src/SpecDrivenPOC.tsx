/**
 * Spec-Driven Gallery POC
 * 
 * Props derived from button.sudo.md Component API:
 * - disabled: boolean = false
 * - loading: boolean = false
 * - variant: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "link" = "primary"
 * - size: "sm" | "md" | "lg" | "icon" = "md"
 * - onClick: () => void
 * - children: slot
 */
import { Component, createSignal } from 'solid-js';
import { Button } from '@rubigo/components/button';

const VARIANTS = ["primary", "secondary", "outline", "ghost", "destructive", "link"] as const;
const SIZES = ["sm", "md", "lg", "icon"] as const;

const SpecDrivenPOC: Component = () => {
    // State inputs
    const [disabled, setDisabled] = createSignal(false);
    const [loading, setLoading] = createSignal(false);

    // Styling
    const [variant, setVariant] = createSignal<typeof VARIANTS[number]>("primary");
    const [size, setSize] = createSignal<typeof SIZES[number]>("md");

    // Event log
    const [log, setLog] = createSignal<string[]>([]);
    const addLog = (msg: string) => setLog(prev => [msg, ...prev.slice(0, 4)]);

    return (
        <div style={{ padding: '20px', 'font-family': 'system-ui' }}>
            <h1>Button Component</h1>

            {/* Live Preview */}
            <div style={{ padding: '40px', background: '#f5f5f5', 'border-radius': '8px', 'margin-bottom': '20px' }}>
                <Button
                    disabled={disabled()}
                    loading={loading()}
                    variant={variant()}
                    size={size()}
                    onClick={() => addLog('onClick')}
                >
                    Click Me
                </Button>
            </div>

            {/* Controls - derived from Component API */}
            <div style={{ display: 'grid', 'grid-template-columns': 'repeat(2, 1fr)', gap: '16px', 'margin-bottom': '20px' }}>
                {/* State inputs */}
                <label>
                    <input type="checkbox" checked={disabled()} onChange={(e) => setDisabled(e.target.checked)} />
                    {' '}disabled
                </label>
                <label>
                    <input type="checkbox" checked={loading()} onChange={(e) => setLoading(e.target.checked)} />
                    {' '}loading
                </label>

                {/* Styling - variant */}
                <div>
                    <strong>variant:</strong>{' '}
                    <select value={variant()} onChange={(e) => setVariant(e.target.value as any)}>
                        {VARIANTS.map(v => <option value={v}>{v}</option>)}
                    </select>
                </div>

                {/* Styling - size */}
                <div>
                    <strong>size:</strong>{' '}
                    {SIZES.map(s => (
                        <label style={{ 'margin-right': '8px' }}>
                            <input type="radio" name="size" checked={size() === s} onChange={() => setSize(s)} />
                            {' '}{s}
                        </label>
                    ))}
                </div>
            </div>

            {/* Event Log */}
            <div>
                <strong>Events:</strong>
                <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '12px', 'border-radius': '4px' }}>
                    {log().length ? log().join('\n') : '(click the button)'}
                </pre>
            </div>
        </div>
    );
};

export default SpecDrivenPOC;
