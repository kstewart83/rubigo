// Tabs Component Exports

// Config
export { tabsConfig, createTabsConfig, type TabsContext } from './config';

// SolidJS implementation
export { Tabs, TabsRoot, TabList, Tab, TabPanel } from './solid/Tabs';
export type { TabsRootProps, TabListProps, TabProps, TabPanelProps } from './solid/Tabs';
export { useTabs } from './solid/useTabs';
export type { UseTabsOptions, UseTabsReturn } from './solid/useTabs';
