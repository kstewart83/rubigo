/**
 * Switch Component Configuration
 *
 * Single source of truth - imports from generated/switch.json and transforms
 * to MachineConfig format. All switch implementations should import from here.
 */

// Import the generated spec (from `just spec-gen`)
import switchSpec from '../../generated/switch.json';
import type { MachineConfig } from '../statechart';

// Context type for the switch component
export interface SwitchContext {
    checked: boolean;
    disabled: boolean;
    readOnly: boolean;
    focused: boolean;
}

/**
 * Transform the spec format to MachineConfig format.
 *
 * Generated JSON structure:
 *   { machine: { id, initial, states }, context, guards, actions }
 *
 * MachineConfig structure:
 *   { id, initial, context, states, guards, actions }
 */
export const switchConfig: MachineConfig<SwitchContext> = {
    id: switchSpec.machine.id,
    initial: switchSpec.machine.initial,
    context: switchSpec.context as SwitchContext,
    states: switchSpec.machine.states,
    guards: switchSpec.guards,
    actions: switchSpec.actions,
};

/**
 * Create a switch config with custom initial values
 */
export function createSwitchConfig(overrides?: Partial<SwitchContext>): MachineConfig<SwitchContext> {
    return {
        ...switchConfig,
        context: {
            ...switchConfig.context,
            ...overrides,
        },
    };
}
