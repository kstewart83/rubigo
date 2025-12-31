/**
 * useSwitch Hook
 * 
 * SolidJS hook for the Switch component state machine.
 */
import { createSignal, createEffect, Accessor, JSX } from 'solid-js';
import { createMachine } from '../../statechart';
import { createSwitchConfig, type SwitchContext } from '../config';

export interface UseSwitchOptions {
    /** Initial or controlled checked state */
    checked?: boolean;
    /** Whether the switch is disabled */
    disabled?: boolean;
    /** Whether the switch is read-only */
    readOnly?: boolean;
    /** Called when checked state changes */
    onChange?: (checked: boolean) => void;
}

export interface UseSwitchReturn {
    /** Current checked state */
    checked: Accessor<boolean>;
    /** Current disabled state */
    disabled: Accessor<boolean>;
    /** Current focused state */
    focused: Accessor<boolean>;
    /** Toggle the switch */
    toggle: () => void;
    /** Props to spread on the root element */
    rootProps: Accessor<JSX.HTMLAttributes<HTMLButtonElement>>;
}

export function useSwitch(optionsInput: UseSwitchOptions | (() => UseSwitchOptions) = {}): UseSwitchReturn {
    // Resolve options - support both plain object and getter function
    const getOptions = typeof optionsInput === 'function' ? optionsInput : () => optionsInput;
    const options = getOptions();

    // Initialize state machine with overrides from options
    const machine = createMachine(createSwitchConfig({
        checked: options.checked ?? false,
        disabled: options.disabled ?? false,
        readOnly: options.readOnly ?? false,
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

    // Sync checked prop to machine context (controlled mode)
    createEffect(() => {
        const checked = getOptions().checked;
        if (checked !== undefined) {
            const ctx = machine.getContext();
            if (ctx.checked !== checked) {
                (machine as any).context.checked = checked;
                triggerUpdate();
            }
        }
    });

    // Toggle the switch
    const toggle = () => {
        const prevChecked = machine.getContext().checked;
        const result = machine.send('TOGGLE');

        if (result.handled) {
            const newChecked = machine.getContext().checked;
            if (prevChecked !== newChecked) {
                getOptions().onChange?.(newChecked);
            }
            triggerUpdate();
        }
    };

    // Reactive accessors - props take precedence for immediate reactivity
    const checked = () => {
        bump(); // Subscribe to updates
        return getOptions().checked ?? machine.getContext().checked;
    };

    const disabled = () => {
        bump();
        return getOptions().disabled ?? machine.getContext().disabled;
    };

    const focused = () => {
        bump();
        return machine.getContext().focused;
    };

    // Root props for the button element
    const rootProps = (): JSX.HTMLAttributes<HTMLButtonElement> => {
        bump();
        const ctx = machine.getContext();

        return {
            role: 'switch',
            'aria-checked': ctx.checked,
            'aria-disabled': ctx.disabled || undefined,
            'aria-readonly': ctx.readOnly || undefined,
            tabIndex: ctx.disabled ? -1 : 0,
            onClick: (e) => {
                e.preventDefault();
                toggle();
            },
            onKeyDown: (e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    toggle();
                }
            },
            onFocus: () => {
                machine.send('FOCUS');
                triggerUpdate();
            },
            onBlur: () => {
                machine.send('BLUR');
                triggerUpdate();
            },
        };
    };

    return {
        checked,
        disabled,
        focused,
        toggle,
        rootProps,
    };
}
