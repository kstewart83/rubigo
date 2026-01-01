/**
 * Tooltip Component Configuration
 */
import tooltipSpec from '../../../generated/tooltip.json';
import type { MachineConfig } from '../statechart';

export interface TooltipContext {
    open: boolean;
    disabled: boolean;
}

export const tooltipConfig: MachineConfig<TooltipContext> = {
    id: tooltipSpec.machine.id,
    initial: tooltipSpec.machine.initial,
    context: tooltipSpec.context as TooltipContext,
    states: tooltipSpec.machine.states,
    guards: tooltipSpec.guards,
    actions: tooltipSpec.actions,
};

export function createTooltipConfig(overrides?: Partial<TooltipContext>): MachineConfig<TooltipContext> {
    return {
        ...tooltipConfig,
        context: {
            ...tooltipConfig.context,
            ...overrides,
        },
    };
}
