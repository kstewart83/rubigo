/**
 * Collapsible Components
 */
import { Component, createContext, useContext, JSX, splitProps } from 'solid-js';
import { useCollapsible, type UseCollapsibleOptions, type UseCollapsibleReturn } from './useCollapsible';
import styles from '../Collapsible.module.css';

const CollapsibleContext = createContext<UseCollapsibleReturn>();

export interface CollapsibleRootProps extends UseCollapsibleOptions {
    children: JSX.Element;
    class?: string;
}

export const CollapsibleRoot: Component<CollapsibleRootProps> = (props) => {
    const [local, options] = splitProps(props, ['children', 'class']);
    const collapsible = useCollapsible(options);

    const rootClass = () => {
        const classes = [styles.root];
        if (collapsible.open()) classes.push(styles.open);
        if (collapsible.disabled()) classes.push(styles.disabled);
        if (local.class) classes.push(local.class);
        return classes.join(' ');
    };

    return (
        <CollapsibleContext.Provider value={collapsible}>
            <div class={rootClass()}>
                {local.children}
            </div>
        </CollapsibleContext.Provider>
    );
};

export interface CollapsibleTriggerProps {
    children: JSX.Element;
    class?: string;
}

export const CollapsibleTrigger: Component<CollapsibleTriggerProps> = (props) => {
    const collapsible = useContext(CollapsibleContext);
    if (!collapsible) throw new Error('CollapsibleTrigger must be used within CollapsibleRoot');

    const triggerClass = () => {
        const classes = [styles.trigger];
        if (props.class) classes.push(props.class);
        return classes.join(' ');
    };

    return (
        <button
            type="button"
            class={triggerClass()}
            disabled={collapsible.disabled()}
            {...collapsible.triggerProps()}
        >
            {props.children}
            <span class={styles.icon}>
                {collapsible.open() ? '−' : '+'}
            </span>
        </button>
    );
};

export interface CollapsibleContentProps {
    children: JSX.Element;
    class?: string;
}

export const CollapsibleContent: Component<CollapsibleContentProps> = (props) => {
    const collapsible = useContext(CollapsibleContext);
    if (!collapsible) throw new Error('CollapsibleContent must be used within CollapsibleRoot');

    const contentClass = () => {
        const classes = [styles.content];
        if (collapsible.open()) classes.push(styles.contentOpen);
        if (props.class) classes.push(props.class);
        return classes.join(' ');
    };

    return (
        <div class={contentClass()} {...collapsible.contentProps()}>
            <div class={styles.contentInner}>
                {props.children}
            </div>
        </div>
    );
};

export const Collapsible = {
    Root: CollapsibleRoot,
    Trigger: CollapsibleTrigger,
    Content: CollapsibleContent,
};
