/**
 * useButton - SolidJS hook for a spec-driven button
 *
 * Based on the button.sudo.md specification.
 */

import { createSignal, createMemo, createEffect } from 'solid-js';
import { createMachine } from '../../statechart';
import { createButtonConfig, type ButtonContext } from '../config';

export interface UseButtonOptions {
    disabled?: boolean;
    loading?: boolean;
    onClick?: () => void;
}

export interface UseButtonReturn {
    disabled: () => boolean;
    loading: () => boolean;
    pressed: () => boolean;
    state: () => string;
    click: () => void;
    startLoading: () => void;
    stopLoading: () => void;
    setDisabled: (disabled: boolean) => void;
    /** Reset to initial state, optionally with context overrides */
    reset: (contextOverrides?: Partial<{ disabled: boolean; loading: boolean; pressed: boolean }>) => void;
    /** Send an event to the state machine (for testing/replay) */
    send: (event: string, payload?: Record<string, unknown>) => { handled: boolean };
    rootProps: () => {
        role: 'button';
        'aria-disabled': boolean;
        'aria-busy': boolean;
        tabIndex: number;
        onMouseDown: () => void;
        onMouseUp: () => void;
        onMouseLeave: () => void;
        onKeyDown: (e: KeyboardEvent) => void;
        onKeyUp: (e: KeyboardEvent) => void;
    };
}

/**
 * useButton - SolidJS hook for a spec-driven button
 */
export function useButton(options: UseButtonOptions = {}): UseButtonReturn {
    const machine = createMachine(createButtonConfig({
        disabled: options.disabled ?? false,
        loading: options.loading ?? false,
        pressed: false,
    }));

    const [version, setVersion] = createSignal(0);
    const bump = () => setVersion((v) => v + 1);

    // Sync prop changes to machine context (reactive updates)
    createEffect(() => {
        const newDisabled = options.disabled ?? false;
        if (machine.getContext().disabled !== newDisabled) {
            (machine as any).context.disabled = newDisabled;
            bump();
        }
    });

    createEffect(() => {
        const newLoading = options.loading ?? false;
        if (machine.getContext().loading !== newLoading) {
            if (newLoading) {
                machine.send('START_LOADING');
            } else {
                machine.send('STOP_LOADING');
            }
            bump();
        }
    });

    const getContext = createMemo(() => {
        version();
        return machine.getContext();
    });

    const disabled = () => getContext().disabled;
    const loading = () => getContext().loading;
    const pressed = () => getContext().pressed;
    const state = () => { version(); return machine.getState(); };

    const click = () => {
        const result = machine.send('CLICK');
        if (result.handled) {
            options.onClick?.();
            bump();
        }
    };

    const pressDown = () => {
        machine.send('PRESS_DOWN');
        bump();
    };

    const pressUp = () => {
        const result = machine.send('PRESS_UP');
        if (result.handled) {
            options.onClick?.();
        }
        bump();
    };

    const pressCancel = () => {
        machine.send('PRESS_CANCEL');
        bump();
    };

    const startLoading = () => {
        machine.send('START_LOADING');
        bump();
    };

    const stopLoading = () => {
        machine.send('STOP_LOADING');
        bump();
    };

    const setDisabled = (value: boolean) => {
        (machine as any).context.disabled = value;
        bump();
    };

    /** Reset to initial state with optional context overrides */
    const reset = (contextOverrides?: Partial<ButtonContext>) => {
        machine.reset(contextOverrides);
        bump();
    };

    /** Send an event to the machine (for testing/replay) */
    const send = (event: string, payload?: Record<string, unknown>) => {
        const result = machine.send({ name: event, payload });
        bump();
        return { handled: result.handled };
    };

    const rootProps = createMemo(() => ({
        role: 'button' as const,
        'aria-disabled': disabled(),
        'aria-busy': loading(),
        tabIndex: disabled() ? -1 : 0,
        // Note: onClick is not set here - pressUp handles invoking the callback
        // to match spec behavior (activate on mouse release, not on click event)
        onMouseDown: pressDown,
        onMouseUp: pressUp,
        onMouseLeave: pressCancel,
        onKeyDown: (e: KeyboardEvent) => {
            if (e.key === ' ') {
                e.preventDefault();
                pressDown();
            } else if (e.key === 'Enter') {
                click();
            }
        },
        onKeyUp: (e: KeyboardEvent) => {
            if (e.key === ' ') {
                e.preventDefault();
                pressUp();
            }
        },
    }));

    return { disabled, loading, pressed, state, click, startLoading, stopLoading, setDisabled, reset, send, rootProps };
}
