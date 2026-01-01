/**
 * Switch Component Examples
 * AUTO-GENERATED from specifications/primitives/switch.sudo.md
 * DO NOT EDIT MANUALLY
 */
import { Component } from 'solid-js';
import { Switch } from '@rubigo/components/switch';

export interface Example {
    name: string;
    description: string;
    component: Component;
    source: string;
}

const BasicExample: Component = () => (
<Switch onChange={(on) => console.log(on)}>
  Dark Mode
</Switch>
);

const CheckedExample: Component = () => (
<Switch checked>
  Enabled Feature
</Switch>
);

const DisabledExample: Component = () => (
<Switch disabled>
  Locked Setting
</Switch>
);

export const switchExamples: Example[] = [
    {
        name: 'basic',
        description: 'basic example',
        component: BasicExample,
        source: `<Switch onChange={(on) => console.log(on)}>
  Dark Mode
</Switch>`,
    },
    {
        name: 'checked',
        description: 'checked example',
        component: CheckedExample,
        source: `<Switch checked>
  Enabled Feature
</Switch>`,
    },
    {
        name: 'disabled',
        description: 'disabled example',
        component: DisabledExample,
        source: `<Switch disabled>
  Locked Setting
</Switch>`,
    },
];
