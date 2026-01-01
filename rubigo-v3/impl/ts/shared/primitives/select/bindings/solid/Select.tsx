/**
 * Select Components
 */
import { Component, createContext, useContext, JSX, splitProps, Show, For } from 'solid-js';
import { useSelect, type UseSelectOptions, type UseSelectReturn } from './useSelect';
import styles from '../../Select.module.css';

const SelectContext = createContext<UseSelectReturn>();

export interface SelectRootProps extends UseSelectOptions {
    children: JSX.Element;
    class?: string;
}

export const SelectRoot: Component<SelectRootProps> = (props) => {
    const [local, options] = splitProps(props, ['children', 'class']);
    const select = useSelect(options);

    const rootClass = () => {
        const classes = [styles.root];
        if (select.open()) classes.push(styles.open);
        if (select.disabled()) classes.push(styles.disabled);
        if (local.class) classes.push(local.class);
        return classes.join(' ');
    };

    return (
        <SelectContext.Provider value={select}>
            <div class={rootClass()}>
                {local.children}
            </div>
        </SelectContext.Provider>
    );
};

export interface SelectTriggerProps {
    children?: JSX.Element;
    placeholder?: string;
    class?: string;
}

export const SelectTrigger: Component<SelectTriggerProps> = (props) => {
    const select = useContext(SelectContext);
    if (!select) throw new Error('SelectTrigger must be used within SelectRoot');

    const displayValue = () => {
        const val = select.selectedValue();
        return val || props.placeholder || 'Select...';
    };

    return (
        <button
            type="button"
            class={`${styles.trigger} ${props.class ?? ''}`}
            {...select.triggerProps()}
        >
            <span class={styles.value}>{props.children ?? displayValue()}</span>
            <span class={styles.chevron}>▼</span>
        </button>
    );
};

export interface SelectContentProps {
    children: JSX.Element;
    class?: string;
}

export const SelectContent: Component<SelectContentProps> = (props) => {
    const select = useContext(SelectContext);
    if (!select) throw new Error('SelectContent must be used within SelectRoot');

    return (
        <Show when={select.open()}>
            <div
                class={`${styles.content} ${props.class ?? ''}`}
                {...select.listboxProps()}
                onClick={(e) => e.stopPropagation()}
            >
                {props.children}
            </div>
        </Show>
    );
};

export interface SelectItemProps {
    value: string;
    children: JSX.Element;
    class?: string;
    disabled?: boolean;
}

export const SelectItem: Component<SelectItemProps> = (props) => {
    const select = useContext(SelectContext);
    if (!select) throw new Error('SelectItem must be used within SelectRoot');

    const optionProps = () => select.getOptionProps(props.value);

    const itemClass = () => {
        const classes = [styles.item];
        if (select.selectedValue() === props.value) classes.push(styles.selected);
        if (select.highlightedValue() === props.value) classes.push(styles.highlighted);
        if (props.disabled) classes.push(styles.itemDisabled);
        if (props.class) classes.push(props.class);
        return classes.join(' ');
    };

    return (
        <div class={itemClass()} {...optionProps()}>
            {props.children}
            {select.selectedValue() === props.value && (
                <span class={styles.checkmark}>✓</span>
            )}
        </div>
    );
};

export interface SelectValueProps {
    placeholder?: string;
}

export const SelectValue: Component<SelectValueProps> = (props) => {
    const select = useContext(SelectContext);
    if (!select) throw new Error('SelectValue must be used within SelectRoot');

    return <>{select.selectedValue() || props.placeholder || 'Select...'}</>;
};

export const Select = {
    Root: SelectRoot,
    Trigger: SelectTrigger,
    Content: SelectContent,
    Item: SelectItem,
    Value: SelectValue,
};
