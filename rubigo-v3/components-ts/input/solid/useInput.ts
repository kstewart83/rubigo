/**
 * useInput Hook
 * 
 * SolidJS hook for the Input component state machine.
 */
import { createSignal, createEffect, Accessor, JSX } from 'solid-js';
import { createMachine } from '../../statechart';
import { createInputConfig, type InputContext } from '../config';

export interface UseInputOptions {
    /** Initial or controlled value */
    value?: string;
    /** Whether the input is disabled */
    disabled?: boolean;
    /** Whether the input is read-only */
    readOnly?: boolean;
    /** Placeholder text */
    placeholder?: string;
    /** Input type */
    type?: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';
    /** Required field indicator */
    required?: boolean;
    /** Validation error state */
    invalid?: boolean;
    /** Called when value changes */
    onChange?: (value: string) => void;
    /** Called when input receives focus */
    onFocus?: () => void;
    /** Called when input loses focus */
    onBlur?: () => void;
}

export interface UseInputReturn {
    /** Current value */
    value: Accessor<string>;
    /** Current disabled state */
    disabled: Accessor<boolean>;
    /** Current focused state */
    focused: Accessor<boolean>;
    /** Whether input has error */
    hasError: Accessor<boolean>;
    /** Set the value programmatically */
    setValue: (value: string) => void;
    /** Props to spread on the input element */
    inputProps: Accessor<JSX.InputHTMLAttributes<HTMLInputElement>>;
}

export function useInput(optionsInput: UseInputOptions | (() => UseInputOptions) = {}): UseInputReturn {
    const getOptions = typeof optionsInput === 'function' ? optionsInput : () => optionsInput;
    const options = getOptions();

    // Initialize state machine with overrides from options
    const machine = createMachine(createInputConfig({
        value: options.value ?? '',
        disabled: options.disabled ?? false,
        readOnly: options.readOnly ?? false,
        error: options.invalid ? 'invalid' : '',
    }));

    // Signal to trigger re-reads of machine state
    const [bump, setBump] = createSignal(0);
    const triggerUpdate = () => setBump(b => b + 1);

    // Sync disabled prop to machine context
    createEffect(() => {
        const disabled = getOptions().disabled ?? false;
        if (machine.getContext().disabled !== disabled) {
            (machine as any).context.disabled = disabled;
            triggerUpdate();
        }
    });

    // Sync readOnly prop to machine context
    createEffect(() => {
        const readOnly = getOptions().readOnly ?? false;
        if (machine.getContext().readOnly !== readOnly) {
            (machine as any).context.readOnly = readOnly;
            triggerUpdate();
        }
    });

    // Sync invalid prop to machine context
    createEffect(() => {
        const error = getOptions().invalid ? 'invalid' : '';
        if (machine.getContext().error !== error) {
            (machine as any).context.error = error;
            triggerUpdate();
        }
    });

    // Sync value prop to machine context (controlled mode)
    createEffect(() => {
        const value = getOptions().value;
        if (value !== undefined) {
            const ctx = machine.getContext();
            if (ctx.value !== value) {
                (machine as any).context.value = value;
                triggerUpdate();
            }
        }
    });

    // Set value programmatically
    const setValue = (newValue: string) => {
        const ctx = machine.getContext();
        if (!ctx.disabled && !ctx.readOnly) {
            (machine as any).context.value = newValue;
            getOptions().onChange?.(newValue);
            triggerUpdate();
        }
    };

    // Reactive accessors - props take precedence
    const value = () => {
        bump(); // Subscribe to updates
        return getOptions().value ?? machine.getContext().value;
    };

    const disabled = () => {
        bump();
        return getOptions().disabled ?? machine.getContext().disabled;
    };

    const focused = () => {
        bump();
        return machine.getContext().focused;
    };

    const hasError = () => {
        bump();
        return machine.getContext().error !== '';
    };

    // Input props for the input element
    const inputProps = (): JSX.InputHTMLAttributes<HTMLInputElement> => {
        bump();
        const ctx = machine.getContext();

        return {
            type: options.type ?? 'text',
            value: ctx.value,
            placeholder: options.placeholder,
            disabled: ctx.disabled,
            readonly: ctx.readOnly,
            required: options.required,
            'aria-disabled': ctx.disabled || undefined,
            'aria-readonly': ctx.readOnly || undefined,
            'aria-required': options.required || undefined,
            'aria-invalid': ctx.error !== '' || undefined,
            onInput: (e) => {
                const newValue = e.currentTarget.value;
                (machine as any).context.value = newValue;
                options.onChange?.(newValue);
                triggerUpdate();
            },
            onFocus: () => {
                machine.send('FOCUS');
                options.onFocus?.();
                triggerUpdate();
            },
            onBlur: () => {
                machine.send('BLUR');
                options.onBlur?.();
                triggerUpdate();
            },
        };
    };

    return {
        value,
        disabled,
        focused,
        hasError,
        setValue,
        inputProps,
    };
}
