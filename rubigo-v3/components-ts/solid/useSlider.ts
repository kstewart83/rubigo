/**
 * Rubigo SolidJS Slider Hook
 *
 * Provides a reactive hook for sliders using the statechart engine.
 * Supports drag interaction and keyboard control.
 */

import { createSignal, createMemo } from 'solid-js';
import { Machine, type MachineConfig } from '../statechart/machine';

export interface UseSliderOptions {
    value?: number;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    onChange?: (value: number) => void;
}

export interface UseSliderReturn {
    value: () => number;
    min: () => number;
    max: () => number;
    disabled: () => boolean;
    dragging: () => boolean;
    focused: () => boolean;
    state: () => string;
    percentage: () => number;
    increment: () => void;
    decrement: () => void;
    setValue: (value: number) => void;
    setDisabled: (disabled: boolean) => void;
    trackProps: () => {
        role: 'slider';
        'aria-valuemin': number;
        'aria-valuemax': number;
        'aria-valuenow': number;
        'aria-disabled': boolean;
        tabIndex: number;
        onFocus: () => void;
        onBlur: () => void;
        onKeyDown: (e: KeyboardEvent) => void;
        onMouseDown: (e: MouseEvent) => void;
    };
    thumbProps: () => {
        'data-dragging': boolean;
        style: { left: string };
    };
}

// Slider context
interface SliderContext {
    value: number;
    min: number;
    max: number;
    stepSize: number;
    disabled: boolean;
    dragging: boolean;
    focused: boolean;
}

// Create slider config
function createSliderConfig(initial: Partial<SliderContext>): MachineConfig<SliderContext> {
    const context: SliderContext = {
        value: initial.value ?? 50,
        min: initial.min ?? 0,
        max: initial.max ?? 100,
        stepSize: initial.stepSize ?? 1,
        disabled: initial.disabled ?? false,
        dragging: initial.dragging ?? false,
        focused: initial.focused ?? false,
    };

    return {
        id: 'slider',
        initial: 'idle',
        context,
        states: {
            idle: {
                on: {
                    FOCUS: { target: 'focused', actions: ['setFocused'], guard: 'canInteract' },
                    DRAG_START: { target: 'dragging', actions: ['setDragging'], guard: 'canInteract' },
                },
            },
            focused: {
                on: {
                    BLUR: { target: 'idle', actions: ['clearFocused'] },
                    INCREMENT: { target: 'focused', actions: [] },
                    DECREMENT: { target: 'focused', actions: [] },
                    DRAG_START: { target: 'dragging', actions: ['setDragging'] },
                },
            },
            dragging: {
                on: {
                    DRAG_END: { target: 'idle', actions: ['clearDragging'] },
                },
            },
        },
        actions: {
            setFocused: (ctx: SliderContext) => { ctx.focused = true; },
            clearFocused: (ctx: SliderContext) => { ctx.focused = false; },
            setDragging: (ctx: SliderContext) => { ctx.dragging = true; },
            clearDragging: (ctx: SliderContext) => { ctx.dragging = false; },
        },
        guards: {
            canInteract: (ctx: SliderContext) => !ctx.disabled,
        },
    };
}

/**
 * useSlider - SolidJS hook for a spec-driven slider
 */
export function useSlider(options: UseSliderOptions = {}): UseSliderReturn {
    const minVal = options.min ?? 0;
    const maxVal = options.max ?? 100;
    const stepVal = options.step ?? 1;

    const config = createSliderConfig({
        value: options.value ?? 50,
        min: minVal,
        max: maxVal,
        stepSize: stepVal,
        disabled: options.disabled ?? false,
        dragging: false,
        focused: false,
    });
    const machine = new Machine<SliderContext>(config);

    const [version, setVersion] = createSignal(0);
    const bump = () => setVersion((v) => v + 1);

    const getContext = createMemo(() => {
        version();
        return machine.getContext();
    });

    const value = () => getContext().value;
    const min = () => getContext().min;
    const max = () => getContext().max;
    const disabled = () => getContext().disabled;
    const dragging = () => getContext().dragging;
    const focused = () => getContext().focused;
    const state = () => { version(); return machine.getState(); };
    const percentage = () => ((value() - min()) / (max() - min())) * 100;

    const increment = () => {
        const ctx = machine.getContext();
        const newValue = Math.min(ctx.max, ctx.value + ctx.stepSize);
        if (newValue !== ctx.value) {
            (machine as any).context.value = newValue;
            machine.send('INCREMENT');
            options.onChange?.(newValue);
            bump();
        }
    };

    const decrement = () => {
        const ctx = machine.getContext();
        const newValue = Math.max(ctx.min, ctx.value - ctx.stepSize);
        if (newValue !== ctx.value) {
            (machine as any).context.value = newValue;
            machine.send('DECREMENT');
            options.onChange?.(newValue);
            bump();
        }
    };

    const setValue = (newValue: number) => {
        const ctx = machine.getContext();
        const clamped = Math.max(ctx.min, Math.min(ctx.max, newValue));
        if (clamped !== ctx.value) {
            (machine as any).context.value = clamped;
            options.onChange?.(clamped);
            bump();
        }
    };

    const setDisabled = (val: boolean) => {
        (machine as any).context.disabled = val;
        bump();
    };

    const trackProps = createMemo(() => ({
        role: 'slider' as const,
        'aria-valuemin': min(),
        'aria-valuemax': max(),
        'aria-valuenow': value(),
        'aria-disabled': disabled(),
        tabIndex: disabled() ? -1 : 0,
        onFocus: () => { machine.send('FOCUS'); bump(); },
        onBlur: () => { machine.send('BLUR'); bump(); },
        onKeyDown: (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                e.preventDefault();
                increment();
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                e.preventDefault();
                decrement();
            } else if (e.key === 'Home') {
                e.preventDefault();
                setValue(min());
            } else if (e.key === 'End') {
                e.preventDefault();
                setValue(max());
            }
        },
        onMouseDown: (e: MouseEvent) => {
            if (disabled()) return;
            machine.send('DRAG_START');
            bump();
            // Add document listeners for drag
            const onMove = (move: MouseEvent) => {
                const rect = (e.target as HTMLElement).getBoundingClientRect();
                const pct = Math.max(0, Math.min(1, (move.clientX - rect.left) / rect.width));
                setValue(min() + pct * (max() - min()));
            };
            const onUp = () => {
                machine.send('DRAG_END');
                bump();
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        },
    }));

    const thumbProps = createMemo(() => ({
        'data-dragging': dragging(),
        style: { left: `${percentage()}%` },
    }));

    return {
        value, min, max, disabled, dragging, focused, state, percentage,
        increment, decrement, setValue, setDisabled, trackProps, thumbProps
    };
}
