/**
 * Select Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { Select } from './Select';

describe('Select', () => {
    describe('rendering', () => {
        it('renders trigger with combobox role', () => {
            const { getByRole } = render(() => (
                <Select.Root>
                    <Select.Trigger placeholder="Choose..." />
                    <Select.Content>
                        <Select.Item value="a">Option A</Select.Item>
                        <Select.Item value="b">Option B</Select.Item>
                    </Select.Content>
                </Select.Root>
            ));

            expect(getByRole('combobox')).toBeDefined();
        });

        it('shows placeholder', () => {
            const { getByText } = render(() => (
                <Select.Root>
                    <Select.Trigger placeholder="Choose an option" />
                    <Select.Content>
                        <Select.Item value="a">Option A</Select.Item>
                    </Select.Content>
                </Select.Root>
            ));

            expect(getByText('Choose an option')).toBeDefined();
        });

        it('hides dropdown by default', () => {
            const { queryByRole } = render(() => (
                <Select.Root>
                    <Select.Trigger />
                    <Select.Content>
                        <Select.Item value="a">Option A</Select.Item>
                    </Select.Content>
                </Select.Root>
            ));

            expect(queryByRole('listbox')).toBeNull();
        });
    });

    describe('interactions', () => {
        it('opens on click', async () => {
            const { getByRole } = render(() => (
                <Select.Root>
                    <Select.Trigger />
                    <Select.Content>
                        <Select.Item value="a">Option A</Select.Item>
                    </Select.Content>
                </Select.Root>
            ));

            await fireEvent.click(getByRole('combobox'));

            expect(getByRole('listbox')).toBeDefined();
        });

        it('selects option on click', async () => {
            const onValueChange = vi.fn();
            const { getByRole, getByText, queryByRole } = render(() => (
                <Select.Root onValueChange={onValueChange}>
                    <Select.Trigger />
                    <Select.Content>
                        <Select.Item value="a">Option A</Select.Item>
                        <Select.Item value="b">Option B</Select.Item>
                    </Select.Content>
                </Select.Root>
            ));

            await fireEvent.click(getByRole('combobox'));
            await fireEvent.click(getByText('Option B'));

            expect(onValueChange).toHaveBeenCalledWith('b');
            expect(queryByRole('listbox')).toBeNull();
        });

        it('closes on Escape', async () => {
            const { getByRole, queryByRole } = render(() => (
                <Select.Root>
                    <Select.Trigger />
                    <Select.Content>
                        <Select.Item value="a">Option A</Select.Item>
                    </Select.Content>
                </Select.Root>
            ));

            await fireEvent.click(getByRole('combobox'));
            expect(getByRole('listbox')).toBeDefined();

            await fireEvent.keyDown(getByRole('combobox'), { key: 'Escape' });

            expect(queryByRole('listbox')).toBeNull();
        });
    });

    describe('keyboard navigation', () => {
        it('opens with ArrowDown', async () => {
            const { getByRole } = render(() => (
                <Select.Root>
                    <Select.Trigger />
                    <Select.Content>
                        <Select.Item value="a">Option A</Select.Item>
                    </Select.Content>
                </Select.Root>
            ));

            await fireEvent.keyDown(getByRole('combobox'), { key: 'ArrowDown' });

            expect(getByRole('listbox')).toBeDefined();
        });

        it('navigates with arrow keys', async () => {
            const onValueChange = vi.fn();
            const { getByRole } = render(() => (
                <Select.Root onValueChange={onValueChange}>
                    <Select.Trigger />
                    <Select.Content>
                        <Select.Item value="a">Option A</Select.Item>
                        <Select.Item value="b">Option B</Select.Item>
                    </Select.Content>
                </Select.Root>
            ));

            await fireEvent.keyDown(getByRole('combobox'), { key: 'ArrowDown' });
            await fireEvent.keyDown(getByRole('combobox'), { key: 'ArrowDown' });
            await fireEvent.keyDown(getByRole('combobox'), { key: 'Enter' });

            expect(onValueChange).toHaveBeenCalledWith('b');
        });
    });

    describe('accessibility', () => {
        it('has correct aria attributes on trigger', async () => {
            const { getByRole } = render(() => (
                <Select.Root>
                    <Select.Trigger />
                    <Select.Content>
                        <Select.Item value="a">Option A</Select.Item>
                    </Select.Content>
                </Select.Root>
            ));

            const trigger = getByRole('combobox');
            expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
            expect(trigger.getAttribute('aria-expanded')).toBe('false');

            await fireEvent.click(trigger);

            expect(trigger.getAttribute('aria-expanded')).toBe('true');
        });

        it('options have correct role', async () => {
            const { getByRole, getAllByRole } = render(() => (
                <Select.Root>
                    <Select.Trigger />
                    <Select.Content>
                        <Select.Item value="a">Option A</Select.Item>
                        <Select.Item value="b">Option B</Select.Item>
                    </Select.Content>
                </Select.Root>
            ));

            await fireEvent.click(getByRole('combobox'));

            const options = getAllByRole('option');
            expect(options).toHaveLength(2);
        });

        it('marks selected option with aria-selected', async () => {
            const { getByRole, getByText } = render(() => (
                <Select.Root defaultValue="a">
                    <Select.Trigger />
                    <Select.Content>
                        <Select.Item value="a">Option A</Select.Item>
                        <Select.Item value="b">Option B</Select.Item>
                    </Select.Content>
                </Select.Root>
            ));

            await fireEvent.click(getByRole('combobox'));

            expect(getByText('Option A').getAttribute('aria-selected')).toBe('true');
            expect(getByText('Option B').getAttribute('aria-selected')).toBe('false');
        });
    });

    describe('disabled state', () => {
        it('blocks opening when disabled', async () => {
            const { getByRole, queryByRole } = render(() => (
                <Select.Root disabled>
                    <Select.Trigger />
                    <Select.Content>
                        <Select.Item value="a">Option A</Select.Item>
                    </Select.Content>
                </Select.Root>
            ));

            await fireEvent.click(getByRole('combobox'));

            expect(queryByRole('listbox')).toBeNull();
        });

        it('has aria-disabled', () => {
            const { getByRole } = render(() => (
                <Select.Root disabled>
                    <Select.Trigger />
                    <Select.Content>
                        <Select.Item value="a">Option A</Select.Item>
                    </Select.Content>
                </Select.Root>
            ));

            expect(getByRole('combobox').getAttribute('aria-disabled')).toBe('true');
        });
    });

    describe('controlled mode', () => {
        it('syncs with controlled value', () => {
            const [value, setValue] = createSignal('a');
            const { getByText } = render(() => (
                <Select.Root value={value()} onValueChange={setValue}>
                    <Select.Trigger>
                        <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                        <Select.Item value="a">Option A</Select.Item>
                        <Select.Item value="b">Option B</Select.Item>
                    </Select.Content>
                </Select.Root>
            ));

            expect(getByText('a')).toBeDefined();
        });
    });
});
