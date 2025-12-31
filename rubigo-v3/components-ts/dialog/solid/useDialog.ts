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
    close: () => void;
    rootProps: () => {
        'aria-hidden': boolean;
        'aria-modal': boolean;
        onKeyDown: (e: KeyboardEvent) => void;
    };
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

export function useDialog(optionsInput: UseDialogOptions | (() => UseDialogOptions) = {}): UseDialogReturn {
    const getOptions = typeof optionsInput === 'function' ? optionsInput : () => optionsInput;
    const options = getOptions();

    const closeOnEscape = options.closeOnEscape ?? true;
    const closeOnBackdrop = options.closeOnBackdrop ?? true;

    const [internalOpen, setInternalOpen] = createSignal(options.open ?? options.defaultOpen ?? false);

    // Open accessor reads from props first for immediate reactivity
    const open = () => getOptions().open ?? internalOpen();

    // Sync controlled prop
    createEffect(() => {
        const controlledOpen = getOptions().open;
        if (controlledOpen !== undefined && internalOpen() !== controlledOpen) {
            setInternalOpen(controlledOpen);
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
        setInternalOpen(true);
        getOptions().onOpenChange?.(true);
    };

    const closeDialog = () => {
        setInternalOpen(false);
        getOptions().onOpenChange?.(false);
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

    const rootProps = () => ({
        'aria-hidden': !open(),
        'aria-modal': open(),
        onKeyDown: handleKeyDown,
    });

    return {
        open,
        openDialog,
        closeDialog,
        close: closeDialog,
        rootProps,
        triggerProps,
        dialogProps,
        backdropProps,
    };
}
