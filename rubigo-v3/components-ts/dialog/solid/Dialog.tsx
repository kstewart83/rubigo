/**
 * Dialog Components
 */
import { Component, createContext, useContext, JSX, splitProps, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { useDialog, type UseDialogOptions, type UseDialogReturn } from './useDialog';
import styles from '../Dialog.module.css';

const DialogContext = createContext<UseDialogReturn>();

export interface DialogRootProps extends UseDialogOptions {
    children: JSX.Element;
}

export const DialogRoot: Component<DialogRootProps> = (props) => {
    const [local, options] = splitProps(props, ['children']);
    const dialog = useDialog(options);

    return (
        <DialogContext.Provider value={dialog}>
            {local.children}
        </DialogContext.Provider>
    );
};

export interface DialogTriggerProps {
    children: JSX.Element;
    class?: string;
}

export const DialogTrigger: Component<DialogTriggerProps> = (props) => {
    const dialog = useContext(DialogContext);
    if (!dialog) throw new Error('DialogTrigger must be used within DialogRoot');

    return (
        <button
            type="button"
            class={`${styles.trigger} ${props.class ?? ''}`}
            {...dialog.triggerProps()}
        >
            {props.children}
        </button>
    );
};

export interface DialogPortalProps {
    children: JSX.Element;
}

export const DialogPortal: Component<DialogPortalProps> = (props) => {
    const dialog = useContext(DialogContext);
    if (!dialog) throw new Error('DialogPortal must be used within DialogRoot');

    return (
        <Show when={dialog.open()}>
            <Portal>{props.children}</Portal>
        </Show>
    );
};

export interface DialogOverlayProps {
    class?: string;
}

export const DialogOverlay: Component<DialogOverlayProps> = (props) => {
    const dialog = useContext(DialogContext);
    if (!dialog) throw new Error('DialogOverlay must be used within DialogRoot');

    return (
        <div
            class={`${styles.overlay} ${props.class ?? ''}`}
            {...dialog.backdropProps()}
        />
    );
};

export interface DialogContentProps {
    children: JSX.Element;
    class?: string;
}

export const DialogContent: Component<DialogContentProps> = (props) => {
    const dialog = useContext(DialogContext);
    if (!dialog) throw new Error('DialogContent must be used within DialogRoot');

    return (
        <div
            class={`${styles.content} ${props.class ?? ''}`}
            {...dialog.dialogProps()}
            onClick={(e) => e.stopPropagation()}
        >
            {props.children}
        </div>
    );
};

export interface DialogCloseProps {
    children?: JSX.Element;
    class?: string;
}

export const DialogClose: Component<DialogCloseProps> = (props) => {
    const dialog = useContext(DialogContext);
    if (!dialog) throw new Error('DialogClose must be used within DialogRoot');

    return (
        <button
            type="button"
            class={`${styles.close} ${props.class ?? ''}`}
            onClick={dialog.closeDialog}
            aria-label="Close"
        >
            {props.children ?? '×'}
        </button>
    );
};

export interface DialogTitleProps {
    children: JSX.Element;
    class?: string;
}

export const DialogTitle: Component<DialogTitleProps> = (props) => {
    return (
        <h2 class={`${styles.title} ${props.class ?? ''}`}>
            {props.children}
        </h2>
    );
};

export interface DialogDescriptionProps {
    children: JSX.Element;
    class?: string;
}

export const DialogDescription: Component<DialogDescriptionProps> = (props) => {
    return (
        <p class={`${styles.description} ${props.class ?? ''}`}>
            {props.children}
        </p>
    );
};

export const Dialog = {
    Root: DialogRoot,
    Trigger: DialogTrigger,
    Portal: DialogPortal,
    Overlay: DialogOverlay,
    Content: DialogContent,
    Close: DialogClose,
    Title: DialogTitle,
    Description: DialogDescription,
};
