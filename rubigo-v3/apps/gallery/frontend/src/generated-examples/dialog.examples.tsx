/**
 * Dialog Component Examples
 * AUTO-GENERATED from specifications/primitives/dialog.sudo.md
 * DO NOT EDIT MANUALLY
 */
import { Component } from 'solid-js';
import { Dialog } from '@rubigo/components/dialog';
import { Button } from '@rubigo/components/button';

export interface Example {
    name: string;
    description: string;
    component: Component;
    source: string;
}

const BasicExample: Component = () => (
<Dialog.Root>
  <Dialog.Trigger>Open Dialog</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Title>Confirm Action</Dialog.Title>
      <Dialog.Description>Are you sure you want to proceed?</Dialog.Description>
      <Dialog.Close>Close</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
);

const InfoExample: Component = () => (
<Dialog.Root>
  <Dialog.Trigger>View Details</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Title>Information</Dialog.Title>
      <Dialog.Description>This is helpful information.</Dialog.Description>
      <Dialog.Close>Got it</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
);

export const dialogExamples: Example[] = [
    {
        name: 'basic',
        description: 'basic example',
        component: BasicExample,
        source: `<Dialog.Root>
  <Dialog.Trigger>Open Dialog</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Title>Confirm Action</Dialog.Title>
      <Dialog.Description>Are you sure you want to proceed?</Dialog.Description>
      <Dialog.Close>Close</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>`,
    },
    {
        name: 'info',
        description: 'info example',
        component: InfoExample,
        source: `<Dialog.Root>
  <Dialog.Trigger>View Details</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Title>Information</Dialog.Title>
      <Dialog.Description>This is helpful information.</Dialog.Description>
      <Dialog.Close>Got it</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>`,
    },
];
