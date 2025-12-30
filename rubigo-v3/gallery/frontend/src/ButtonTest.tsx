/**
 * Button Test Page
 * 
 * Simple page to test the Button component from components-ts.
 */

import { Component, createSignal } from 'solid-js';
import { Button } from '@rubigo/components/button';

const ButtonTest: Component = () => {
    const [clicks, setClicks] = createSignal(0);
    const [loading, setLoading] = createSignal(false);

    const handleClick = () => {
        setClicks(c => c + 1);
    };

    const handleLoadingClick = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 2000);
    };

    return (
        <div style={{
            padding: '40px',
            'font-family': 'system-ui, sans-serif',
            'max-width': '800px',
            margin: '0 auto',
        }}>
            <h1 style={{ 'margin-bottom': '24px' }}>Button Component Test</h1>

            <section style={{ 'margin-bottom': '32px' }}>
                <h2 style={{ 'margin-bottom': '16px', 'font-size': '18px' }}>Variants</h2>
                <div style={{ display: 'flex', gap: '12px', 'flex-wrap': 'wrap' }}>
                    <Button variant="primary" onClick={handleClick}>
                        Primary ({clicks()})
                    </Button>
                    <Button variant="secondary" onClick={handleClick}>
                        Secondary
                    </Button>
                    <Button variant="ghost" onClick={handleClick}>
                        Ghost
                    </Button>
                </div>
            </section>

            <section style={{ 'margin-bottom': '32px' }}>
                <h2 style={{ 'margin-bottom': '16px', 'font-size': '18px' }}>Sizes</h2>
                <div style={{ display: 'flex', gap: '12px', 'align-items': 'center' }}>
                    <Button size="sm">Small</Button>
                    <Button size="md">Medium</Button>
                    <Button size="lg">Large</Button>
                </div>
            </section>

            <section style={{ 'margin-bottom': '32px' }}>
                <h2 style={{ 'margin-bottom': '16px', 'font-size': '18px' }}>States</h2>
                <div style={{ display: 'flex', gap: '12px', 'align-items': 'center' }}>
                    <Button disabled>Disabled</Button>
                    <Button loading={loading()} onClick={handleLoadingClick}>
                        {loading() ? 'Loading...' : 'Click to Load'}
                    </Button>
                </div>
            </section>

            <section>
                <h2 style={{ 'margin-bottom': '16px', 'font-size': '18px' }}>Press State</h2>
                <p style={{ 'margin-bottom': '12px', color: '#666', 'font-size': '14px' }}>
                    Hold mouse down or press Space to see pressed state
                </p>
                <Button variant="primary" size="lg">
                    Hold Me Down
                </Button>
            </section>
        </div>
    );
};

export default ButtonTest;
