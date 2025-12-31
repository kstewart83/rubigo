/**
 * Checkbox Component Examples
 * AUTO-GENERATED from specifications/primitives/checkbox.sudo.md
 * DO NOT EDIT MANUALLY
 */
import { Component } from 'solid-js';
import { Checkbox } from '@rubigo/components/checkbox';

export interface Example {
    name: string;
    description: string;
    component: Component;
    source: string;
}

const BasicExample: Component = () => (
<Checkbox onChange={(checked) => console.log(checked)}>
  Accept Terms
</Checkbox>
);

const CheckedExample: Component = () => (
<Checkbox checked>
  Pre-selected
</Checkbox>
);

const DisabledExample: Component = () => (
<Checkbox disabled>
  Cannot Change
</Checkbox>
);

export const checkboxExamples: Example[] = [
    {
        name: 'basic',
        description: 'basic example',
        component: BasicExample,
        source: `<Checkbox onChange={(checked) => console.log(checked)}>
  Accept Terms
</Checkbox>`,
    },
    {
        name: 'checked',
        description: 'checked example',
        component: CheckedExample,
        source: `<Checkbox checked>
  Pre-selected
</Checkbox>`,
    },
    {
        name: 'disabled',
        description: 'disabled example',
        component: DisabledExample,
        source: `<Checkbox disabled>
  Cannot Change
</Checkbox>`,
    },
];
