/**
 * ToggleGroup Components
 */
import { Component, createContext, useContext, JSX, splitProps } from 'solid-js';
import { useToggleGroup, type UseToggleGroupOptions, type UseToggleGroupReturn } from './useToggleGroup';
import styles from '../ToggleGroup.module.css';

const ToggleGroupContext = createContext<UseToggleGroupReturn>();

export interface ToggleGroupRootProps extends UseToggleGroupOptions {
    children: JSX.Element;
    class?: string;
}

export const ToggleGroupRoot: Component<ToggleGroupRootProps> = (props) => {
    const [local, options] = splitProps(props, ['children', 'class']);
    const group = useToggleGroup(options);

    const rootClass = () => {
        const classes = [styles.root];
        if (group.disabled()) classes.push(styles.disabled);
        if (local.class) classes.push(local.class);
        return classes.join(' ');
    };

    return (
        <ToggleGroupContext.Provider value={group}>
            <div class={rootClass()} {...group.rootProps()}>
                {local.children}
            </div>
        </ToggleGroupContext.Provider>
    );
};

export interface ToggleGroupItemProps {
    value: string;
    children: JSX.Element;
    class?: string;
    disabled?: boolean;
}

export const ToggleGroupItem: Component<ToggleGroupItemProps> = (props) => {
    const group = useContext(ToggleGroupContext);
    if (!group) throw new Error('ToggleGroupItem must be used within ToggleGroupRoot');

    const itemClass = () => {
        const classes = [styles.item];
        if (group.selectedId() === props.value) classes.push(styles.selected);
        if (group.focusedId() === props.value) classes.push(styles.focused);
        if (props.disabled || group.disabled()) classes.push(styles.itemDisabled);
        if (props.class) classes.push(props.class);
        return classes.join(' ');
    };

    return (
        <button
            type="button"
            class={itemClass()}
            disabled={props.disabled || group.disabled()}
            {...group.getItemProps(props.value)}
        >
            {props.children}
        </button>
    );
};

export const ToggleGroup = {
    Root: ToggleGroupRoot,
    Item: ToggleGroupItem,
};
