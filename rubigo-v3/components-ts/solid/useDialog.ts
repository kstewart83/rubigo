/**
 * Rubigo SolidJS Dialog Hook
 *
 * Provides a reactive hook for modal dialogs using the statechart engine.
 * Supports focus trapping, escape key, and backdrop click handling.
 */

import { createSignal, createMemo, createEffect, onCleanup } from 'solid-js';
import { Machine, type MachineConfig } from '../statechart/machine';

export interface UseDialogOptions {
    open?: boolean;
    preventClose?: boolean;
    closeOnEscape?: boolean;
    closeOnBackdrop?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export interface UseDialogReturn {
    open: () => boolean;
    preventClose: () => boolean;
    state: () => string;
    openDialog: () => void;
    closeDialog: () => void;
    setPreventClose: (prevent: boolean) => void;
    triggerProps: () => {
        onClick: () => void;
        'aria-haspopup': 'dialog';
        'aria-expanded': boolean;
    };
    backdropProps: () => {
        onClick: () => void;
        'aria-hidden': 'true';
    };
    contentProps: () => {
        role: 'dialog';
        'aria-modal': 'true';
        tabIndex: -1;
        onKeyDown: (e: KeyboardEvent) => void;
    };
}

// Dialog context
interface DialogContext {
    open: boolean;
    preventClose: boolean;
}

// Create dialog config
function createDialogConfig(initial: Partial<DialogContext>): MachineConfig<DialogContext> {
    const context: DialogContext = {
        open: initial.open ?? false,
        preventClose: initial.preventClose ?? false,
    };

    return {
        id: 'dialog',
        initial: context.open ? 'open' : 'closed',
        context,
        states: {
            closed: {
                on: {
                    OPEN: { target: 'open', actions: ['setOpen'] },
                },
            },
            open: {
                on: {
                    CLOSE: { target: 'closed', actions: ['setClosed'], guard: 'canClose' },
                    ESCAPE: { target: 'closed', actions: ['setClosed'], guard: 'canClose' },
                    BACKDROP_CLICK: { target: 'closed', actions: ['setClosed'], guard: 'canClose' },
                },
            },
        },
        actions: {
            setOpen: (ctx: DialogContext) => {
                ctx.open = true;
            },
            setClosed: (ctx: DialogContext) => {
                ctx.open = false;
            },
        },
        guards: {
            canClose: (ctx: DialogContext) => !ctx.preventClose,
        },
    };
}

let dialogIdCounter = 0;

/**
 * useDialog - SolidJS hook for a spec-driven modal dialog
 */
export function useDialog(options: UseDialogOptions = {}): UseDialogReturn {
    const dialogId = `dialog-${++dialogIdCounter}`;
    const closeOnEscape = options.closeOnEscape ?? true;
    const closeOnBackdrop = options.closeOnBackdrop ?? true;

    const config = createDialogConfig({
        open: options.open ?? false,
        preventClose: options.preventClose ?? false,
    });
    const machine = new Machine<DialogContext>(config);

    const [version, setVersion] = createSignal(0);
    const bump = () => setVersion((v) => v + 1);

    const getContext = createMemo(() => {
        version();
        return machine.getContext();
    });

    const open = () => getContext().open;
    const preventClose = () => getContext().preventClose;
    const state = () => { version(); return machine.getState(); };

    const openDialog = () => {
        const prevOpen = machine.getContext().open;
        machine.send('OPEN');
        if (!prevOpen && machine.getContext().open) {
            options.onOpenChange?.(true);
        }
        bump();
    };

    const closeDialog = () => {
        const prevOpen = machine.getContext().open;
        machine.send('CLOSE');
        if (prevOpen && !machine.getContext().open) {
            options.onOpenChange?.(false);
        }
        bump();
    };

    const handleEscape = () => {
        if (!closeOnEscape) return;
        const prevOpen = machine.getContext().open;
        machine.send('ESCAPE');
        if (prevOpen && !machine.getContext().open) {
            options.onOpenChange?.(false);
        }
        bump();
    };

    const handleBackdropClick = () => {
        if (!closeOnBackdrop) return;
        const prevOpen = machine.getContext().open;
        machine.send('BACKDROP_CLICK');
        if (prevOpen && !machine.getContext().open) {
            options.onOpenChange?.(false);
        }
        bump();
    };

    const setPreventClose = (value: boolean) => {
        (machine as any).context.preventClose = value;
        bump();
    };

    const triggerProps = createMemo(() => ({
        onClick: openDialog,
        'aria-haspopup': 'dialog' as const,
        'aria-expanded': open(),
    }));

    const backdropProps = createMemo(() => ({
        onClick: handleBackdropClick,
        'aria-hidden': 'true' as const,
    }));

    const contentProps = createMemo(() => ({
        role: 'dialog' as const,
        'aria-modal': 'true' as const,
        tabIndex: -1 as const,
        onKeyDown: (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                handleEscape();
            }
        },
    }));

    return { open, preventClose, state, openDialog, closeDialog, setPreventClose, triggerProps, backdropProps, contentProps };
}
