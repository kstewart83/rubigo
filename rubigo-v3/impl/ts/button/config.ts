/**
 * Button Component Configuration
 *
 * Single source of truth - imports from generated/button.json and transforms
 * to MachineConfig format. All button implementations should import from here.
 */

// Import the generated spec (from `just spec-gen`)
import buttonSpec from '../../../generated/button.json';
import type { MachineConfig } from '../statechart';

// Context type for the button component
export interface ButtonContext {
    disabled: boolean;
    loading: boolean;
    pressed: boolean;
}

/**
 * Transform the spec format to MachineConfig format.
 */
export const buttonConfig: MachineConfig<ButtonContext> = {
    id: buttonSpec.machine.id,
    initial: buttonSpec.machine.initial,
    context: buttonSpec.context as ButtonContext,
    states: buttonSpec.machine.states,
    global: buttonSpec.machine.global,
    guards: buttonSpec.guards,
    actions: buttonSpec.actions,
};

/**
 * Create a button config with custom initial values
 */
export function createButtonConfig(overrides?: Partial<ButtonContext>): MachineConfig<ButtonContext> {
    return {
        ...buttonConfig,
        context: {
            ...buttonConfig.context,
            ...overrides,
        },
    };
}
