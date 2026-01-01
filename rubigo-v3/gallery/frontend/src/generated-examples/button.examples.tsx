/**
 * Button Component Examples
 * AUTO-GENERATED from specifications/primitives/button.sudo.md
 * DO NOT EDIT MANUALLY
 */
import { Component } from 'solid-js';
import { Button } from '@rubigo/components/button';

export interface Example {
    name: string;
    description: string;
    component: Component;
    source: string;
}

const BasicExample: Component = () => (
<Button onClick={() => console.log('clicked')}>
  Click Me
</Button>
);

const VariantsExample: Component = () => (
<>
  <Button variant="primary">Primary</Button>
  <Button variant="secondary">Secondary</Button>
  <Button variant="destructive">Delete</Button>
</>
);

const DisabledExample: Component = () => (
<Button disabled>
  Cannot Click
</Button>
);

export const buttonExamples: Example[] = [
    {
        name: 'basic',
        description: 'basic example',
        component: BasicExample,
        source: `<Button onClick={() => console.log('clicked')}>
  Click Me
</Button>`,
    },
    {
        name: 'variants',
        description: 'variants example',
        component: VariantsExample,
        source: `<>
  <Button variant="primary">Primary</Button>
  <Button variant="secondary">Secondary</Button>
  <Button variant="destructive">Delete</Button>
</>`,
    },
    {
        name: 'disabled',
        description: 'disabled example',
        component: DisabledExample,
        source: `<Button disabled>
  Cannot Click
</Button>`,
    },
];
