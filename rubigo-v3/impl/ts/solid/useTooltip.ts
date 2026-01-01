/**
 * Rubigo SolidJS Tooltip Hook
 *
 * Provides a reactive hook for tooltips using the statechart engine.
 * Supports open/close delays and mouse/focus triggers.
 */

import { createSignal, createMemo, onCleanup } from 'solid-js';
import { Machine, type MachineConfig } from '../statechart/machine';

export interface UseTooltipOptions {
    disabled?: boolean;
    openDelay?: number;    // Default 700ms
    closeDelay?: number;   // Default 300ms
    onOpenChange?: (open: boolean) => void;
}

export interface UseTooltipReturn {
    open: () => boolean;
    disabled: () => boolean;
    state: () => string;
    setDisabled: (disabled: boolean) => void;
    triggerProps: () => {
        'aria-describedby': string | undefined;
        onMouseEnter: () => void;
        onMouseLeave: () => void;
        onFocus: () => void;
        onBlur: () => void;
    };
    contentProps: () => {
        role: 'tooltip';
        id: string;
        hidden: boolean;
        onMouseEnter: () => void;
        onMouseLeave: () => void;
    };
}

// Tooltip context
interface TooltipContext {
    open: boolean;
    disabled: boolean;
}

// Create tooltip config
function createTooltipConfig(initial: Partial<TooltipContext>): MachineConfig<TooltipContext> {
    const context: TooltipContext = {
        open: initial.open ?? false,
        disabled: initial.disabled ?? false,
    };

    return {
        id: 'tooltip',
        initial: 'closed',
        context,
        states: {
            closed: {
                on: {
                    POINTER_ENTER: { target: 'opening', actions: [], guard: 'canInteract' },
                    FOCUS: { target: 'open', actions: ['setOpen'], guard: 'canInteract' },
                },
            },
            opening: {
                on: {
                    OPEN: { target: 'open', actions: ['setOpen'] },
                    POINTER_LEAVE: { target: 'closed', actions: [] },
                    ESCAPE: { target: 'closed', actions: [] },
                },
            },
            open: {
                on: {
                    POINTER_LEAVE: { target: 'closing', actions: [] },
                    BLUR: { target: 'closing', actions: [] },
                    ESCAPE: { target: 'closed', actions: ['setClosed'] },
                },
            },
            closing: {
                on: {
                    CLOSE: { target: 'closed', actions: ['setClosed'] },
                    POINTER_ENTER: { target: 'open', actions: [] },
                },
            },
        },
        actions: {
            setOpen: (ctx: TooltipContext) => {
                ctx.open = true;
            },
            setClosed: (ctx: TooltipContext) => {
                ctx.open = false;
            },
        },
        guards: {
            canInteract: (ctx: TooltipContext) => !ctx.disabled,
        },
    };
}

let tooltipIdCounter = 0;

/**
 * useTooltip - SolidJS hook for a spec-driven tooltip
 */
export function useTooltip(options: UseTooltipOptions = {}): UseTooltipReturn {
    const tooltipId = `tooltip-${++tooltipIdCounter}`;
    const openDelay = options.openDelay ?? 700;
    const closeDelay = options.closeDelay ?? 300;

    const config = createTooltipConfig({
        open: false,
        disabled: options.disabled ?? false,
    });
    const machine = new Machine<TooltipContext>(config);

    const [version, setVersion] = createSignal(0);
    const bump = () => setVersion((v) => v + 1);

    let openTimer: ReturnType<typeof setTimeout> | null = null;
    let closeTimer: ReturnType<typeof setTimeout> | null = null;

    const clearTimers = () => {
        if (openTimer) { clearTimeout(openTimer); openTimer = null; }
        if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
    };

    onCleanup(clearTimers);

    const getContext = createMemo(() => {
        version();
        return machine.getContext();
    });

    const open = () => getContext().open;
    const disabled = () => getContext().disabled;
    const state = () => { version(); return machine.getState(); };

    const handlePointerEnter = () => {
        clearTimers();
        const result = machine.send('POINTER_ENTER');
        if (result.handled && machine.getState() === 'opening') {
            openTimer = setTimeout(() => {
                const prevOpen = machine.getContext().open;
                machine.send('OPEN');
                if (!prevOpen && machine.getContext().open) {
                    options.onOpenChange?.(true);
                }
                bump();
            }, openDelay);
        }
        bump();
    };

    const handlePointerLeave = () => {
        clearTimers();
        const currentState = machine.getState();
        if (currentState === 'opening') {
            machine.send('POINTER_LEAVE');
            bump();
        } else if (currentState === 'open') {
            machine.send('POINTER_LEAVE');
            if (machine.getState() === 'closing') {
                closeTimer = setTimeout(() => {
                    const prevOpen = machine.getContext().open;
                    machine.send('CLOSE');
                    if (prevOpen && !machine.getContext().open) {
                        options.onOpenChange?.(false);
                    }
                    bump();
                }, closeDelay);
            }
            bump();
        }
    };

    const handleFocus = () => {
        clearTimers();
        const prevOpen = machine.getContext().open;
        machine.send('FOCUS');
        if (!prevOpen && machine.getContext().open) {
            options.onOpenChange?.(true);
        }
        bump();
    };

    const handleBlur = () => {
        clearTimers();
        machine.send('BLUR');
        if (machine.getState() === 'closing') {
            closeTimer = setTimeout(() => {
                const prevOpen = machine.getContext().open;
                machine.send('CLOSE');
                if (prevOpen && !machine.getContext().open) {
                    options.onOpenChange?.(false);
                }
                bump();
            }, closeDelay);
        }
        bump();
    };

    const setDisabled = (value: boolean) => {
        (machine as any).context.disabled = value;
        bump();
    };

    const triggerProps = createMemo(() => ({
        'aria-describedby': open() ? tooltipId : undefined,
        onMouseEnter: handlePointerEnter,
        onMouseLeave: handlePointerLeave,
        onFocus: handleFocus,
        onBlur: handleBlur,
    }));

    const contentProps = createMemo(() => ({
        role: 'tooltip' as const,
        id: tooltipId,
        hidden: !open(),
        onMouseEnter: handlePointerEnter,
        onMouseLeave: handlePointerLeave,
    }));

    return { open, disabled, state, setDisabled, triggerProps, contentProps };
}

function clearTimeout(timer: ReturnType<typeof setTimeout>) {
    globalThis.clearTimeout(timer);
}
