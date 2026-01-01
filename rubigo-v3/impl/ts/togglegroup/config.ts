/**
 * ToggleGroup Component Configuration
 */
import togglegroupSpec from '../../generated/togglegroup.json';
import type { MachineConfig } from '../statechart';

export interface ToggleGroupContext {
    selectedId: string;
    focusedId: string;
    disabled: boolean;
}

export const toggleGroupConfig: MachineConfig<ToggleGroupContext> = {
    id: togglegroupSpec.machine.id,
    initial: togglegroupSpec.machine.initial,
    context: togglegroupSpec.context as ToggleGroupContext,
    states: togglegroupSpec.machine.states,
    guards: togglegroupSpec.guards,
    actions: togglegroupSpec.actions,
};

export function createToggleGroupConfig(overrides?: Partial<ToggleGroupContext>): MachineConfig<ToggleGroupContext> {
    return {
        ...toggleGroupConfig,
        context: {
            ...toggleGroupConfig.context,
            ...overrides,
        },
    };
}
