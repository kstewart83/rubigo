/**
 * Slider Component Configuration
 */
import sliderSpec from '../../../generated/slider.json';
import type { MachineConfig } from '../statechart';

export interface SliderContext {
    value: number;
    min: number;
    max: number;
    step: number;
    disabled: boolean;
    dragging: boolean;
}

export const sliderConfig: MachineConfig<SliderContext> = {
    id: sliderSpec.machine.id,
    initial: sliderSpec.machine.initial,
    context: sliderSpec.context as SliderContext,
    states: sliderSpec.machine.states,
    guards: sliderSpec.guards,
    actions: sliderSpec.actions,
};

export function createSliderConfig(overrides?: Partial<SliderContext>): MachineConfig<SliderContext> {
    return {
        ...sliderConfig,
        context: {
            ...sliderConfig.context,
            ...overrides,
        },
    };
}
