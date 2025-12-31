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

export function useCollapsible(optionsInput: UseCollapsibleOptions | (() => UseCollapsibleOptions) = {}): UseCollapsibleReturn {
    const getOptions = typeof optionsInput === 'function' ? optionsInput : () => optionsInput;
    const options = getOptions();

    const machine = createMachine(createCollapsibleConfig({
        open: options.open ?? options.defaultOpen ?? false,
        disabled: options.disabled ?? false,
    }));

    const [bump, setBump] = createSignal(0);
    const triggerUpdate = () => setBump(b => b + 1);

    // Sync controlled props
    createEffect(() => {
        const open = getOptions().open;
        if (open !== undefined) {
            const ctx = machine.getContext();
            if (ctx.open !== open) {
                (machine as any).context.open = open;
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

    const open = () => {
        bump();
        return getOptions().open ?? machine.getContext().open;
    };

    const disabled = () => {
        bump();
        return getOptions().disabled ?? machine.getContext().disabled;
    };

    const toggle = () => {
        const ctx = machine.getContext();
        if (ctx.disabled) return;
        const newOpen = !ctx.open;
        (machine as any).context.open = newOpen;
        getOptions().onOpenChange?.(newOpen);
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

    const rootProps = () => ({
        'aria-disabled': disabled() || undefined,
        'aria-expanded': open(),
        onKeyDown: (_e: KeyboardEvent) => {
            // Keyboard handling is on triggerProps
        },
    });

    return {
        open,
        disabled,
        toggle,
        expand,
        collapse,
        close: collapse,
        rootProps,
        triggerProps,
        contentProps,
    };
}
