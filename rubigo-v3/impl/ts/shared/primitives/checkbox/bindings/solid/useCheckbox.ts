/**
 * useCheckbox - SolidJS hook for a spec-driven checkbox
 *
 * Based on the checkbox.sudo.md specification.
 */

import { createSignal, createMemo, createEffect } from 'solid-js';
import { createMachine } from '../../../../../statechart';
import { createCheckboxConfig, type CheckboxContext } from '../../config';

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
    setChecked: (checked?: boolean) => void;
    setUnchecked: () => void;
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
 *
 * @param optionsInput - Options object or getter function for reactive props
 */
export function useCheckbox(optionsInput: UseCheckboxOptions | (() => UseCheckboxOptions) = {}): UseCheckboxReturn {
    // Resolve options - support both plain object and getter function
    const getOptions = typeof optionsInput === 'function' ? optionsInput : () => optionsInput;
    const options = getOptions();

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
        const newDisabled = getOptions().disabled ?? false;
        if (machine.getContext().disabled !== newDisabled) {
            (machine as any).context.disabled = newDisabled;
            bump();
        }
    });

    // Sync checked prop to machine context (for controlled components)
    createEffect(() => {
        const newChecked = getOptions().checked ?? false;
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
        const newIndeterminate = getOptions().indeterminate ?? false;
        if (machine.getContext().indeterminate !== newIndeterminate) {
            if (newIndeterminate) {
                machine.send('SET_INDETERMINATE');
            } else {
                // Clear indeterminate - revert to checked/unchecked based on current state
                (machine as any).context.indeterminate = false;
                const isChecked = machine.getContext().checked;
                (machine as any).state = isChecked ? 'checked' : 'unchecked';
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
            getOptions().onChange?.(machine.getContext().checked);
        }
    };

    const setChecked = (checked?: boolean) => {
        const targetChecked = checked ?? true;  // Default to true for testability
        const event = targetChecked ? 'SET_CHECKED' : 'SET_UNCHECKED';
        const result = machine.send(event);
        if (result.handled) {
            bump();
            getOptions().onChange?.(machine.getContext().checked);
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
                getOptions().onChange?.(machine.getContext().checked);
            }
        }
        return result;
    };

    const rootProps = () => {
        version(); // Ensure fresh data in non-reactive contexts
        const ctx = machine.getContext();
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
        checked: () => { version(); return getOptions().checked ?? machine.getContext().checked; },
        disabled: () => { version(); return getOptions().disabled ?? machine.getContext().disabled; },
        indeterminate: () => { version(); return getOptions().indeterminate ?? machine.getContext().indeterminate; },
        state: () => { version(); return machine.getState(); },
        toggle,
        setChecked,
        setUnchecked: () => setChecked(false),
        setIndeterminate,
        reset,
        send,
        rootProps,
    };
}
