/**
 * Tabs Components
 * 
 * A tabbed interface with TabsRoot, TabList, Tab, and TabPanel.
 */
import { Component, createContext, useContext, JSX, For, splitProps, children as resolveChildren } from 'solid-js';
import { useTabs, type UseTabsOptions, type UseTabsReturn } from './useTabs';
import styles from '../../Tabs.module.css';

// Context for sharing tabs state
const TabsContext = createContext<UseTabsReturn>();

// Root component that provides context
export interface TabsRootProps extends UseTabsOptions {
    children: JSX.Element;
    class?: string;
}

export const TabsRoot: Component<TabsRootProps> = (props) => {
    const [local, options] = splitProps(props, ['children', 'class']);
    const tabs = useTabs(options);

    return (
        <TabsContext.Provider value={tabs}>
            <div class={`${styles.root} ${local.class ?? ''}`}>
                {local.children}
            </div>
        </TabsContext.Provider>
    );
};

// TabList component
export interface TabListProps {
    children: JSX.Element;
    class?: string;
}

export const TabList: Component<TabListProps> = (props) => {
    const tabs = useContext(TabsContext);
    if (!tabs) throw new Error('TabList must be used within TabsRoot');

    return (
        <div class={`${styles.tablist} ${props.class ?? ''}`} {...tabs.tablistProps()}>
            {props.children}
        </div>
    );
};

// Tab trigger component
export interface TabProps {
    value: string;
    children: JSX.Element;
    class?: string;
    disabled?: boolean;
}

export const Tab: Component<TabProps> = (props) => {
    const tabs = useContext(TabsContext);
    if (!tabs) throw new Error('Tab must be used within TabsRoot');

    // Note: index/total tracking simplified - could be enhanced with context
    const tabProps = () => tabs.getTabProps(props.value, 0, 1);

    const tabClass = () => {
        const classes = [styles.tab];
        if (tabs.selectedId() === props.value) classes.push(styles.selected);
        if (tabs.focusedId() === props.value) classes.push(styles.focused);
        if (props.disabled) classes.push(styles.disabled);
        if (props.class) classes.push(props.class);
        return classes.join(' ');
    };

    return (
        <button
            type="button"
            class={tabClass()}
            disabled={props.disabled}
            {...tabProps()}
        >
            {props.children}
        </button>
    );
};

// TabPanel component
export interface TabPanelProps {
    value: string;
    children: JSX.Element;
    class?: string;
}

export const TabPanel: Component<TabPanelProps> = (props) => {
    const tabs = useContext(TabsContext);
    if (!tabs) throw new Error('TabPanel must be used within TabsRoot');

    const panelProps = () => tabs.getPanelProps(props.value);
    const isHidden = () => tabs.selectedId() !== props.value;

    return (
        <div
            class={`${styles.panel} ${props.class ?? ''}`}
            {...panelProps()}
            style={{ display: isHidden() ? 'none' : undefined }}
        >
            {props.children}
        </div>
    );
};

// Convenience compound component
export const Tabs = {
    Root: TabsRoot,
    List: TabList,
    Tab: Tab,
    Panel: TabPanel,
};
