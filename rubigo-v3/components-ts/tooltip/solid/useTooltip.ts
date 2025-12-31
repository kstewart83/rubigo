/**
 * useTooltip Hook
 */
import { createSignal, onCleanup, Accessor } from 'solid-js';

export interface UseTooltipOptions {
    delayDuration?: number;
    disabled?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export interface UseTooltipReturn {
    open: Accessor<boolean>;
    disabled: Accessor<boolean>;
    show: () => void;
    hide: () => void;
    triggerProps: () => {
        onMouseEnter: () => void;
        onMouseLeave: () => void;
        onFocus: () => void;
        onBlur: () => void;
        onKeyDown: (e: KeyboardEvent) => void;
        'aria-describedby': string | undefined;
    };
    contentProps: () => {
        role: 'tooltip';
        id: string;
    };
}

let tooltipIdCounter = 0;

export function useTooltip(optionsInput: UseTooltipOptions | (() => UseTooltipOptions) = {}): UseTooltipReturn {
    const getOptions = typeof optionsInput === 'function' ? optionsInput : () => optionsInput;
    const options = getOptions();

    const delayDuration = options.delayDuration ?? 300;

    const [open, setOpen] = createSignal(false);
    const [internalDisabled, setInternalDisabled] = createSignal(options.disabled ?? false);
    const id = `tooltip-${++tooltipIdCounter}`;

    // Disabled accessor reads from props first for immediate reactivity
    const disabled = () => getOptions().disabled ?? internalDisabled();

    let openTimeout: ReturnType<typeof setTimeout> | null = null;
    let closeTimeout: ReturnType<typeof setTimeout> | null = null;

    const clearTimeouts = () => {
        if (openTimeout) {
            clearTimeout(openTimeout);
            openTimeout = null;
        }
        if (closeTimeout) {
            clearTimeout(closeTimeout);
            closeTimeout = null;
        }
    };

    onCleanup(() => clearTimeouts());

    const show = () => {
        if (disabled()) return;
        clearTimeouts();
        setOpen(true);
        options.onOpenChange?.(true);
    };

    const hide = () => {
        clearTimeouts();
        setOpen(false);
        options.onOpenChange?.(false);
    };

    const handleMouseEnter = () => {
        if (disabled()) return;
        clearTimeouts();
        openTimeout = setTimeout(() => {
            setOpen(true);
            options.onOpenChange?.(true);
        }, delayDuration);
    };

    const handleMouseLeave = () => {
        clearTimeouts();
        closeTimeout = setTimeout(() => {
            setOpen(false);
            options.onOpenChange?.(false);
        }, 100);
    };

    const handleFocus = () => {
        if (disabled()) return;
        show();
    };

    const handleBlur = () => {
        handleMouseLeave();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && open()) {
            e.preventDefault();
            hide();
        }
    };

    const triggerProps = () => ({
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        onFocus: handleFocus,
        onBlur: handleBlur,
        onKeyDown: handleKeyDown,
        'aria-describedby': open() ? id : undefined,
    });

    const contentProps = () => ({
        role: 'tooltip' as const,
        id,
    });

    return {
        open,
        disabled,
        show,
        hide,
        triggerProps,
        contentProps,
    };
}
