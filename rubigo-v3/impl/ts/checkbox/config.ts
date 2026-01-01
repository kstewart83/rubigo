/**
 * Checkbox Component Configuration
 *
 * Single source of truth - imports from generated/checkbox.json and transforms
 * to MachineConfig format. All checkbox implementations should import from here.
 */

// Import the generated spec (from `just spec-gen`)
import checkboxSpec from '../../../generated/checkbox.json';
import type { MachineConfig } from '../statechart';

// Context type for the checkbox component
export interface CheckboxContext {
    checked: boolean;
    disabled: boolean;
    indeterminate: boolean;
}

/**
 * Transform the spec format to MachineConfig format.
 */
export const checkboxConfig: MachineConfig<CheckboxContext> = {
    id: checkboxSpec.machine.id,
    initial: checkboxSpec.machine.initial,
    context: checkboxSpec.context as CheckboxContext,
    states: checkboxSpec.machine.states,
    guards: checkboxSpec.guards,
    actions: checkboxSpec.actions,
};

/**
 * Create a checkbox config with custom initial values.
 * Automatically sets the initial state based on context values.
 */
export function createCheckboxConfig(overrides?: Partial<CheckboxContext>): MachineConfig<CheckboxContext> {
    const context = {
        ...checkboxConfig.context,
        ...overrides,
    };

    // Determine initial state based on context
    let initial = 'unchecked';
    if (context.indeterminate) {
        initial = 'indeterminate';
    } else if (context.checked) {
        initial = 'checked';
    }

    return {
        ...checkboxConfig,
        initial,
        context,
    };
}
