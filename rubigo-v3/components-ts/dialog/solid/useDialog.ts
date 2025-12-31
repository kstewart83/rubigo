/**
 * useDialog Hook
 */
import { createSignal, createEffect, onMount, onCleanup, Accessor } from 'solid-js';

export interface UseDialogOptions {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    closeOnEscape?: boolean;
    closeOnBackdrop?: boolean;
}

export interface UseDialogReturn {
    open: Accessor<boolean>;
    openDialog: () => void;
    closeDialog: () => void;
    triggerProps: () => {
        onClick: () => void;
        'aria-haspopup': 'dialog';
        'aria-expanded': boolean;
    };
    dialogProps: () => {
        role: 'dialog';
        'aria-modal': boolean;
        onKeyDown: (e: KeyboardEvent) => void;
    };
    backdropProps: () => {
        onClick: () => void;
        'aria-hidden': boolean;
    };
}

export function useDialog(options: UseDialogOptions = {}): UseDialogReturn {
    const closeOnEscape = options.closeOnEscape ?? true;
    const closeOnBackdrop = options.closeOnBackdrop ?? true;

    const [open, setOpen] = createSignal(options.open ?? options.defaultOpen ?? false);

    // Sync controlled prop
    createEffect(() => {
        if (options.open !== undefined && open() !== options.open) {
            setOpen(options.open);
        }
    });

    // Prevent body scroll when open
    createEffect(() => {
        if (open()) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    });

    onCleanup(() => {
        document.body.style.overflow = '';
    });

    const openDialog = () => {
        setOpen(true);
        options.onOpenChange?.(true);
    };

    const closeDialog = () => {
        setOpen(false);
        options.onOpenChange?.(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && closeOnEscape) {
            e.preventDefault();
            closeDialog();
        }
    };

    const handleBackdropClick = () => {
        if (closeOnBackdrop) {
            closeDialog();
        }
    };

    const triggerProps = () => ({
        onClick: openDialog,
        'aria-haspopup': 'dialog' as const,
        'aria-expanded': open(),
    });

    const dialogProps = () => ({
        role: 'dialog' as const,
        'aria-modal': true,
        onKeyDown: handleKeyDown,
    });

    const backdropProps = () => ({
        onClick: handleBackdropClick,
        'aria-hidden': true,
    });

    return {
        open,
        openDialog,
        closeDialog,
        triggerProps,
        dialogProps,
        backdropProps,
    };
}
