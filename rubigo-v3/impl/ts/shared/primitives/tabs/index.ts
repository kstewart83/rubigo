// Tabs Component Exports

// Config
export { tabsConfig, createTabsConfig, type TabsContext } from './config';

// SolidJS implementation
export { Tabs, TabsRoot, TabList, Tab, TabPanel } from './bindings/solid/Tabs';
export type { TabsRootProps, TabListProps, TabProps, TabPanelProps } from './bindings/solid/Tabs';
export { useTabs } from './bindings/solid/useTabs';
export type { UseTabsOptions, UseTabsReturn } from './bindings/solid/useTabs';
