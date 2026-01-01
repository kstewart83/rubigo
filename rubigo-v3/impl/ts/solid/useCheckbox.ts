/**
 * useCheckbox - SolidJS hook for a spec-driven checkbox
 *
 * Based on the checkbox.sudo.md specification.
 */

import { createSignal, createMemo } from 'solid-js';
import { createMachine } from '../statechart';
import { createCheckboxConfig, type CheckboxContext } from '../checkbox/config';

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
    setDisabled: (disabled: boolean) => void;
    setIndeterminate: (indeterminate: boolean) => void;
    rootProps: () => {
        role: 'checkbox';
        'aria-checked': boolean | 'mixed';
        'aria-disabled': boolean;
        tabIndex: number;
        onClick: () => void;
        onKeyDown: (e: KeyboardEvent) => void;
    };
}

/**
 * useCheckbox - SolidJS hook for a spec-driven checkbox
 */
export function useCheckbox(options: UseCheckboxOptions = {}): UseCheckboxReturn {
    const machine = createMachine(createCheckboxConfig({
        checked: options.checked ?? false,
        disabled: options.disabled ?? false,
        indeterminate: options.indeterminate ?? false,
    }));

    const [version, setVersion] = createSignal(0);
    const bump = () => setVersion((v) => v + 1);

    const getContext = createMemo(() => {
        version();
        return machine.getContext();
    });

    const checked = () => getContext().checked;
    const disabled = () => getContext().disabled;
    const indeterminate = () => getContext().indeterminate;
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

    const setChecked = (value: boolean) => {
        if (value) {
            machine.send('SET_CHECKED');
        } else {
            machine.send('SET_UNCHECKED');
        }
        bump();
    };

    const setDisabled = (value: boolean) => {
        (machine as any).context.disabled = value;
        bump();
    };

    const setIndeterminate = (value: boolean) => {
        if (value) {
            machine.send('SET_INDETERMINATE');
        } else {
            // Clear indeterminate by setting to unchecked
            machine.send('SET_UNCHECKED');
        }
        bump();
    };

    const rootProps = createMemo(() => ({
        role: 'checkbox' as const,
        'aria-checked': indeterminate() ? ('mixed' as const) : checked(),
        'aria-disabled': disabled(),
        tabIndex: disabled() ? -1 : 0,
        onClick: toggle,
        onKeyDown: (e: KeyboardEvent) => {
            if (e.key === ' ') {
                e.preventDefault();
                toggle();
            }
        },
    }));

    return { checked, disabled, indeterminate, state, toggle, setChecked, setDisabled, setIndeterminate, rootProps };
}
