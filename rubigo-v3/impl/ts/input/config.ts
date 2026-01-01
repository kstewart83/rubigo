/**
 * Input Component Configuration
 *
 * Single source of truth - imports from generated/input.json and transforms
 * to MachineConfig format. All input implementations should import from here.
 */

// Import the generated spec (from `just spec-gen`)
import inputSpec from '../../../generated/input.json';
import type { MachineConfig } from '../statechart';

// Context type for the input component
export interface InputContext {
    value: string;
    disabled: boolean;
    readOnly: boolean;
    focused: boolean;
    error: string;
}

/**
 * Transform the spec format to MachineConfig format.
 */
export const inputConfig: MachineConfig<InputContext> = {
    id: inputSpec.machine.id,
    initial: inputSpec.machine.initial,
    context: inputSpec.context as InputContext,
    states: inputSpec.machine.states,
    guards: inputSpec.guards,
    actions: inputSpec.actions,
};

/**
 * Create an input config with custom initial values
 */
export function createInputConfig(overrides?: Partial<InputContext>): MachineConfig<InputContext> {
    return {
        ...inputConfig,
        context: {
            ...inputConfig.context,
            ...overrides,
        },
    };
}
