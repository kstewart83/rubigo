// Dialog Component Exports

export { dialogConfig, createDialogConfig, type DialogContext } from './config';
export {
    Dialog,
    DialogRoot,
    DialogTrigger,
    DialogPortal,
    DialogOverlay,
    DialogContent,
    DialogClose,
    DialogTitle,
    DialogDescription
} from './solid/Dialog';
export type {
    DialogRootProps,
    DialogTriggerProps,
    DialogPortalProps,
    DialogOverlayProps,
    DialogContentProps,
    DialogCloseProps,
    DialogTitleProps,
    DialogDescriptionProps
} from './solid/Dialog';
export { useDialog, type UseDialogOptions, type UseDialogReturn } from './solid/useDialog';
