/**
 * useSwitch Hook Tests
 */

import { describe, test, expect } from 'bun:test';
import { createMachine } from '../statechart';
import { switchConfig, createSwitchConfig } from '../switch/config';

describe('useSwitch (machine logic)', () => {
    test('initial state is idle with unchecked', () => {
        const machine = createMachine(switchConfig);
        expect(machine.getState()).toBe('idle');
        expect(machine.getContext().checked).toBe(false);
    });

    test('toggle changes checked state', () => {
        const machine = createMachine(switchConfig);
        machine.send('TOGGLE');
        expect(machine.getContext().checked).toBe(true);
        machine.send('TOGGLE');
        expect(machine.getContext().checked).toBe(false);
    });

    test('focus transitions to focused state', () => {
        const machine = createMachine(switchConfig);
        machine.send('FOCUS');
        expect(machine.getState()).toBe('focused');
        expect(machine.getContext().focused).toBe(true);
    });

    test('blur returns to idle state', () => {
        const machine = createMachine(switchConfig);
        machine.send('FOCUS');
        machine.send('BLUR');
        expect(machine.getState()).toBe('idle');
        expect(machine.getContext().focused).toBe(false);
    });

    test('can toggle while focused', () => {
        const machine = createMachine(switchConfig);
        machine.send('FOCUS');
        machine.send('TOGGLE');
        expect(machine.getContext().checked).toBe(true);
        expect(machine.getState()).toBe('focused');
    });

    test('disabled prevents toggle', () => {
        const machine = createMachine(createSwitchConfig({ disabled: true }));
        const result = machine.send('TOGGLE');
        expect(result.handled).toBe(false);
        expect(machine.getContext().checked).toBe(false);
    });

    test('readOnly prevents toggle', () => {
        const machine = createMachine(createSwitchConfig({ readOnly: true }));
        const result = machine.send('TOGGLE');
        expect(result.handled).toBe(false);
        expect(machine.getContext().checked).toBe(false);
    });

    test('initial checked state can be overridden', () => {
        const machine = createMachine(createSwitchConfig({ checked: true }));
        expect(machine.getContext().checked).toBe(true);
    });
});
