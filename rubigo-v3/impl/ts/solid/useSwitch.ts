/**
 * Rubigo SolidJS Component Bindings
 *
 * Provides reactive hooks for using statechart-driven components in SolidJS.
 */

import { createSignal, createMemo } from 'solid-js';
import { createMachine } from '../statechart';
import { switchConfig, createSwitchConfig, type SwitchContext } from '../switch/config';

export interface UseSwitchOptions {
    checked?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    onChange?: (checked: boolean) => void;
}

export interface UseSwitchReturn {
    checked: () => boolean;
    disabled: () => boolean;
    readOnly: () => boolean;
    focused: () => boolean;
    state: () => string;
    toggle: () => void;
    setDisabled: (disabled: boolean) => void;
    setReadOnly: (readOnly: boolean) => void;
    rootProps: () => {
        role: 'switch';
        'aria-checked': boolean;
        'aria-disabled': boolean;
        tabIndex: number;
        onClick: () => void;
        onFocus: () => void;
        onBlur: () => void;
        onKeyDown: (e: KeyboardEvent) => void;
    };
}

/**
 * useSwitch - SolidJS hook for a spec-driven toggle switch
 */
export function useSwitch(options: UseSwitchOptions = {}): UseSwitchReturn {
    const machine = createMachine(createSwitchConfig({
        checked: options.checked ?? false,
        disabled: options.disabled ?? false,
        readOnly: options.readOnly ?? false,
    }));

    const [version, setVersion] = createSignal(0);
    const bump = () => setVersion((v) => v + 1);

    const getContext = createMemo(() => {
        version();
        return machine.getContext();
    });

    const checked = () => getContext().checked;
    const disabled = () => getContext().disabled;
    const readOnly = () => getContext().readOnly;
    const focused = () => getContext().focused;
    const state = () => { version(); return machine.getState(); };

    const toggle = () => {
        const prevChecked = machine.getContext().checked;
        const result = machine.send('TOGGLE');
        if (result.handled) {
            const newChecked = machine.getContext().checked;
            if (prevChecked !== newChecked) {
                options.onChange?.(newChecked);
            }
            bump();
        }
    };

    const focus = () => { machine.send('FOCUS'); bump(); };
    const blur = () => { machine.send('BLUR'); bump(); };

    const setDisabled = (value: boolean) => {
        (machine as any).context.disabled = value;
        bump();
    };

    const setReadOnly = (value: boolean) => {
        (machine as any).context.readOnly = value;
        bump();
    };

    const rootProps = createMemo(() => ({
        role: 'switch' as const,
        'aria-checked': checked(),
        'aria-disabled': disabled(),
        tabIndex: disabled() ? -1 : 0,
        onClick: toggle,
        onFocus: focus,
        onBlur: blur,
        onKeyDown: (e: KeyboardEvent) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                toggle();
            }
        },
    }));

    return { checked, disabled, readOnly, focused, state, toggle, setDisabled, setReadOnly, rootProps };
}
