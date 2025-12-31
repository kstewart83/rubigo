/**
 * Tooltip Component Examples
 * AUTO-GENERATED from specifications/primitives/tooltip.sudo.md
 * DO NOT EDIT MANUALLY
 */
import { Component } from 'solid-js';
import { Tooltip } from '@rubigo/components/tooltip';
import { Button } from '@rubigo/components/button';

export interface Example {
    name: string;
    description: string;
    component: Component;
    source: string;
}

const BasicExample: Component = () => (
<Tooltip.Root>
  <Tooltip.Trigger>Hover me</Tooltip.Trigger>
  <Tooltip.Content>
    Helpful tooltip text
  </Tooltip.Content>
</Tooltip.Root>
);

const WithDelayExample: Component = () => (
<Tooltip.Root delayDuration={500}>
  <Tooltip.Trigger>Delayed tooltip</Tooltip.Trigger>
  <Tooltip.Content>
    Appears after 500ms
  </Tooltip.Content>
</Tooltip.Root>
);

export const tooltipExamples: Example[] = [
    {
        name: 'basic',
        description: 'basic example',
        component: BasicExample,
        source: `<Tooltip.Root>
  <Tooltip.Trigger>Hover me</Tooltip.Trigger>
  <Tooltip.Content>
    Helpful tooltip text
  </Tooltip.Content>
</Tooltip.Root>`,
    },
    {
        name: 'withDelay',
        description: 'withDelay example',
        component: WithDelayExample,
        source: `<Tooltip.Root delayDuration={500}>
  <Tooltip.Trigger>Delayed tooltip</Tooltip.Trigger>
  <Tooltip.Content>
    Appears after 500ms
  </Tooltip.Content>
</Tooltip.Root>`,
    },
];
