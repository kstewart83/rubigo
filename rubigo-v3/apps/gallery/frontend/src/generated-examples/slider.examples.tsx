/**
 * Slider Component Examples
 * AUTO-GENERATED from specifications/primitives/slider.sudo.md
 * DO NOT EDIT MANUALLY
 */
import { Component } from 'solid-js';
import { Slider } from '@rubigo/components/slider';

export interface Example {
    name: string;
    description: string;
    component: Component;
    source: string;
}

const BasicExample: Component = () => (
<Slider 
  min={0} 
  max={100} 
  value={50}
  onValueChange={(val) => console.log(val)}
/>
);

const RangeExample: Component = () => (
<Slider min={0} max={1000} step={50} value={250} />
);

const DisabledExample: Component = () => (
<Slider disabled value={50} />
);

export const sliderExamples: Example[] = [
    {
        name: 'basic',
        description: 'basic example',
        component: BasicExample,
        source: `<Slider 
  min={0} 
  max={100} 
  value={50}
  onValueChange={(val) => console.log(val)}
/>`,
    },
    {
        name: 'range',
        description: 'range example',
        component: RangeExample,
        source: `<Slider min={0} max={1000} step={50} value={250} />`,
    },
    {
        name: 'disabled',
        description: 'disabled example',
        component: DisabledExample,
        source: `<Slider disabled value={50} />`,
    },
];
