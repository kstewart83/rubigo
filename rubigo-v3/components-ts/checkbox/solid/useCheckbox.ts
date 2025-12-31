/**
 * useCheckbox - SolidJS hook for a spec-driven checkbox
 *
 * Based on the checkbox.sudo.md specification.
 */

import { createSignal, createMemo, createEffect } from 'solid-js';
import { createMachine } from '../../statechart';
import { createCheckboxConfig, type CheckboxContext } from '../config';

export interface UseCheckboxOptions {
    checked?: boolean;
    disabled?: boolean;
    indeterminate?: boolean;
    onChange?: (checked: boolean) => void;
}

export interface UseCheckboxReturn {
    checked: () => boolean;
    disabled: () => boolean;
    indeterminate: () => boolean;
    state: () => string;
    toggle: () => void;
    setChecked: (checked: boolean) => void;
    setIndeterminate: (indeterminate: boolean) => void;
    /** Reset to initial state, optionally with context overrides */
    reset: (contextOverrides?: Partial<CheckboxContext>) => void;
    /** Send an event to the state machine (for testing/replay) */
    send: (event: string, payload?: Record<string, unknown>) => { handled: boolean };
    rootProps: () => {
        role: 'checkbox';
        'aria-checked': boolean | 'mixed';
        'aria-disabled': boolean;
        tabIndex: number;
        onClick: () => void;
        onKeyDown: (e: KeyboardEvent) => void;
        onKeyUp: (e: KeyboardEvent) => void;
    };
}

/**
 * useCheckbox - SolidJS hook for a spec-driven checkbox
 */
export function useCheckbox(options: UseCheckboxOptions = {}): UseCheckboxReturn {
    const initialContext: CheckboxContext = {
        checked: options.checked ?? false,
        disabled: options.disabled ?? false,
        indeterminate: options.indeterminate ?? false,
    };

    const machine = createMachine(createCheckboxConfig(initialContext));

    const [version, setVersion] = createSignal(0);
    const bump = () => setVersion((v) => v + 1);

    // Sync disabled prop to machine context (reactive updates)
    createEffect(() => {
        const newDisabled = options.disabled ?? false;
        if (machine.getContext().disabled !== newDisabled) {
            (machine as any).context.disabled = newDisabled;
            bump();
        }
    });

    // Sync checked prop to machine context (for controlled components)
    createEffect(() => {
        const newChecked = options.checked ?? false;
        if (machine.getContext().checked !== newChecked) {
            // Sync context and state directly
            (machine as any).context.checked = newChecked;
            (machine as any).context.indeterminate = false;
            (machine as any).state = newChecked ? 'checked' : 'unchecked';
            bump();
        }
    });

    // Sync indeterminate prop to machine context
    createEffect(() => {
        const newIndeterminate = options.indeterminate ?? false;
        if (machine.getContext().indeterminate !== newIndeterminate) {
            if (newIndeterminate) {
                machine.send('SET_INDETERMINATE');
            }
            bump();
        }
    });

    const getContext = createMemo(() => {
        version();
        return machine.getContext();
    });

    const toggle = () => {
        const result = machine.send('TOGGLE');
        if (result.handled) {
            bump();
            options.onChange?.(machine.getContext().checked);
        }
    };

    const setChecked = (checked: boolean) => {
        const event = checked ? 'SET_CHECKED' : 'SET_UNCHECKED';
        const result = machine.send(event);
        if (result.handled) {
            bump();
            options.onChange?.(machine.getContext().checked);
        }
    };

    const setIndeterminate = (indeterminate: boolean) => {
        if (indeterminate) {
            const result = machine.send('SET_INDETERMINATE');
            if (result.handled) {
                bump();
            }
        }
    };

    const reset = (contextOverrides?: Partial<CheckboxContext>) => {
        const newConfig = createCheckboxConfig({
            ...initialContext,
            ...contextOverrides,
        });
        (machine as any).state = newConfig.initial;
        (machine as any).context = { ...newConfig.context };
        bump();
    };

    const send = (event: string, _payload?: Record<string, unknown>) => {
        const result = machine.send(event);
        if (result.handled) {
            bump();
            // Emit onChange for state-changing events
            if (['TOGGLE', 'SET_CHECKED', 'SET_UNCHECKED'].includes(event)) {
                options.onChange?.(machine.getContext().checked);
            }
        }
        return result;
    };

    const rootProps = () => {
        const ctx = getContext();
        const ariaChecked = ctx.indeterminate ? 'mixed' as const : ctx.checked;

        return {
            role: 'checkbox' as const,
            'aria-checked': ariaChecked,
            'aria-disabled': ctx.disabled,
            tabIndex: ctx.disabled ? -1 : 0,
            onClick: () => !ctx.disabled && toggle(),
            onKeyDown: (e: KeyboardEvent) => {
                if (ctx.disabled) return;
                // Enter key toggles on keydown
                if (e.key === 'Enter') {
                    e.preventDefault();
                    toggle();
                }
            },
            onKeyUp: (e: KeyboardEvent) => {
                if (ctx.disabled) return;
                // Space key toggles on keyup (standard behavior)
                if (e.key === ' ') {
                    e.preventDefault();
                    toggle();
                }
            },
        };
    };

    return {
        checked: () => getContext().checked,
        disabled: () => getContext().disabled,
        indeterminate: () => getContext().indeterminate,
        state: () => machine.getState(),
        toggle,
        setChecked,
        setIndeterminate,
        reset,
        send,
        rootProps,
    };
}
