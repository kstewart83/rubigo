/**
 * Checkbox Component Tests
 * 
 * Tests for the Checkbox SolidJS component.
 * Based on checkbox.sudo.md specification and test vectors.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { Checkbox } from './Checkbox';

afterEach(() => {
    cleanup();
});

describe('Checkbox Component', () => {
    // ===== Basic Rendering =====
    describe('Rendering', () => {
        it('renders with default unchecked state', () => {
            const { getByRole } = render(() => <Checkbox />);
            const checkbox = getByRole('checkbox');
            expect(checkbox).toBeDefined();
            expect(checkbox.getAttribute('aria-checked')).toBe('false');
        });

        it('renders with label children', () => {
            const { getByText } = render(() => (
                <Checkbox>Accept Terms</Checkbox>
            ));
            expect(getByText('Accept Terms')).toBeDefined();
        });

        it('renders checked when checked prop is true', () => {
            const { getByRole } = render(() => <Checkbox checked />);
            const checkbox = getByRole('checkbox');
            expect(checkbox.getAttribute('aria-checked')).toBe('true');
        });

        it('renders indeterminate with aria-checked="mixed"', () => {
            const { getByRole } = render(() => <Checkbox indeterminate />);
            const checkbox = getByRole('checkbox');
            expect(checkbox.getAttribute('aria-checked')).toBe('mixed');
        });
    });

    // ===== Toggle Behavior (from test vectors) =====
    describe('Toggle Behavior', () => {
        it('toggle from unchecked → checked', () => {
            const onChange = vi.fn();
            const { getByRole } = render(() => (
                <Checkbox onChange={onChange} />
            ));

            const checkbox = getByRole('checkbox');
            fireEvent.click(checkbox);

            expect(onChange).toHaveBeenCalledWith(true);
            expect(checkbox.getAttribute('aria-checked')).toBe('true');
        });

        it('toggle from checked → unchecked (uncontrolled)', () => {
            const onChange = vi.fn();
            const { getByRole } = render(() => (
                <Checkbox checked onChange={onChange} />
            ));

            const checkbox = getByRole('checkbox');
            // Initial state is checked (from prop)
            expect(checkbox.getAttribute('aria-checked')).toBe('true');

            // Click to toggle
            fireEvent.click(checkbox);

            // onChange is called with false, and state updates
            expect(onChange).toHaveBeenCalledWith(false);
            expect(checkbox.getAttribute('aria-checked')).toBe('false');
        });

        it('toggle from indeterminate → checked', () => {
            const onChange = vi.fn();
            const { getByRole } = render(() => (
                <Checkbox indeterminate onChange={onChange} />
            ));

            const checkbox = getByRole('checkbox');
            fireEvent.click(checkbox);

            expect(onChange).toHaveBeenCalledWith(true);
            expect(checkbox.getAttribute('aria-checked')).toBe('true');
        });
    });

    // ===== Disabled Behavior (from test vectors) =====
    describe('Disabled Behavior', () => {
        it('disabled blocks toggle', () => {
            const onChange = vi.fn();
            const { getByRole } = render(() => (
                <Checkbox disabled onChange={onChange} />
            ));

            const checkbox = getByRole('checkbox');
            fireEvent.click(checkbox);

            expect(onChange).not.toHaveBeenCalled();
            expect(checkbox.getAttribute('aria-checked')).toBe('false');
        });

        it('disabled has aria-disabled="true"', () => {
            const { getByRole } = render(() => <Checkbox disabled />);
            const checkbox = getByRole('checkbox');
            expect(checkbox.getAttribute('aria-disabled')).toBe('true');
        });

        it('disabled has tabIndex=-1', () => {
            const { getByRole } = render(() => <Checkbox disabled />);
            const checkbox = getByRole('checkbox');
            expect(checkbox.getAttribute('tabindex')).toBe('-1');
        });
    });

    // ===== Keyboard Interaction =====
    describe('Keyboard Interaction', () => {
        it('Space key toggles on keyUp', () => {
            const onChange = vi.fn();
            const { getByRole } = render(() => (
                <Checkbox onChange={onChange} />
            ));

            const checkbox = getByRole('checkbox');
            fireEvent.keyUp(checkbox, { key: ' ' });

            expect(onChange).toHaveBeenCalledWith(true);
        });

        it('Enter key toggles on keyDown', () => {
            const onChange = vi.fn();
            const { getByRole } = render(() => (
                <Checkbox onChange={onChange} />
            ));

            const checkbox = getByRole('checkbox');
            fireEvent.keyDown(checkbox, { key: 'Enter' });

            expect(onChange).toHaveBeenCalledWith(true);
        });

        it('Space does not toggle when disabled', () => {
            const onChange = vi.fn();
            const { getByRole } = render(() => (
                <Checkbox disabled onChange={onChange} />
            ));

            const checkbox = getByRole('checkbox');
            fireEvent.keyUp(checkbox, { key: ' ' });

            expect(onChange).not.toHaveBeenCalled();
        });
    });

    // ===== ARIA Attributes =====
    describe('ARIA Attributes', () => {
        it('has role="checkbox"', () => {
            const { getByRole } = render(() => <Checkbox />);
            const checkbox = getByRole('checkbox');
            expect(checkbox.getAttribute('role')).toBe('checkbox');
        });

        it('aria-checked="false" when unchecked', () => {
            const { getByRole } = render(() => <Checkbox />);
            const checkbox = getByRole('checkbox');
            expect(checkbox.getAttribute('aria-checked')).toBe('false');
        });

        it('aria-checked="true" when checked', () => {
            const { getByRole } = render(() => <Checkbox checked />);
            const checkbox = getByRole('checkbox');
            expect(checkbox.getAttribute('aria-checked')).toBe('true');
        });

        it('aria-checked="mixed" when indeterminate', () => {
            const { getByRole } = render(() => <Checkbox indeterminate />);
            const checkbox = getByRole('checkbox');
            expect(checkbox.getAttribute('aria-checked')).toBe('mixed');
        });

        it('is focusable when not disabled', () => {
            const { getByRole } = render(() => <Checkbox />);
            const checkbox = getByRole('checkbox');
            expect(checkbox.getAttribute('tabindex')).toBe('0');
        });
    });

    // ===== Prop Reactivity =====
    describe('Prop Reactivity', () => {
        it('initial checked prop sets starting state', () => {
            const { getByRole } = render(() => (
                <Checkbox checked />
            ));

            const checkbox = getByRole('checkbox');
            // Initial state from prop
            expect(checkbox.getAttribute('aria-checked')).toBe('true');

            // After click, internal state changes (uncontrolled)
            fireEvent.click(checkbox);
            expect(checkbox.getAttribute('aria-checked')).toBe('false');
        });

        it('responds to disabled prop changing from false to true', () => {
            const [disabled, setDisabled] = createSignal(false);
            const onChange = vi.fn();
            const { getByRole } = render(() => (
                <Checkbox disabled={disabled()} onChange={onChange} />
            ));

            const checkbox = getByRole('checkbox');

            // Should toggle when not disabled
            fireEvent.click(checkbox);
            expect(onChange).toHaveBeenCalledTimes(1);

            // After disabling, should not toggle
            setDisabled(true);
            fireEvent.click(checkbox);
            expect(onChange).toHaveBeenCalledTimes(1); // Still 1, not 2
        });
    });

    // ===== onChange callback =====
    describe('onChange Callback', () => {
        it('onChange called with true when checking', () => {
            const onChange = vi.fn();
            const { getByRole } = render(() => (
                <Checkbox onChange={onChange} />
            ));

            fireEvent.click(getByRole('checkbox'));
            expect(onChange).toHaveBeenCalledWith(true);
        });

        it('onChange called with false when unchecking', () => {
            const onChange = vi.fn();
            const { getByRole } = render(() => (
                <Checkbox checked onChange={onChange} />
            ));

            fireEvent.click(getByRole('checkbox'));
            expect(onChange).toHaveBeenCalledWith(false);
        });

        it('onChange fires exactly once per toggle', () => {
            const onChange = vi.fn();
            const { getByRole } = render(() => (
                <Checkbox onChange={onChange} />
            ));

            fireEvent.click(getByRole('checkbox'));
            expect(onChange).toHaveBeenCalledTimes(1);
        });
    });
});
