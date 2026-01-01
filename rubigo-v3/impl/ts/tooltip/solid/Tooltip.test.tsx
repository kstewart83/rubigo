/**
 * Tooltip Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@solidjs/testing-library';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
    describe('rendering', () => {
        it('renders trigger', () => {
            const { getByText } = render(() => (
                <Tooltip.Root>
                    <Tooltip.Trigger>Hover me</Tooltip.Trigger>
                    <Tooltip.Content>Tooltip text</Tooltip.Content>
                </Tooltip.Root>
            ));

            expect(getByText('Hover me')).toBeDefined();
        });

        it('hides content by default', () => {
            const { queryByRole } = render(() => (
                <Tooltip.Root>
                    <Tooltip.Trigger>Hover me</Tooltip.Trigger>
                    <Tooltip.Content>Tooltip text</Tooltip.Content>
                </Tooltip.Root>
            ));

            expect(queryByRole('tooltip')).toBeNull();
        });
    });

    describe('interactions', () => {
        it('shows on focus', async () => {
            const { getByText, getByRole } = render(() => (
                <Tooltip.Root>
                    <Tooltip.Trigger>Hover me</Tooltip.Trigger>
                    <Tooltip.Content>Tooltip text</Tooltip.Content>
                </Tooltip.Root>
            ));

            await fireEvent.focus(getByText('Hover me'));

            expect(getByRole('tooltip')).toBeDefined();
            expect(getByText('Tooltip text')).toBeDefined();
        });

        it('hides on blur', async () => {
            vi.useFakeTimers();
            const { getByText, queryByRole } = render(() => (
                <Tooltip.Root>
                    <Tooltip.Trigger>Hover me</Tooltip.Trigger>
                    <Tooltip.Content>Tooltip text</Tooltip.Content>
                </Tooltip.Root>
            ));

            await fireEvent.focus(getByText('Hover me'));
            expect(queryByRole('tooltip')).toBeDefined();

            await fireEvent.blur(getByText('Hover me'));
            vi.advanceTimersByTime(150);

            expect(queryByRole('tooltip')).toBeNull();
            vi.useRealTimers();
        });

        it('hides on Escape', async () => {
            const { getByText, queryByRole } = render(() => (
                <Tooltip.Root>
                    <Tooltip.Trigger>Hover me</Tooltip.Trigger>
                    <Tooltip.Content>Tooltip text</Tooltip.Content>
                </Tooltip.Root>
            ));

            await fireEvent.focus(getByText('Hover me'));
            expect(queryByRole('tooltip')).toBeDefined();

            await fireEvent.keyDown(getByText('Hover me'), { key: 'Escape' });

            expect(queryByRole('tooltip')).toBeNull();
        });
    });

    describe('accessibility', () => {
        it('has tooltip role on content', async () => {
            const { getByText, getByRole } = render(() => (
                <Tooltip.Root>
                    <Tooltip.Trigger>Hover me</Tooltip.Trigger>
                    <Tooltip.Content>Tooltip text</Tooltip.Content>
                </Tooltip.Root>
            ));

            await fireEvent.focus(getByText('Hover me'));

            expect(getByRole('tooltip')).toBeDefined();
        });

        it('links trigger to tooltip via aria-describedby', async () => {
            const { getByText } = render(() => (
                <Tooltip.Root>
                    <Tooltip.Trigger>Hover me</Tooltip.Trigger>
                    <Tooltip.Content>Tooltip text</Tooltip.Content>
                </Tooltip.Root>
            ));

            const trigger = getByText('Hover me');
            expect(trigger.getAttribute('aria-describedby')).toBeNull();

            await fireEvent.focus(trigger);

            expect(trigger.getAttribute('aria-describedby')).toMatch(/tooltip-\d+/);
        });
    });

    describe('callbacks', () => {
        it('calls onOpenChange when opening', async () => {
            const onOpenChange = vi.fn();
            const { getByText } = render(() => (
                <Tooltip.Root onOpenChange={onOpenChange}>
                    <Tooltip.Trigger>Hover me</Tooltip.Trigger>
                    <Tooltip.Content>Tooltip text</Tooltip.Content>
                </Tooltip.Root>
            ));

            await fireEvent.focus(getByText('Hover me'));

            expect(onOpenChange).toHaveBeenCalledWith(true);
        });
    });

    describe('disabled state', () => {
        it('does not show when disabled', async () => {
            const { getByText, queryByRole } = render(() => (
                <Tooltip.Root disabled>
                    <Tooltip.Trigger>Hover me</Tooltip.Trigger>
                    <Tooltip.Content>Tooltip text</Tooltip.Content>
                </Tooltip.Root>
            ));

            await fireEvent.focus(getByText('Hover me'));

            expect(queryByRole('tooltip')).toBeNull();
        });
    });
});
