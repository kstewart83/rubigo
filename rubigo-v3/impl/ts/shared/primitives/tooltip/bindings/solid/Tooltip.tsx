/**
 * Tooltip Components
 */
import { Component, createContext, useContext, JSX, splitProps, Show } from 'solid-js';
import { useTooltip, type UseTooltipOptions, type UseTooltipReturn } from './useTooltip';
import styles from '../../Tooltip.module.css';

const TooltipContext = createContext<UseTooltipReturn>();

export interface TooltipProviderProps {
    children: JSX.Element;
}

export const TooltipProvider: Component<TooltipProviderProps> = (props) => {
    return <>{props.children}</>;
};

export interface TooltipRootProps extends UseTooltipOptions {
    children: JSX.Element;
}

export const TooltipRoot: Component<TooltipRootProps> = (props) => {
    const [local, options] = splitProps(props, ['children']);
    const tooltip = useTooltip(options);

    return (
        <TooltipContext.Provider value={tooltip}>
            <div class={styles.root}>
                {local.children}
            </div>
        </TooltipContext.Provider>
    );
};

export interface TooltipTriggerProps {
    children: JSX.Element;
    class?: string;
}

export const TooltipTrigger: Component<TooltipTriggerProps> = (props) => {
    const tooltip = useContext(TooltipContext);
    if (!tooltip) throw new Error('TooltipTrigger must be used within TooltipRoot');

    return (
        <span class={`${styles.trigger} ${props.class ?? ''}`} {...tooltip.triggerProps()}>
            {props.children}
        </span>
    );
};

export interface TooltipContentProps {
    children: JSX.Element;
    class?: string;
    side?: 'top' | 'right' | 'bottom' | 'left';
}

export const TooltipContent: Component<TooltipContentProps> = (props) => {
    const tooltip = useContext(TooltipContext);
    if (!tooltip) throw new Error('TooltipContent must be used within TooltipRoot');

    const side = props.side ?? 'top';

    const contentClass = () => {
        const classes = [styles.content, styles[side]];
        if (props.class) classes.push(props.class);
        return classes.join(' ');
    };

    return (
        <Show when={tooltip.open()}>
            <div class={contentClass()} {...tooltip.contentProps()}>
                {props.children}
                <div class={`${styles.arrow} ${styles[`arrow${side.charAt(0).toUpperCase() + side.slice(1)}`]}`} />
            </div>
        </Show>
    );
};

export const Tooltip = {
    Provider: TooltipProvider,
    Root: TooltipRoot,
    Trigger: TooltipTrigger,
    Content: TooltipContent,
};
