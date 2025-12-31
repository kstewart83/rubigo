/**
 * Input Component Examples
 * AUTO-GENERATED from specifications/primitives/input.sudo.md
 * DO NOT EDIT MANUALLY
 */
import { Component } from 'solid-js';
import { Input } from '@rubigo/components/input';

export interface Example {
    name: string;
    description: string;
    component: Component;
    source: string;
}

const BasicExample: Component = () => (
<Input 
  placeholder="Enter your name"
  onChange={(val) => console.log(val)}
/>
);

const WithValueExample: Component = () => (
<Input value="Hello World" />
);

const DisabledExample: Component = () => (
<Input disabled placeholder="Cannot edit" />
);

export const inputExamples: Example[] = [
    {
        name: 'basic',
        description: 'basic example',
        component: BasicExample,
        source: `<Input 
  placeholder="Enter your name"
  onChange={(val) => console.log(val)}
/>`,
    },
    {
        name: 'withValue',
        description: 'withValue example',
        component: WithValueExample,
        source: `<Input value="Hello World" />`,
    },
    {
        name: 'disabled',
        description: 'disabled example',
        component: DisabledExample,
        source: `<Input disabled placeholder="Cannot edit" />`,
    },
];
