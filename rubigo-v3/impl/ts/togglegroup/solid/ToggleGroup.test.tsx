/**
 * ToggleGroup Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { ToggleGroup } from './ToggleGroup';

describe('ToggleGroup', () => {
    describe('rendering', () => {
        it('renders with radiogroup role', () => {
            const { getByRole } = render(() => (
                <ToggleGroup.Root defaultValue="a">
                    <ToggleGroup.Item value="a">A</ToggleGroup.Item>
                    <ToggleGroup.Item value="b">B</ToggleGroup.Item>
                </ToggleGroup.Root>
            ));

            expect(getByRole('radiogroup')).toBeDefined();
        });

        it('renders items with radio role', () => {
            const { getAllByRole } = render(() => (
                <ToggleGroup.Root defaultValue="a">
                    <ToggleGroup.Item value="a">A</ToggleGroup.Item>
                    <ToggleGroup.Item value="b">B</ToggleGroup.Item>
                </ToggleGroup.Root>
            ));

            const radios = getAllByRole('radio');
            expect(radios).toHaveLength(2);
        });

        it('marks default value as selected', () => {
            const { getByText } = render(() => (
                <ToggleGroup.Root defaultValue="a">
                    <ToggleGroup.Item value="a">A</ToggleGroup.Item>
                    <ToggleGroup.Item value="b">B</ToggleGroup.Item>
                </ToggleGroup.Root>
            ));

            expect(getByText('A').getAttribute('aria-checked')).toBe('true');
            expect(getByText('B').getAttribute('aria-checked')).toBe('false');
        });
    });

    describe('selection', () => {
        it('selects item on click', async () => {
            const onValueChange = vi.fn();
            const { getByText } = render(() => (
                <ToggleGroup.Root defaultValue="a" onValueChange={onValueChange}>
                    <ToggleGroup.Item value="a">A</ToggleGroup.Item>
                    <ToggleGroup.Item value="b">B</ToggleGroup.Item>
                </ToggleGroup.Root>
            ));

            await fireEvent.click(getByText('B'));

            expect(onValueChange).toHaveBeenCalledWith('b');
            expect(getByText('B').getAttribute('aria-checked')).toBe('true');
        });

        it('does not call onValueChange for same value', async () => {
            const onValueChange = vi.fn();
            const { getByText } = render(() => (
                <ToggleGroup.Root defaultValue="a" onValueChange={onValueChange}>
                    <ToggleGroup.Item value="a">A</ToggleGroup.Item>
                    <ToggleGroup.Item value="b">B</ToggleGroup.Item>
                </ToggleGroup.Root>
            ));

            await fireEvent.click(getByText('A'));

            expect(onValueChange).not.toHaveBeenCalled();
        });
    });

    describe('keyboard navigation', () => {
        it('navigates with arrow right', async () => {
            const onValueChange = vi.fn();
            const { getByText } = render(() => (
                <ToggleGroup.Root defaultValue="a" onValueChange={onValueChange}>
                    <ToggleGroup.Item value="a">A</ToggleGroup.Item>
                    <ToggleGroup.Item value="b">B</ToggleGroup.Item>
                </ToggleGroup.Root>
            ));

            await fireEvent.keyDown(getByText('A'), { key: 'ArrowRight' });

            expect(onValueChange).toHaveBeenCalledWith('b');
        });

        it('navigates with arrow left and wraps', async () => {
            const onValueChange = vi.fn();
            const { getByText } = render(() => (
                <ToggleGroup.Root defaultValue="a" onValueChange={onValueChange}>
                    <ToggleGroup.Item value="a">A</ToggleGroup.Item>
                    <ToggleGroup.Item value="b">B</ToggleGroup.Item>
                </ToggleGroup.Root>
            ));

            await fireEvent.keyDown(getByText('A'), { key: 'ArrowLeft' });

            expect(onValueChange).toHaveBeenCalledWith('b');
        });
    });

    describe('accessibility', () => {
        it('uses roving tabindex', () => {
            const { getByText } = render(() => (
                <ToggleGroup.Root defaultValue="a">
                    <ToggleGroup.Item value="a">A</ToggleGroup.Item>
                    <ToggleGroup.Item value="b">B</ToggleGroup.Item>
                </ToggleGroup.Root>
            ));

            expect(getByText('A').getAttribute('tabindex')).toBe('0');
            expect(getByText('B').getAttribute('tabindex')).toBe('-1');
        });
    });

    describe('disabled state', () => {
        it('blocks selection when group is disabled', async () => {
            const onValueChange = vi.fn();
            const { getByText } = render(() => (
                <ToggleGroup.Root defaultValue="a" disabled onValueChange={onValueChange}>
                    <ToggleGroup.Item value="a">A</ToggleGroup.Item>
                    <ToggleGroup.Item value="b">B</ToggleGroup.Item>
                </ToggleGroup.Root>
            ));

            await fireEvent.click(getByText('B'));

            expect(onValueChange).not.toHaveBeenCalled();
        });

        it('has aria-disabled on group', () => {
            const { getByRole } = render(() => (
                <ToggleGroup.Root defaultValue="a" disabled>
                    <ToggleGroup.Item value="a">A</ToggleGroup.Item>
                </ToggleGroup.Root>
            ));

            expect(getByRole('radiogroup').getAttribute('aria-disabled')).toBe('true');
        });
    });

    describe('controlled mode', () => {
        it('syncs with controlled value', async () => {
            const [value, setValue] = createSignal('a');
            const { getByText } = render(() => (
                <ToggleGroup.Root value={value()} onValueChange={setValue}>
                    <ToggleGroup.Item value="a">A</ToggleGroup.Item>
                    <ToggleGroup.Item value="b">B</ToggleGroup.Item>
                </ToggleGroup.Root>
            ));

            expect(getByText('A').getAttribute('aria-checked')).toBe('true');

            await fireEvent.click(getByText('B'));

            expect(value()).toBe('b');
        });
    });
});
