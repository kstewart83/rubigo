/**
 * Dialog Component Tests
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, screen, cleanup } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { Dialog } from './Dialog';

// Clean up Portal content after each test
afterEach(() => {
    cleanup();
    // Remove any portaled content
    document.body.innerHTML = '';
});

describe('Dialog', () => {
    describe('rendering', () => {
        it('renders trigger button', () => {
            const { getByText } = render(() => (
                <Dialog.Root>
                    <Dialog.Trigger>Open Dialog</Dialog.Trigger>
                    <Dialog.Portal>
                        <Dialog.Overlay />
                        <Dialog.Content>Content</Dialog.Content>
                    </Dialog.Portal>
                </Dialog.Root>
            ));

            expect(getByText('Open Dialog')).toBeDefined();
        });

        it('hides dialog by default', () => {
            render(() => (
                <Dialog.Root>
                    <Dialog.Trigger>Open Dialog</Dialog.Trigger>
                    <Dialog.Portal>
                        <Dialog.Overlay />
                        <Dialog.Content>Content</Dialog.Content>
                    </Dialog.Portal>
                </Dialog.Root>
            ));

            expect(screen.queryByRole('dialog')).toBeNull();
        });

        it('shows dialog when defaultOpen is true', () => {
            render(() => (
                <Dialog.Root defaultOpen>
                    <Dialog.Trigger>Open Dialog</Dialog.Trigger>
                    <Dialog.Portal>
                        <Dialog.Overlay />
                        <Dialog.Content>Content</Dialog.Content>
                    </Dialog.Portal>
                </Dialog.Root>
            ));

            expect(screen.getByRole('dialog')).toBeDefined();
        });
    });

    describe('interactions', () => {
        it('opens on trigger click', async () => {
            const { getByText } = render(() => (
                <Dialog.Root>
                    <Dialog.Trigger>Open Dialog</Dialog.Trigger>
                    <Dialog.Portal>
                        <Dialog.Overlay />
                        <Dialog.Content>Content</Dialog.Content>
                    </Dialog.Portal>
                </Dialog.Root>
            ));

            await fireEvent.click(getByText('Open Dialog'));

            expect(screen.getByRole('dialog')).toBeDefined();
        });

        it('closes on close button', async () => {
            render(() => (
                <Dialog.Root defaultOpen>
                    <Dialog.Trigger>Open Dialog</Dialog.Trigger>
                    <Dialog.Portal>
                        <Dialog.Overlay />
                        <Dialog.Content>
                            <Dialog.Close />
                            Content
                        </Dialog.Content>
                    </Dialog.Portal>
                </Dialog.Root>
            ));

            expect(screen.getByRole('dialog')).toBeDefined();

            await fireEvent.click(screen.getByLabelText('Close'));

            expect(screen.queryByRole('dialog')).toBeNull();
        });

        it('closes on Escape', async () => {
            render(() => (
                <Dialog.Root defaultOpen>
                    <Dialog.Trigger>Open Dialog</Dialog.Trigger>
                    <Dialog.Portal>
                        <Dialog.Overlay />
                        <Dialog.Content>Content</Dialog.Content>
                    </Dialog.Portal>
                </Dialog.Root>
            ));

            expect(screen.getByRole('dialog')).toBeDefined();

            await fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

            expect(screen.queryByRole('dialog')).toBeNull();
        });
    });

    describe('accessibility', () => {
        it('has dialog role', () => {
            render(() => (
                <Dialog.Root defaultOpen>
                    <Dialog.Trigger>Open Dialog</Dialog.Trigger>
                    <Dialog.Portal>
                        <Dialog.Overlay />
                        <Dialog.Content>Content</Dialog.Content>
                    </Dialog.Portal>
                </Dialog.Root>
            ));

            expect(screen.getByRole('dialog')).toBeDefined();
        });

        it('has aria-modal', () => {
            render(() => (
                <Dialog.Root defaultOpen>
                    <Dialog.Trigger>Open Dialog</Dialog.Trigger>
                    <Dialog.Portal>
                        <Dialog.Overlay />
                        <Dialog.Content>Content</Dialog.Content>
                    </Dialog.Portal>
                </Dialog.Root>
            ));

            expect(screen.getByRole('dialog').getAttribute('aria-modal')).toBe('true');
        });

        it('trigger has aria-haspopup and aria-expanded', async () => {
            const { getByText } = render(() => (
                <Dialog.Root>
                    <Dialog.Trigger>Open Dialog</Dialog.Trigger>
                    <Dialog.Portal>
                        <Dialog.Overlay />
                        <Dialog.Content>Content</Dialog.Content>
                    </Dialog.Portal>
                </Dialog.Root>
            ));

            const trigger = getByText('Open Dialog');
            expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
            expect(trigger.getAttribute('aria-expanded')).toBe('false');

            await fireEvent.click(trigger);

            expect(trigger.getAttribute('aria-expanded')).toBe('true');
        });
    });

    describe('callbacks', () => {
        it('calls onOpenChange when opening', async () => {
            const onOpenChange = vi.fn();
            const { getByText } = render(() => (
                <Dialog.Root onOpenChange={onOpenChange}>
                    <Dialog.Trigger>Open Dialog</Dialog.Trigger>
                    <Dialog.Portal>
                        <Dialog.Overlay />
                        <Dialog.Content>Content</Dialog.Content>
                    </Dialog.Portal>
                </Dialog.Root>
            ));

            await fireEvent.click(getByText('Open Dialog'));

            expect(onOpenChange).toHaveBeenCalledWith(true);
        });
    });

    describe('controlled mode', () => {
        it('syncs with controlled open prop', () => {
            const [open, setOpen] = createSignal(true);
            render(() => (
                <Dialog.Root open={open()} onOpenChange={setOpen}>
                    <Dialog.Trigger>Open Dialog</Dialog.Trigger>
                    <Dialog.Portal>
                        <Dialog.Overlay />
                        <Dialog.Content>Content</Dialog.Content>
                    </Dialog.Portal>
                </Dialog.Root>
            ));

            expect(screen.getByRole('dialog')).toBeDefined();
        });
    });
});
