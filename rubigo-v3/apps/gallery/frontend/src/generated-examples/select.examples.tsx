/**
 * Select Component Examples
 * AUTO-GENERATED from specifications/primitives/select.sudo.md
 * DO NOT EDIT MANUALLY
 */
import { Component } from 'solid-js';
import { Select } from '@rubigo/components/select';

export interface Example {
    name: string;
    description: string;
    component: Component;
    source: string;
}

const BasicExample: Component = () => (
<Select.Root onValueChange={(v) => console.log(v)}>
  <Select.Trigger placeholder="Select a fruit..." />
  <Select.Content>
    <Select.Item value="apple">Apple</Select.Item>
    <Select.Item value="banana">Banana</Select.Item>
    <Select.Item value="cherry">Cherry</Select.Item>
  </Select.Content>
</Select.Root>
);

const WithDefaultExample: Component = () => (
<Select.Root defaultValue="banana">
  <Select.Trigger />
  <Select.Content>
    <Select.Item value="apple">Apple</Select.Item>
    <Select.Item value="banana">Banana</Select.Item>
  </Select.Content>
</Select.Root>
);

export const selectExamples: Example[] = [
    {
        name: 'basic',
        description: 'basic example',
        component: BasicExample,
        source: `<Select.Root onValueChange={(v) => console.log(v)}>
  <Select.Trigger placeholder="Select a fruit..." />
  <Select.Content>
    <Select.Item value="apple">Apple</Select.Item>
    <Select.Item value="banana">Banana</Select.Item>
    <Select.Item value="cherry">Cherry</Select.Item>
  </Select.Content>
</Select.Root>`,
    },
    {
        name: 'withDefault',
        description: 'withDefault example',
        component: WithDefaultExample,
        source: `<Select.Root defaultValue="banana">
  <Select.Trigger />
  <Select.Content>
    <Select.Item value="apple">Apple</Select.Item>
    <Select.Item value="banana">Banana</Select.Item>
  </Select.Content>
</Select.Root>`,
    },
];
