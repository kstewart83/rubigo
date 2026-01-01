/**
 * Tabs Component Configuration
 *
 * Single source of truth - imports from generated/tabs.json
 */

import tabsSpec from '../../../generated/tabs.json';
import type { MachineConfig } from '../statechart';

export interface TabsContext {
    selectedId: string;
    focusedId: string;
}

export const tabsConfig: MachineConfig<TabsContext> = {
    id: tabsSpec.machine.id,
    initial: tabsSpec.machine.initial,
    context: tabsSpec.context as TabsContext,
    states: tabsSpec.machine.states,
    guards: tabsSpec.guards,
    actions: tabsSpec.actions,
};

export function createTabsConfig(overrides?: Partial<TabsContext>): MachineConfig<TabsContext> {
    return {
        ...tabsConfig,
        context: {
            ...tabsConfig.context,
            ...overrides,
        },
    };
}
