/**
 * Statechart Interpreter Tests
 *
 * Test vectors derived from spec/interpreter/statechart.sudo.md
 * These must pass in both TypeScript and Rust implementations
 */

import { describe, test, expect } from 'bun:test';
import { Machine, createMachine, type MachineConfig } from './index';

describe('Machine', () => {
    describe('basic transitions', () => {
        test('transitions to target state on event', () => {
            const config: MachineConfig = {
                id: 'test',
                initial: 'a',
                context: {},
                states: {
                    a: { on: { GO: 'b' } },
                    b: { on: {} },
                },
            };

            const machine = createMachine(config);
            expect(machine.getState()).toBe('a');

            const result = machine.send('GO');
            expect(result.handled).toBe(true);
            expect(result.newState).toBe('b');
            expect(machine.getState()).toBe('b');
        });

        test('returns unhandled when no transition exists', () => {
            const config: MachineConfig = {
                id: 'test',
                initial: 'a',
                context: {},
                states: {
                    a: { on: { GO: 'b' } },
                    b: { on: {} },
                },
            };

            const machine = createMachine(config);
            const result = machine.send('UNKNOWN');
            expect(result.handled).toBe(false);
            expect(machine.getState()).toBe('a');
        });
    });

    describe('guards', () => {
        test('guard blocks transition when false', () => {
            const config: MachineConfig = {
                id: 'test',
                initial: 'a',
                context: { allowed: false },
                states: {
                    a: { on: { GO: { target: 'b', guard: 'isAllowed' } } },
                    b: { on: {} },
                },
                guards: {
                    isAllowed: 'context.allowed',
                },
            };

            const machine = createMachine(config);
            const result = machine.send('GO');
            expect(result.handled).toBe(false);
            expect(machine.getState()).toBe('a');
        });

        test('guard allows transition when true', () => {
            const config: MachineConfig = {
                id: 'test',
                initial: 'a',
                context: { allowed: true },
                states: {
                    a: { on: { GO: { target: 'b', guard: 'isAllowed' } } },
                    b: { on: {} },
                },
                guards: {
                    isAllowed: 'context.allowed',
                },
            };

            const machine = createMachine(config);
            const result = machine.send('GO');
            expect(result.handled).toBe(true);
            expect(machine.getState()).toBe('b');
        });

        test('complex guard expression', () => {
            const config: MachineConfig = {
                id: 'test',
                initial: 'a',
                context: { disabled: false, readOnly: false },
                states: {
                    a: { on: { GO: { target: 'b', guard: 'canProceed' } } },
                    b: { on: {} },
                },
                guards: {
                    canProceed: '!context.disabled && !context.readOnly',
                },
            };

            const machine = createMachine(config);
            const result = machine.send('GO');
            expect(result.handled).toBe(true);
        });
    });

    describe('actions', () => {
        test('executes transition actions', () => {
            const config: MachineConfig = {
                id: 'test',
                initial: 'a',
                context: { count: 0 },
                states: {
                    a: { on: { GO: { target: 'b', actions: ['increment'] } } },
                    b: { on: {} },
                },
                actions: {
                    increment: { mutation: 'context.count = context.count + 1' },
                },
            };

            const machine = createMachine(config);
            const result = machine.send('GO');
            expect(result.handled).toBe(true);
            expect(result.actionsExecuted).toContain('increment');
            expect(machine.getContext().count).toBe(1);
        });

        test('toggle action inverts boolean', () => {
            const config: MachineConfig = {
                id: 'test',
                initial: 'a',
                context: { checked: false },
                states: {
                    a: { on: { TOGGLE: { target: 'a', actions: ['toggle'] } } },
                },
                actions: {
                    toggle: { mutation: 'context.checked = !context.checked' },
                },
            };

            const machine = createMachine(config);

            machine.send('TOGGLE');
            expect(machine.getContext().checked).toBe(true);

            machine.send('TOGGLE');
            expect(machine.getContext().checked).toBe(false);
        });

        test('executes actions in order: exit -> transition -> entry', () => {
            const executed: string[] = [];

            const config: MachineConfig = {
                id: 'test',
                initial: 'a',
                context: {},
                states: {
                    a: {
                        exit: ['exitA'],
                        on: { GO: { target: 'b', actions: ['transitionAction'] } },
                    },
                    b: {
                        entry: ['entryB'],
                        on: {},
                    },
                },
                actions: {
                    exitA: { mutation: 'context.exitA = true' },
                    transitionAction: { mutation: 'context.transition = true' },
                    entryB: { mutation: 'context.entryB = true' },
                },
            };

            const machine = createMachine(config);
            const result = machine.send('GO');

            expect(result.actionsExecuted).toEqual(['exitA', 'transitionAction', 'entryB']);
        });
    });

    describe('switch component spec', () => {
        // Load the actual generated switch config
        test('switch toggle with guard', async () => {
            // Simulating the switch config structure
            const config: MachineConfig = {
                id: 'switch',
                initial: 'idle',
                context: { checked: false, disabled: false, readOnly: false, focused: false },
                states: {
                    idle: {
                        on: {
                            FOCUS: { target: 'focused', actions: ['setFocused'] },
                            TOGGLE: { target: 'idle', actions: ['toggle'], guard: 'canToggle' },
                        },
                    },
                    focused: {
                        on: {
                            BLUR: { target: 'idle', actions: ['clearFocused'] },
                            TOGGLE: { target: 'focused', actions: ['toggle'], guard: 'canToggle' },
                        },
                    },
                },
                guards: {
                    canToggle: '!context.disabled && !context.readOnly',
                },
                actions: {
                    toggle: { mutation: 'context.checked = !context.checked' },
                    setFocused: { mutation: 'context.focused = true' },
                    clearFocused: { mutation: 'context.focused = false' },
                },
            };

            const machine = createMachine(config);

            // Test toggle
            machine.send('TOGGLE');
            expect(machine.getContext().checked).toBe(true);

            // Test focus
            machine.send('FOCUS');
            expect(machine.getState()).toBe('focused');
            expect(machine.getContext().focused).toBe(true);

            // Toggle while focused
            machine.send('TOGGLE');
            expect(machine.getContext().checked).toBe(false);
            expect(machine.getState()).toBe('focused');

            // Blur
            machine.send('BLUR');
            expect(machine.getState()).toBe('idle');
            expect(machine.getContext().focused).toBe(false);
        });

        test('disabled switch blocks toggle', () => {
            const config: MachineConfig = {
                id: 'switch',
                initial: 'idle',
                context: { checked: false, disabled: true, readOnly: false, focused: false },
                states: {
                    idle: {
                        on: {
                            TOGGLE: { target: 'idle', actions: ['toggle'], guard: 'canToggle' },
                        },
                    },
                },
                guards: {
                    canToggle: '!context.disabled && !context.readOnly',
                },
                actions: {
                    toggle: { mutation: 'context.checked = !context.checked' },
                },
            };

            const machine = createMachine(config);
            const result = machine.send('TOGGLE');

            expect(result.handled).toBe(false);
            expect(machine.getContext().checked).toBe(false); // Unchanged
        });
    });
});

describe('Performance', () => {
    test('handles 1M transitions in reasonable time', () => {
        const config: MachineConfig = {
            id: 'perf',
            initial: 'a',
            context: { count: 0 },
            states: {
                a: { on: { TICK: { target: 'a', actions: ['inc'] } } },
            },
            actions: {
                inc: { mutation: 'context.count = context.count + 1' },
            },
        };

        const machine = createMachine(config);
        const iterations = 1_000_000;

        const start = performance.now();
        for (let i = 0; i < iterations; i++) {
            machine.send('TICK');
        }
        const elapsed = performance.now() - start;

        console.log(`\n  ${iterations.toLocaleString()} transitions in ${elapsed.toFixed(2)}ms`);
        console.log(`  ${(iterations / elapsed * 1000).toLocaleString()} events/sec`);

        expect(machine.getContext().count).toBe(iterations);
        // Should complete in under 5 seconds
        expect(elapsed).toBeLessThan(5000);
    });
});
