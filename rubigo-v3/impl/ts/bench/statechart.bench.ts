/**
 * Statechart Benchmarks
 */

import { bench, group, run } from 'mitata';
import { createMachine } from '../statechart';
import { switchConfig, createSwitchConfig } from '../switch/config';

// Simple machine for basic throughput
const simpleConfig = {
    id: 'simple',
    initial: 'a',
    context: {},
    states: {
        a: { on: { GO: 'b' } },
        b: { on: { GO: 'a' } },
    },
};

// Machine with actions
const actionConfig = {
    id: 'action',
    initial: 'a',
    context: { count: 0 },
    states: {
        a: { on: { TICK: { target: 'a', actions: ['inc'] } } },
    },
    actions: {
        inc: { mutation: 'context.count = context.count + 1' },
    },
};

group('Machine Creation', () => {
    bench('simple machine', () => { createMachine(simpleConfig); });
    bench('with actions', () => { createMachine(actionConfig); });
    bench('switch component', () => { createMachine(switchConfig); });
});

group('Event Handling', () => {
    const simple = createMachine(simpleConfig);
    const withAction = createMachine(actionConfig);
    const switchMachine = createMachine(switchConfig);

    bench('simple transition', () => { simple.send('GO'); });
    bench('with mutation action', () => { withAction.send('TICK'); });
    bench('switch toggle (guard + action)', () => { switchMachine.send('TOGGLE'); });
});

group('Throughput (1M events)', () => {
    bench('simple transitions', () => {
        const machine = createMachine(simpleConfig);
        for (let i = 0; i < 1_000_000; i++) machine.send('GO');
    });

    bench('with mutations', () => {
        const machine = createMachine(actionConfig);
        for (let i = 0; i < 1_000_000; i++) machine.send('TICK');
    });
});

await run();
