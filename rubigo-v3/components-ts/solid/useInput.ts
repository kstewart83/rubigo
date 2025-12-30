/**
 * Rubigo SolidJS Input Hook
 *
 * Provides a reactive hook for text inputs using the statechart engine.
 * Supports focus, blur, and value change with validation.
 */

import { createSignal, createMemo } from 'solid-js';
import { Machine, type MachineConfig } from '../statechart/machine';

export interface UseInputOptions {
    value?: string;
    disabled?: boolean;
    readOnly?: boolean;
    error?: string;
    onChange?: (value: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
}

export interface UseInputReturn {
    value: () => string;
    disabled: () => boolean;
    readOnly: () => boolean;
    focused: () => boolean;
    error: () => string;
    state: () => string;
    hasError: () => boolean;
    setValue: (value: string) => void;
    setError: (error: string) => void;
    clearError: () => void;
    setDisabled: (disabled: boolean) => void;
    inputProps: () => {
        type: 'text';
        value: string;
        disabled: boolean;
        readOnly: boolean;
        'aria-invalid': boolean;
        'aria-disabled': boolean;
        'aria-readonly': boolean;
        onFocus: () => void;
        onBlur: () => void;
        onInput: (e: InputEvent) => void;
    };
}

// Input context
interface InputContext {
    value: string;
    disabled: boolean;
    readOnly: boolean;
    focused: boolean;
    error: string;
}

// Create input config
function createInputConfig(initial: Partial<InputContext>): MachineConfig<InputContext> {
    const context: InputContext = {
        value: initial.value ?? '',
        disabled: initial.disabled ?? false,
        readOnly: initial.readOnly ?? false,
        focused: initial.focused ?? false,
        error: initial.error ?? '',
    };

    return {
        id: 'input',
        initial: 'idle',
        context,
        states: {
            idle: {
                on: {
                    FOCUS: { target: 'focused', actions: ['setFocused'], guard: 'canFocus' },
                },
            },
            focused: {
                on: {
                    BLUR: { target: 'idle', actions: ['clearFocused'] },
                    CHANGE: { target: 'focused', actions: [], guard: 'canEdit' },
                },
            },
        },
        actions: {
            setFocused: (ctx: InputContext) => { ctx.focused = true; },
            clearFocused: (ctx: InputContext) => { ctx.focused = false; },
        },
        guards: {
            canFocus: (ctx: InputContext) => !ctx.disabled,
            canEdit: (ctx: InputContext) => ctx.focused && !ctx.disabled && !ctx.readOnly,
        },
    };
}

/**
 * useInput - SolidJS hook for a spec-driven text input
 */
export function useInput(options: UseInputOptions = {}): UseInputReturn {
    const config = createInputConfig({
        value: options.value ?? '',
        disabled: options.disabled ?? false,
        readOnly: options.readOnly ?? false,
        focused: false,
        error: options.error ?? '',
    });
    const machine = new Machine<InputContext>(config);

    const [version, setVersion] = createSignal(0);
    const bump = () => setVersion((v) => v + 1);

    const getContext = createMemo(() => {
        version();
        return machine.getContext();
    });

    const value = () => getContext().value;
    const disabled = () => getContext().disabled;
    const readOnly = () => getContext().readOnly;
    const focused = () => getContext().focused;
    const error = () => getContext().error;
    const state = () => { version(); return machine.getState(); };
    const hasError = () => error() !== '';

    const setValue = (newValue: string) => {
        const ctx = machine.getContext();
        if (ctx.focused && !ctx.disabled && !ctx.readOnly) {
            (machine as any).context.value = newValue;
            machine.send('CHANGE');
            options.onChange?.(newValue);
            bump();
        }
    };

    const setError = (err: string) => {
        (machine as any).context.error = err;
        bump();
    };

    const clearError = () => {
        (machine as any).context.error = '';
        bump();
    };

    const setDisabled = (val: boolean) => {
        (machine as any).context.disabled = val;
        bump();
    };

    const inputProps = createMemo(() => ({
        type: 'text' as const,
        value: value(),
        disabled: disabled(),
        readOnly: readOnly(),
        'aria-invalid': hasError(),
        'aria-disabled': disabled(),
        'aria-readonly': readOnly(),
        onFocus: () => {
            machine.send('FOCUS');
            options.onFocus?.();
            bump();
        },
        onBlur: () => {
            machine.send('BLUR');
            options.onBlur?.();
            bump();
        },
        onInput: (e: InputEvent) => {
            const target = e.target as HTMLInputElement;
            setValue(target.value);
        },
    }));

    return {
        value, disabled, readOnly, focused, error, state, hasError,
        setValue, setError, clearError, setDisabled, inputProps
    };
}
