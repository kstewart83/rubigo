/**
 * Dialog Component Configuration
 */
import dialogSpec from '../../../../../generated/shared/primitives/dialog/dialog.json';
import type { MachineConfig } from '../../../statechart';

export interface DialogContext {
    open: boolean;
    preventClose: boolean;
}

export const dialogConfig: MachineConfig<DialogContext> = {
    id: dialogSpec.machine.id,
    initial: dialogSpec.machine.initial,
    context: dialogSpec.context as DialogContext,
    states: dialogSpec.machine.states,
    guards: dialogSpec.guards,
    actions: dialogSpec.actions,
};

export function createDialogConfig(overrides?: Partial<DialogContext>): MachineConfig<DialogContext> {
    return {
        ...dialogConfig,
        context: {
            ...dialogConfig.context,
            ...overrides,
        },
    };
}
