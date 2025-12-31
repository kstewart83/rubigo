/**
 * useCollapsible Hook
 */
import { createSignal, createEffect, Accessor } from 'solid-js';
import { createMachine } from '../../statechart';
import { createCollapsibleConfig, type CollapsibleContext } from '../config';

export interface UseCollapsibleOptions {
    open?: boolean;
    defaultOpen?: boolean;
    disabled?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export interface UseCollapsibleReturn {
    open: Accessor<boolean>;
    disabled: Accessor<boolean>;
    toggle: () => void;
    expand: () => void;
    collapse: () => void;
    triggerProps: () => {
        'aria-expanded': boolean;
        'aria-disabled': boolean | undefined;
        onClick: () => void;
        onKeyDown: (e: KeyboardEvent) => void;
    };
    contentProps: () => {
        'aria-hidden': boolean;
        hidden: boolean;
    };
}

export function useCollapsible(options: UseCollapsibleOptions = {}): UseCollapsibleReturn {
    const machine = createMachine(createCollapsibleConfig({
        open: options.open ?? options.defaultOpen ?? false,
        disabled: options.disabled ?? false,
    }));

    const [bump, setBump] = createSignal(0);
    const triggerUpdate = () => setBump(b => b + 1);

    // Sync controlled props
    createEffect(() => {
        if (options.open !== undefined) {
            const ctx = machine.getContext();
            if (ctx.open !== options.open) {
                (machine as any).context.open = options.open;
                triggerUpdate();
            }
        }
    });

    createEffect(() => {
        const disabled = options.disabled ?? false;
        if (machine.getContext().disabled !== disabled) {
            (machine as any).context.disabled = disabled;
            triggerUpdate();
        }
    });

    const open = () => {
        bump();
        return machine.getContext().open;
    };

    const disabled = () => {
        bump();
        return machine.getContext().disabled;
    };

    const toggle = () => {
        const ctx = machine.getContext();
        if (ctx.disabled) return;
        const newOpen = !ctx.open;
        (machine as any).context.open = newOpen;
        options.onOpenChange?.(newOpen);
        triggerUpdate();
    };

    const expand = () => {
        const ctx = machine.getContext();
        if (ctx.disabled || ctx.open) return;
        (machine as any).context.open = true;
        options.onOpenChange?.(true);
        triggerUpdate();
    };

    const collapse = () => {
        const ctx = machine.getContext();
        if (ctx.disabled || !ctx.open) return;
        (machine as any).context.open = false;
        options.onOpenChange?.(false);
        triggerUpdate();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
        }
    };

    const triggerProps = () => ({
        'aria-expanded': open(),
        'aria-disabled': disabled() || undefined,
        onClick: toggle,
        onKeyDown: handleKeyDown,
    });

    const contentProps = () => ({
        'aria-hidden': !open(),
        hidden: !open(),
    });

    return {
        open,
        disabled,
        toggle,
        expand,
        collapse,
        triggerProps,
        contentProps,
    };
}
