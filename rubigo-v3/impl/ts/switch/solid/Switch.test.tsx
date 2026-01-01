/**
 * Switch Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { Switch } from './Switch';

describe('Switch', () => {
    // === Rendering Tests ===
    describe('rendering', () => {
        it('renders with default unchecked state', () => {
            const { getByRole } = render(() => <Switch />);
            const switchEl = getByRole('switch');

            expect(switchEl).toBeDefined();
            expect(switchEl.getAttribute('aria-checked')).toBe('false');
        });

        it('renders with label', () => {
            const { getByText } = render(() => <Switch>Dark Mode</Switch>);

            expect(getByText('Dark Mode')).toBeDefined();
        });

        it('renders initially checked when checked prop is true', () => {
            const { getByRole } = render(() => <Switch checked={true} />);
            const switchEl = getByRole('switch');

            expect(switchEl.getAttribute('aria-checked')).toBe('true');
        });
    });

    // === Interaction Tests ===
    describe('interactions', () => {
        it('toggles on click', async () => {
            const { getByRole } = render(() => <Switch />);
            const switchEl = getByRole('switch');

            expect(switchEl.getAttribute('aria-checked')).toBe('false');

            await fireEvent.click(switchEl);

            expect(switchEl.getAttribute('aria-checked')).toBe('true');
        });

        it('toggles on Space key', async () => {
            const { getByRole } = render(() => <Switch />);
            const switchEl = getByRole('switch');

            await fireEvent.keyDown(switchEl, { key: ' ' });

            expect(switchEl.getAttribute('aria-checked')).toBe('true');
        });

        it('toggles on Enter key', async () => {
            const { getByRole } = render(() => <Switch />);
            const switchEl = getByRole('switch');

            await fireEvent.keyDown(switchEl, { key: 'Enter' });

            expect(switchEl.getAttribute('aria-checked')).toBe('true');
        });

        it('calls onCheckedChange with new value', async () => {
            const onCheckedChange = vi.fn();
            const { getByRole } = render(() => <Switch onCheckedChange={onCheckedChange} />);
            const switchEl = getByRole('switch');

            await fireEvent.click(switchEl);

            expect(onCheckedChange).toHaveBeenCalledWith(true);
        });

        it('calls onCheckedChange with false when toggling off', async () => {
            const onCheckedChange = vi.fn();
            const { getByRole } = render(() => <Switch checked={true} onCheckedChange={onCheckedChange} />);
            const switchEl = getByRole('switch');

            await fireEvent.click(switchEl);

            expect(onCheckedChange).toHaveBeenCalledWith(false);
        });
    });

    // === Disabled State Tests ===
    describe('disabled state', () => {
        it('renders with aria-disabled when disabled', () => {
            const { getByRole } = render(() => <Switch disabled={true} />);
            const switchEl = getByRole('switch');

            expect(switchEl.getAttribute('aria-disabled')).toBe('true');
        });

        it('has tabindex -1 when disabled', () => {
            const { getByRole } = render(() => <Switch disabled={true} />);
            const switchEl = getByRole('switch');

            expect(switchEl.getAttribute('tabindex')).toBe('-1');
        });

        it('does not toggle when disabled', async () => {
            const onCheckedChange = vi.fn();
            const { getByRole } = render(() => <Switch disabled={true} onCheckedChange={onCheckedChange} />);
            const switchEl = getByRole('switch');

            await fireEvent.click(switchEl);

            expect(onCheckedChange).not.toHaveBeenCalled();
            expect(switchEl.getAttribute('aria-checked')).toBe('false');
        });
    });

    // === Controlled Mode Tests ===
    describe('controlled mode', () => {
        it('syncs with controlled checked prop', async () => {
            const [checked, setChecked] = createSignal(false);
            const { getByRole } = render(() => (
                <Switch
                    checked={checked()}
                    onCheckedChange={(newVal) => setChecked(newVal)}
                />
            ));
            const switchEl = getByRole('switch');

            expect(switchEl.getAttribute('aria-checked')).toBe('false');

            // Toggle via click
            await fireEvent.click(switchEl);
            expect(checked()).toBe(true);
            expect(switchEl.getAttribute('aria-checked')).toBe('true');

            // Toggle back
            await fireEvent.click(switchEl);
            expect(checked()).toBe(false);
            expect(switchEl.getAttribute('aria-checked')).toBe('false');
        });
    });

    // === Accessibility Tests ===
    describe('accessibility', () => {
        it('has role="switch"', () => {
            const { getByRole } = render(() => <Switch />);
            const switchEl = getByRole('switch');

            expect(switchEl).toBeDefined();
        });

        it('has correct aria-checked values', async () => {
            const { getByRole } = render(() => <Switch />);
            const switchEl = getByRole('switch');

            expect(switchEl.getAttribute('aria-checked')).toBe('false');

            await fireEvent.click(switchEl);

            expect(switchEl.getAttribute('aria-checked')).toBe('true');
        });

        it('is focusable when enabled', () => {
            const { getByRole } = render(() => <Switch />);
            const switchEl = getByRole('switch');

            expect(switchEl.getAttribute('tabindex')).toBe('0');
        });
    });
});
