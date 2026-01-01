/**
 * Collapsible Component Configuration
 */
import collapsibleSpec from '../../../generated/collapsible.json';
import type { MachineConfig } from '../statechart';

export interface CollapsibleContext {
    open: boolean;
    disabled: boolean;
}

export const collapsibleConfig: MachineConfig<CollapsibleContext> = {
    id: collapsibleSpec.machine.id,
    initial: collapsibleSpec.machine.initial,
    context: collapsibleSpec.context as CollapsibleContext,
    states: collapsibleSpec.machine.states,
    guards: collapsibleSpec.guards,
    actions: collapsibleSpec.actions,
};

export function createCollapsibleConfig(overrides?: Partial<CollapsibleContext>): MachineConfig<CollapsibleContext> {
    return {
        ...collapsibleConfig,
        context: {
            ...collapsibleConfig.context,
            ...overrides,
        },
    };
}
