/**
 * Rubigo SolidJS Collapsible Hook
 *
 * Provides a reactive hook for collapsible panels using the statechart engine.
 */

import { createSignal, createMemo } from 'solid-js';
import { Machine, type MachineConfig } from '../statechart/machine';

export interface UseCollapsibleOptions {
    open?: boolean;
    disabled?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export interface UseCollapsibleReturn {
    open: () => boolean;
    disabled: () => boolean;
    state: () => string;
    toggle: () => void;
    expand: () => void;
    collapse: () => void;
    setDisabled: (disabled: boolean) => void;
    triggerProps: () => {
        role: 'button';
        'aria-expanded': boolean;
        'aria-disabled': boolean;
        tabIndex: number;
        onClick: () => void;
        onKeyDown: (e: KeyboardEvent) => void;
    };
    contentProps: () => {
        role: 'region';
        'aria-hidden': boolean;
        hidden: boolean;
    };
}

// Collapsible context
interface CollapsibleContext {
    open: boolean;
    disabled: boolean;
}

// Create collapsible config
function createCollapsibleConfig(initial: Partial<CollapsibleContext>): MachineConfig<CollapsibleContext> {
    const context: CollapsibleContext = {
        open: initial.open ?? false,
        disabled: initial.disabled ?? false,
    };

    return {
        id: 'collapsible',
        initial: context.open ? 'expanded' : 'collapsed',
        context,
        states: {
            collapsed: {
                on: {
                    TOGGLE: { target: 'expanded', actions: ['expand'], guard: 'canInteract' },
                    EXPAND: { target: 'expanded', actions: ['expand'], guard: 'canInteract' },
                },
            },
            expanded: {
                on: {
                    TOGGLE: { target: 'collapsed', actions: ['collapse'], guard: 'canInteract' },
                    COLLAPSE: { target: 'collapsed', actions: ['collapse'], guard: 'canInteract' },
                },
            },
        },
        actions: {
            expand: (ctx: CollapsibleContext) => {
                ctx.open = true;
            },
            collapse: (ctx: CollapsibleContext) => {
                ctx.open = false;
            },
        },
        guards: {
            canInteract: (ctx: CollapsibleContext) => !ctx.disabled,
        },
    };
}

/**
 * useCollapsible - SolidJS hook for a spec-driven collapsible panel
 */
export function useCollapsible(options: UseCollapsibleOptions = {}): UseCollapsibleReturn {
    const config = createCollapsibleConfig({
        open: options.open ?? false,
        disabled: options.disabled ?? false,
    });
    const machine = new Machine<CollapsibleContext>(config);

    const [version, setVersion] = createSignal(0);
    const bump = () => setVersion((v) => v + 1);

    const getContext = createMemo(() => {
        version();
        return machine.getContext();
    });

    const open = () => getContext().open;
    const disabled = () => getContext().disabled;
    const state = () => { version(); return machine.getState(); };

    const toggle = () => {
        const prevOpen = machine.getContext().open;
        const result = machine.send('TOGGLE');
        if (result.handled) {
            const newOpen = machine.getContext().open;
            if (prevOpen !== newOpen) {
                options.onOpenChange?.(newOpen);
            }
            bump();
        }
    };

    const expand = () => {
        const prevOpen = machine.getContext().open;
        const result = machine.send('EXPAND');
        if (result.handled && !prevOpen) {
            options.onOpenChange?.(true);
            bump();
        }
    };

    const collapse = () => {
        const prevOpen = machine.getContext().open;
        const result = machine.send('COLLAPSE');
        if (result.handled && prevOpen) {
            options.onOpenChange?.(false);
            bump();
        }
    };

    const setDisabled = (value: boolean) => {
        (machine as any).context.disabled = value;
        bump();
    };

    const triggerProps = createMemo(() => ({
        role: 'button' as const,
        'aria-expanded': open(),
        'aria-disabled': disabled(),
        tabIndex: disabled() ? -1 : 0,
        onClick: toggle,
        onKeyDown: (e: KeyboardEvent) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                toggle();
            }
        },
    }));

    const contentProps = createMemo(() => ({
        role: 'region' as const,
        'aria-hidden': !open(),
        hidden: !open(),
    }));

    return { open, disabled, state, toggle, expand, collapse, setDisabled, triggerProps, contentProps };
}
