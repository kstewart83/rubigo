/**
 * useSlider Hook
 */
import { createSignal, createEffect, Accessor } from 'solid-js';
import { createMachine } from '../../statechart';
import { createSliderConfig, type SliderContext } from '../config';

export interface UseSliderOptions {
    value?: number;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    onValueChange?: (value: number) => void;
    onValueCommit?: (value: number) => void;
}

export interface UseSliderReturn {
    value: Accessor<number>;
    min: Accessor<number>;
    max: Accessor<number>;
    disabled: Accessor<boolean>;
    dragging: Accessor<boolean>;
    percentage: Accessor<number>;
    setValue: (value: number) => void;
    increment: () => void;
    decrement: () => void;
    setMin: () => void;
    setMax: () => void;
    rootProps: () => {
        'aria-disabled': boolean | undefined;
        'aria-valuemin': number;
        'aria-valuemax': number;
        'aria-valuenow': number;
        onKeyDown: (e: KeyboardEvent) => void;
    };
    trackProps: () => {
        onMouseDown: (e: MouseEvent) => void;
    };
    thumbProps: () => {
        role: 'slider';
        tabIndex: number;
        'aria-valuenow': number;
        'aria-valuemin': number;
        'aria-valuemax': number;
        'aria-disabled': boolean | undefined;
        onKeyDown: (e: KeyboardEvent) => void;
        onMouseDown: (e: MouseEvent) => void;
    };
}

export function useSlider(optionsInput: UseSliderOptions | (() => UseSliderOptions) = {}): UseSliderReturn {
    const getOptions = typeof optionsInput === 'function' ? optionsInput : () => optionsInput;
    const options = getOptions();

    const min = options.min ?? 0;
    const max = options.max ?? 100;
    const step = options.step ?? 1;

    const machine = createMachine(createSliderConfig({
        value: options.value ?? min,
        min,
        max,
        step,
        disabled: options.disabled ?? false,
        dragging: false,
    }));

    const [bump, setBump] = createSignal(0);
    const triggerUpdate = () => setBump(b => b + 1);

    // Sync controlled props
    createEffect(() => {
        const value = getOptions().value;
        if (value !== undefined) {
            const ctx = machine.getContext();
            if (ctx.value !== value) {
                (machine as any).context.value = clamp(value, ctx.min, ctx.max);
                triggerUpdate();
            }
        }
    });

    createEffect(() => {
        const disabled = getOptions().disabled ?? false;
        if (machine.getContext().disabled !== disabled) {
            (machine as any).context.disabled = disabled;
            triggerUpdate();
        }
    });

    const clamp = (val: number, minVal: number, maxVal: number) =>
        Math.min(Math.max(val, minVal), maxVal);

    const value = () => {
        bump();
        return getOptions().value ?? machine.getContext().value;
    };

    const minVal = () => {
        bump();
        return machine.getContext().min;
    };

    const maxVal = () => {
        bump();
        return machine.getContext().max;
    };

    const disabled = () => {
        bump();
        return getOptions().disabled ?? machine.getContext().disabled;
    };

    const dragging = () => {
        bump();
        return machine.getContext().dragging;
    };

    const percentage = () => {
        bump(); // Track reactivity
        const ctx = machine.getContext();
        return ((ctx.value - ctx.min) / (ctx.max - ctx.min)) * 100;
    };

    const setValue = (newValue: number) => {
        const ctx = machine.getContext();
        if (ctx.disabled) return;
        const clamped = clamp(newValue, ctx.min, ctx.max);
        if (ctx.value !== clamped) {
            (machine as any).context.value = clamped;
            options.onValueChange?.(clamped);
            triggerUpdate();
        }
    };

    const increment = () => {
        const ctx = machine.getContext();
        setValue(ctx.value + ctx.step);
    };

    const decrement = () => {
        const ctx = machine.getContext();
        setValue(ctx.value - ctx.step);
    };

    const setMin = () => {
        setValue(machine.getContext().min);
    };

    const setMax = () => {
        setValue(machine.getContext().max);
    };

    // Handle track click to set value
    const handleTrackClick = (e: MouseEvent) => {
        const ctx = machine.getContext();
        if (ctx.disabled) return;

        const track = e.currentTarget as HTMLElement;
        const rect = track.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const newValue = ctx.min + percent * (ctx.max - ctx.min);
        const stepped = Math.round(newValue / ctx.step) * ctx.step;
        setValue(stepped);
        options.onValueCommit?.(stepped);
    };

    // Handle drag
    const handleThumbMouseDown = (e: MouseEvent) => {
        const ctx = machine.getContext();
        if (ctx.disabled) return;

        e.preventDefault();
        (machine as any).context.dragging = true;
        triggerUpdate();

        const track = (e.currentTarget as HTMLElement).parentElement!;

        const handleMouseMove = (moveE: MouseEvent) => {
            const rect = track.getBoundingClientRect();
            const percent = clamp((moveE.clientX - rect.left) / rect.width, 0, 1);
            const ctx = machine.getContext();
            const newValue = ctx.min + percent * (ctx.max - ctx.min);
            const stepped = Math.round(newValue / ctx.step) * ctx.step;
            setValue(stepped);
        };

        const handleMouseUp = () => {
            (machine as any).context.dragging = false;
            options.onValueCommit?.(machine.getContext().value);
            triggerUpdate();
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        const ctx = machine.getContext();
        if (ctx.disabled) return;

        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowUp':
                e.preventDefault();
                increment();
                break;
            case 'ArrowLeft':
            case 'ArrowDown':
                e.preventDefault();
                decrement();
                break;
            case 'PageUp':
                e.preventDefault();
                setValue(ctx.value + ctx.step * 10);
                break;
            case 'PageDown':
                e.preventDefault();
                setValue(ctx.value - ctx.step * 10);
                break;
            case 'Home':
                e.preventDefault();
                setMin();
                break;
            case 'End':
                e.preventDefault();
                setMax();
                break;
        }
    };

    const trackProps = () => ({
        onMouseDown: handleTrackClick,
    });

    const thumbProps = () => {
        const ctx = machine.getContext();
        return {
            role: 'slider' as const,
            tabIndex: ctx.disabled ? -1 : 0,
            'aria-valuenow': ctx.value,
            'aria-valuemin': ctx.min,
            'aria-valuemax': ctx.max,
            'aria-disabled': ctx.disabled || undefined,
            onKeyDown: handleKeyDown,
            onMouseDown: handleThumbMouseDown,
        };
    };

    const rootProps = () => {
        const ctx = machine.getContext();
        return {
            'aria-disabled': ctx.disabled || undefined,
            'aria-valuemin': ctx.min,
            'aria-valuemax': ctx.max,
            'aria-valuenow': ctx.value,
            onKeyDown: handleKeyDown,
        };
    };

    return {
        value,
        min: minVal,
        max: maxVal,
        disabled,
        dragging,
        percentage,
        setValue,
        increment,
        decrement,
        setMin,
        setMax,
        rootProps,
        trackProps,
        thumbProps,
    };
}
