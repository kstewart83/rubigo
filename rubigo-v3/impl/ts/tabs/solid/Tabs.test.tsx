/**
 * Tabs Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { Tabs } from './Tabs';

describe('Tabs', () => {
    // === Rendering Tests ===
    describe('rendering', () => {
        it('renders tabs with tablist role', () => {
            const { getByRole } = render(() => (
                <Tabs.Root defaultValue="tab1">
                    <Tabs.List>
                        <Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
                        <Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
                    </Tabs.List>
                    <Tabs.Panel value="tab1">Content 1</Tabs.Panel>
                    <Tabs.Panel value="tab2">Content 2</Tabs.Panel>
                </Tabs.Root>
            ));

            expect(getByRole('tablist')).toBeDefined();
        });

        it('renders tabs with correct roles', () => {
            const { getAllByRole } = render(() => (
                <Tabs.Root defaultValue="tab1">
                    <Tabs.List>
                        <Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
                        <Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
                    </Tabs.List>
                    <Tabs.Panel value="tab1">Content 1</Tabs.Panel>
                    <Tabs.Panel value="tab2">Content 2</Tabs.Panel>
                </Tabs.Root>
            ));

            const tabs = getAllByRole('tab');
            expect(tabs).toHaveLength(2);
        });

        it('shows first panel by default', () => {
            const { getByText, queryByText } = render(() => (
                <Tabs.Root defaultValue="tab1">
                    <Tabs.List>
                        <Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
                        <Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
                    </Tabs.List>
                    <Tabs.Panel value="tab1">Content 1</Tabs.Panel>
                    <Tabs.Panel value="tab2">Content 2</Tabs.Panel>
                </Tabs.Root>
            ));

            expect(getByText('Content 1')).toBeDefined();
            // Content 2 panel should be hidden via style.display
            const content2 = getByText('Content 2');
            const panel = content2.closest('[role="tabpanel"]') as HTMLElement;
            expect(panel.style.display).toBe('none');
        });
    });

    // === Selection Tests ===
    describe('selection', () => {
        it('selects tab on click', async () => {
            const { getByText, getAllByRole } = render(() => (
                <Tabs.Root defaultValue="tab1">
                    <Tabs.List>
                        <Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
                        <Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
                    </Tabs.List>
                    <Tabs.Panel value="tab1">Content 1</Tabs.Panel>
                    <Tabs.Panel value="tab2">Content 2</Tabs.Panel>
                </Tabs.Root>
            ));

            const tab2 = getByText('Tab 2');
            await fireEvent.click(tab2);

            expect(tab2.getAttribute('aria-selected')).toBe('true');
        });

        it('calls onValueChange when tab changes', async () => {
            const onValueChange = vi.fn();
            const { getByText } = render(() => (
                <Tabs.Root defaultValue="tab1" onValueChange={onValueChange}>
                    <Tabs.List>
                        <Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
                        <Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
                    </Tabs.List>
                    <Tabs.Panel value="tab1">Content 1</Tabs.Panel>
                    <Tabs.Panel value="tab2">Content 2</Tabs.Panel>
                </Tabs.Root>
            ));

            await fireEvent.click(getByText('Tab 2'));

            expect(onValueChange).toHaveBeenCalledWith('tab2');
        });
    });

    // === Accessibility Tests ===
    describe('accessibility', () => {
        it('has correct aria-selected values', () => {
            const { getByText } = render(() => (
                <Tabs.Root defaultValue="tab1">
                    <Tabs.List>
                        <Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
                        <Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
                    </Tabs.List>
                    <Tabs.Panel value="tab1">Content 1</Tabs.Panel>
                    <Tabs.Panel value="tab2">Content 2</Tabs.Panel>
                </Tabs.Root>
            ));

            expect(getByText('Tab 1').getAttribute('aria-selected')).toBe('true');
            expect(getByText('Tab 2').getAttribute('aria-selected')).toBe('false');
        });

        it('has correct tabindex (roving tabindex)', () => {
            const { getByText } = render(() => (
                <Tabs.Root defaultValue="tab1">
                    <Tabs.List>
                        <Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
                        <Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
                    </Tabs.List>
                    <Tabs.Panel value="tab1">Content 1</Tabs.Panel>
                    <Tabs.Panel value="tab2">Content 2</Tabs.Panel>
                </Tabs.Root>
            ));

            expect(getByText('Tab 1').getAttribute('tabindex')).toBe('0');
            expect(getByText('Tab 2').getAttribute('tabindex')).toBe('-1');
        });

        it('has aria-controls linking tab to panel', () => {
            const { getByText } = render(() => (
                <Tabs.Root defaultValue="tab1">
                    <Tabs.List>
                        <Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
                    </Tabs.List>
                    <Tabs.Panel value="tab1">Content 1</Tabs.Panel>
                </Tabs.Root>
            ));

            expect(getByText('Tab 1').getAttribute('aria-controls')).toBe('tab1-panel');
        });
    });

    // === Keyboard Navigation Tests ===
    describe('keyboard navigation', () => {
        it('navigates with arrow right', async () => {
            const onValueChange = vi.fn();
            const { getByText } = render(() => (
                <Tabs.Root defaultValue="tab1" onValueChange={onValueChange}>
                    <Tabs.List>
                        <Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
                        <Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
                    </Tabs.List>
                    <Tabs.Panel value="tab1">Content 1</Tabs.Panel>
                    <Tabs.Panel value="tab2">Content 2</Tabs.Panel>
                </Tabs.Root>
            ));

            const tab1 = getByText('Tab 1');
            await fireEvent.keyDown(tab1, { key: 'ArrowRight' });
            await fireEvent.keyDown(tab1, { key: 'Enter' });

            expect(onValueChange).toHaveBeenCalledWith('tab2');
        });

        it('activates on Enter key', async () => {
            const onValueChange = vi.fn();
            const { getByText } = render(() => (
                <Tabs.Root defaultValue="tab1" onValueChange={onValueChange}>
                    <Tabs.List>
                        <Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
                        <Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
                    </Tabs.List>
                    <Tabs.Panel value="tab1">Content 1</Tabs.Panel>
                    <Tabs.Panel value="tab2">Content 2</Tabs.Panel>
                </Tabs.Root>
            ));

            const tab1 = getByText('Tab 1');
            await fireEvent.keyDown(tab1, { key: 'ArrowRight' });
            await fireEvent.keyDown(tab1, { key: 'Enter' });

            expect(onValueChange).toHaveBeenCalled();
        });
    });

    // === Controlled Mode Tests ===
    describe('controlled mode', () => {
        it('syncs with controlled value prop', async () => {
            const [value, setValue] = createSignal('tab1');
            const { getByText } = render(() => (
                <Tabs.Root value={value()} onValueChange={(v) => setValue(v)}>
                    <Tabs.List>
                        <Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
                        <Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
                    </Tabs.List>
                    <Tabs.Panel value="tab1">Content 1</Tabs.Panel>
                    <Tabs.Panel value="tab2">Content 2</Tabs.Panel>
                </Tabs.Root>
            ));

            expect(getByText('Tab 1').getAttribute('aria-selected')).toBe('true');

            await fireEvent.click(getByText('Tab 2'));

            expect(value()).toBe('tab2');
        });
    });
});
