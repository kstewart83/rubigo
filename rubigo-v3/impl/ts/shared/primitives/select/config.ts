/**
 * Select Component Configuration
 */
import selectSpec from '../../../../../generated/shared/primitives/select/select.json';
import type { MachineConfig } from '../../../statechart';

export interface SelectContext {
    selectedValue: string;
    highlightedValue: string;
    open: boolean;
    disabled: boolean;
}

export const selectConfig: MachineConfig<SelectContext> = {
    id: selectSpec.machine.id,
    initial: selectSpec.machine.initial,
    context: selectSpec.context as SelectContext,
    states: selectSpec.machine.states,
    guards: selectSpec.guards,
    actions: selectSpec.actions,
};

export function createSelectConfig(overrides?: Partial<SelectContext>): MachineConfig<SelectContext> {
    return {
        ...selectConfig,
        context: {
            ...selectConfig.context,
            ...overrides,
        },
    };
}
