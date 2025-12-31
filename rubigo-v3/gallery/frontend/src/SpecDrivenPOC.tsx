/**
 * Spec-Driven Gallery POC
 */
import { Component } from 'solid-js';
import { Button } from '@rubigo/components/button';

const SpecDrivenPOC: Component = () => {
    return (
        <div style={{ padding: '40px' }}>
            <Button onClick={() => console.log('clicked')}>
                Click Me
            </Button>
        </div>
    );
};

export default SpecDrivenPOC;
