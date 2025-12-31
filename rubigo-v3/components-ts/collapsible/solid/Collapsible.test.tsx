/**
 * Collapsible Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { Collapsible } from './Collapsible';

describe('Collapsible', () => {
    describe('rendering', () => {
        it('renders trigger and content', () => {
            const { getByText } = render(() => (
                <Collapsible.Root>
                    <Collapsible.Trigger>Toggle</Collapsible.Trigger>
                    <Collapsible.Content>Content</Collapsible.Content>
                </Collapsible.Root>
            ));

            expect(getByText('Toggle')).toBeDefined();
        });

        it('hides content by default', () => {
            const { getByText } = render(() => (
                <Collapsible.Root>
                    <Collapsible.Trigger>Toggle</Collapsible.Trigger>
                    <Collapsible.Content>Content</Collapsible.Content>
                </Collapsible.Root>
            ));

            const content = getByText('Content').closest('[aria-hidden]');
            expect(content?.getAttribute('aria-hidden')).toBe('true');
        });

        it('shows content when defaultOpen is true', () => {
            const { getByText } = render(() => (
                <Collapsible.Root defaultOpen>
                    <Collapsible.Trigger>Toggle</Collapsible.Trigger>
                    <Collapsible.Content>Content</Collapsible.Content>
                </Collapsible.Root>
            ));

            const content = getByText('Content').closest('[aria-hidden]');
            expect(content?.getAttribute('aria-hidden')).toBe('false');
        });
    });

    describe('interactions', () => {
        it('toggles on click', async () => {
            const { getByText } = render(() => (
                <Collapsible.Root>
                    <Collapsible.Trigger>Toggle</Collapsible.Trigger>
                    <Collapsible.Content>Content</Collapsible.Content>
                </Collapsible.Root>
            ));

            const trigger = getByText('Toggle');
            expect(trigger.getAttribute('aria-expanded')).toBe('false');

            await fireEvent.click(trigger);

            expect(trigger.getAttribute('aria-expanded')).toBe('true');
        });

        it('calls onOpenChange', async () => {
            const onOpenChange = vi.fn();
            const { getByText } = render(() => (
                <Collapsible.Root onOpenChange={onOpenChange}>
                    <Collapsible.Trigger>Toggle</Collapsible.Trigger>
                    <Collapsible.Content>Content</Collapsible.Content>
                </Collapsible.Root>
            ));

            await fireEvent.click(getByText('Toggle'));

            expect(onOpenChange).toHaveBeenCalledWith(true);
        });

        it('toggles on Enter key', async () => {
            const { getByText } = render(() => (
                <Collapsible.Root>
                    <Collapsible.Trigger>Toggle</Collapsible.Trigger>
                    <Collapsible.Content>Content</Collapsible.Content>
                </Collapsible.Root>
            ));

            const trigger = getByText('Toggle');
            await fireEvent.keyDown(trigger, { key: 'Enter' });

            expect(trigger.getAttribute('aria-expanded')).toBe('true');
        });

        it('toggles on Space key', async () => {
            const { getByText } = render(() => (
                <Collapsible.Root>
                    <Collapsible.Trigger>Toggle</Collapsible.Trigger>
                    <Collapsible.Content>Content</Collapsible.Content>
                </Collapsible.Root>
            ));

            const trigger = getByText('Toggle');
            await fireEvent.keyDown(trigger, { key: ' ' });

            expect(trigger.getAttribute('aria-expanded')).toBe('true');
        });
    });

    describe('disabled state', () => {
        it('blocks interactions when disabled', async () => {
            const onOpenChange = vi.fn();
            const { getByText } = render(() => (
                <Collapsible.Root disabled onOpenChange={onOpenChange}>
                    <Collapsible.Trigger>Toggle</Collapsible.Trigger>
                    <Collapsible.Content>Content</Collapsible.Content>
                </Collapsible.Root>
            ));

            await fireEvent.click(getByText('Toggle'));

            expect(onOpenChange).not.toHaveBeenCalled();
        });

        it('has aria-disabled on trigger', () => {
            const { getByText } = render(() => (
                <Collapsible.Root disabled>
                    <Collapsible.Trigger>Toggle</Collapsible.Trigger>
                    <Collapsible.Content>Content</Collapsible.Content>
                </Collapsible.Root>
            ));

            expect(getByText('Toggle').getAttribute('aria-disabled')).toBe('true');
        });
    });

    describe('controlled mode', () => {
        it('syncs with controlled open prop', async () => {
            const [open, setOpen] = createSignal(false);
            const { getByText } = render(() => (
                <Collapsible.Root open={open()} onOpenChange={setOpen}>
                    <Collapsible.Trigger>Toggle</Collapsible.Trigger>
                    <Collapsible.Content>Content</Collapsible.Content>
                </Collapsible.Root>
            ));

            expect(getByText('Toggle').getAttribute('aria-expanded')).toBe('false');

            await fireEvent.click(getByText('Toggle'));

            expect(open()).toBe(true);
        });
    });

    describe('accessibility', () => {
        it('has correct aria-expanded on trigger', () => {
            const { getByText } = render(() => (
                <Collapsible.Root defaultOpen>
                    <Collapsible.Trigger>Toggle</Collapsible.Trigger>
                    <Collapsible.Content>Content</Collapsible.Content>
                </Collapsible.Root>
            ));

            expect(getByText('Toggle').getAttribute('aria-expanded')).toBe('true');
        });

        it('has correct aria-hidden on content', () => {
            const { getByText } = render(() => (
                <Collapsible.Root>
                    <Collapsible.Trigger>Toggle</Collapsible.Trigger>
                    <Collapsible.Content>Content</Collapsible.Content>
                </Collapsible.Root>
            ));

            const content = getByText('Content').closest('[aria-hidden]');
            expect(content?.getAttribute('aria-hidden')).toBe('true');
        });
    });
});
