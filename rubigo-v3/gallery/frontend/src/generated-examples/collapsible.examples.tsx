/**
 * Collapsible Component Examples
 * AUTO-GENERATED from specifications/primitives/collapsible.sudo.md
 * DO NOT EDIT MANUALLY
 */
import { Component } from 'solid-js';
import { Collapsible } from '@rubigo/components/collapsible';

export interface Example {
    name: string;
    description: string;
    component: Component;
    source: string;
}

const BasicExample: Component = () => (
<Collapsible.Root>
  <Collapsible.Trigger>Toggle Content</Collapsible.Trigger>
  <Collapsible.Content>
    <p>Hidden content revealed on click.</p>
  </Collapsible.Content>
</Collapsible.Root>
);

const DefaultOpenExample: Component = () => (
<Collapsible.Root defaultOpen>
  <Collapsible.Trigger>Collapse Me</Collapsible.Trigger>
  <Collapsible.Content>
    <p>Visible by default.</p>
  </Collapsible.Content>
</Collapsible.Root>
);

export const collapsibleExamples: Example[] = [
    {
        name: 'basic',
        description: 'basic example',
        component: BasicExample,
        source: `<Collapsible.Root>
  <Collapsible.Trigger>Toggle Content</Collapsible.Trigger>
  <Collapsible.Content>
    <p>Hidden content revealed on click.</p>
  </Collapsible.Content>
</Collapsible.Root>`,
    },
    {
        name: 'defaultOpen',
        description: 'defaultOpen example',
        component: DefaultOpenExample,
        source: `<Collapsible.Root defaultOpen>
  <Collapsible.Trigger>Collapse Me</Collapsible.Trigger>
  <Collapsible.Content>
    <p>Visible by default.</p>
  </Collapsible.Content>
</Collapsible.Root>`,
    },
];
