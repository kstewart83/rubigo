/**
 * Tabs Component Examples
 * AUTO-GENERATED from specifications/primitives/tabs.sudo.md
 * DO NOT EDIT MANUALLY
 */
import { Component } from 'solid-js';
import { Tabs } from '@rubigo/components/tabs';

export interface Example {
    name: string;
    description: string;
    component: Component;
    source: string;
}

const BasicExample: Component = () => (
<Tabs.Root defaultValue="account">
  <Tabs.List>
    <Tabs.Tab value="account">Account</Tabs.Tab>
    <Tabs.Tab value="settings">Settings</Tabs.Tab>
    <Tabs.Tab value="billing">Billing</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="account">
    <p>Manage your account settings and preferences.</p>
  </Tabs.Panel>
  <Tabs.Panel value="settings">
    <p>Configure application settings.</p>
  </Tabs.Panel>
  <Tabs.Panel value="billing">
    <p>View billing history and payment methods.</p>
  </Tabs.Panel>
</Tabs.Root>
);

const DisabledExample: Component = () => (
<Tabs.Root defaultValue="active">
  <Tabs.List>
    <Tabs.Tab value="active">Active Tab</Tabs.Tab>
    <Tabs.Tab value="disabled" disabled>Disabled Tab</Tabs.Tab>
    <Tabs.Tab value="another">Another Tab</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="active">
    <p>This tab is active and clickable.</p>
  </Tabs.Panel>
  <Tabs.Panel value="disabled">
    <p>This content is inaccessible.</p>
  </Tabs.Panel>
  <Tabs.Panel value="another">
    <p>Another active tab content.</p>
  </Tabs.Panel>
</Tabs.Root>
);

export const tabsExamples: Example[] = [
    {
        name: 'basic',
        description: 'basic example',
        component: BasicExample,
        source: `<Tabs.Root defaultValue="account">
  <Tabs.List>
    <Tabs.Tab value="account">Account</Tabs.Tab>
    <Tabs.Tab value="settings">Settings</Tabs.Tab>
    <Tabs.Tab value="billing">Billing</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="account">
    <p>Manage your account settings and preferences.</p>
  </Tabs.Panel>
  <Tabs.Panel value="settings">
    <p>Configure application settings.</p>
  </Tabs.Panel>
  <Tabs.Panel value="billing">
    <p>View billing history and payment methods.</p>
  </Tabs.Panel>
</Tabs.Root>`,
    },
    {
        name: 'disabled',
        description: 'disabled example',
        component: DisabledExample,
        source: `<Tabs.Root defaultValue="active">
  <Tabs.List>
    <Tabs.Tab value="active">Active Tab</Tabs.Tab>
    <Tabs.Tab value="disabled" disabled>Disabled Tab</Tabs.Tab>
    <Tabs.Tab value="another">Another Tab</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="active">
    <p>This tab is active and clickable.</p>
  </Tabs.Panel>
  <Tabs.Panel value="disabled">
    <p>This content is inaccessible.</p>
  </Tabs.Panel>
  <Tabs.Panel value="another">
    <p>Another active tab content.</p>
  </Tabs.Panel>
</Tabs.Root>`,
    },
];
