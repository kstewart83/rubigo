/**
 * Togglegroup Component Examples
 * AUTO-GENERATED from specifications/primitives/togglegroup.sudo.md
 * DO NOT EDIT MANUALLY
 */
import { Component } from 'solid-js';
import { ToggleGroup } from '@rubigo/components/togglegroup';

export interface Example {
    name: string;
    description: string;
    component: Component;
    source: string;
}

const BasicExample: Component = () => (
<ToggleGroup.Root defaultValue="left" onValueChange={(v) => console.log(v)}>
  <ToggleGroup.Item value="left">Left</ToggleGroup.Item>
  <ToggleGroup.Item value="center">Center</ToggleGroup.Item>
  <ToggleGroup.Item value="right">Right</ToggleGroup.Item>
</ToggleGroup.Root>
);

const DisabledExample: Component = () => (
<ToggleGroup.Root defaultValue="opt1" disabled>
  <ToggleGroup.Item value="opt1">Option 1</ToggleGroup.Item>
  <ToggleGroup.Item value="opt2">Option 2</ToggleGroup.Item>
</ToggleGroup.Root>
);

export const togglegroupExamples: Example[] = [
    {
        name: 'basic',
        description: 'basic example',
        component: BasicExample,
        source: `<ToggleGroup.Root defaultValue="left" onValueChange={(v) => console.log(v)}>
  <ToggleGroup.Item value="left">Left</ToggleGroup.Item>
  <ToggleGroup.Item value="center">Center</ToggleGroup.Item>
  <ToggleGroup.Item value="right">Right</ToggleGroup.Item>
</ToggleGroup.Root>`,
    },
    {
        name: 'disabled',
        description: 'disabled example',
        component: DisabledExample,
        source: `<ToggleGroup.Root defaultValue="opt1" disabled>
  <ToggleGroup.Item value="opt1">Option 1</ToggleGroup.Item>
  <ToggleGroup.Item value="opt2">Option 2</ToggleGroup.Item>
</ToggleGroup.Root>`,
    },
];
