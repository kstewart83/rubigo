/**
 * Button Component Tests
 * 
 * Tests for the Button SolidJS component.
 * Key test: onClick should fire exactly once per click (not double-fire).
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { Button } from './Button';

afterEach(() => {
    cleanup();
});

describe('Button Component', () => {
    it('renders with children', () => {
        const { getByRole } = render(() => <Button>Click Me</Button>);
        const button = getByRole('button');
        expect(button).toBeDefined();
        expect(button.textContent).toContain('Click Me');
    });

    it('onClick fires exactly once per click (prevents double-fire bug)', () => {
        const onClick = vi.fn();
        const { getByRole } = render(() => (
            <Button onClick={onClick}>Click Me</Button>
        ));

        const button = getByRole('button');

        // Simulate a real click: mousedown, mouseup (which fires onClick via pressUp)
        fireEvent.mouseDown(button);
        fireEvent.mouseUp(button);

        // Should have been called exactly once, not twice
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not fire onClick when disabled', () => {
        const onClick = vi.fn();
        const { getByRole } = render(() => (
            <Button onClick={onClick} disabled>Click Me</Button>
        ));

        const button = getByRole('button');
        fireEvent.mouseDown(button);
        fireEvent.mouseUp(button);

        expect(onClick).not.toHaveBeenCalled();
    });

    it('does not fire onClick when loading', () => {
        const onClick = vi.fn();
        const { getByRole } = render(() => (
            <Button onClick={onClick} loading>Click Me</Button>
        ));

        const button = getByRole('button');
        fireEvent.mouseDown(button);
        fireEvent.mouseUp(button);

        expect(onClick).not.toHaveBeenCalled();
    });

    it('has correct aria attributes when disabled', () => {
        const { getByRole } = render(() => (
            <Button disabled>Click Me</Button>
        ));

        const button = getByRole('button');
        expect(button.getAttribute('aria-disabled')).toBe('true');
        expect(button.getAttribute('tabindex')).toBe('-1');
    });

    it('has correct aria attributes when loading', () => {
        const { getByRole } = render(() => (
            <Button loading>Click Me</Button>
        ));

        const button = getByRole('button');
        expect(button.getAttribute('aria-busy')).toBe('true');
    });

    // Variant Tests - ensure all 6 variants from spec have CSS
    describe('Variants', () => {
        it('applies primary variant class', () => {
            const { getByRole } = render(() => (
                <Button variant="primary">Primary</Button>
            ));
            expect(getByRole('button').className).toContain('primary');
        });

        it('applies secondary variant class', () => {
            const { getByRole } = render(() => (
                <Button variant="secondary">Secondary</Button>
            ));
            expect(getByRole('button').className).toContain('secondary');
        });

        it('applies outline variant class', () => {
            const { getByRole } = render(() => (
                <Button variant="outline">Outline</Button>
            ));
            expect(getByRole('button').className).toContain('outline');
        });

        it('applies ghost variant class', () => {
            const { getByRole } = render(() => (
                <Button variant="ghost">Ghost</Button>
            ));
            expect(getByRole('button').className).toContain('ghost');
        });

        it('applies destructive variant class', () => {
            const { getByRole } = render(() => (
                <Button variant="destructive">Destructive</Button>
            ));
            expect(getByRole('button').className).toContain('destructive');
        });

        it('applies link variant class', () => {
            const { getByRole } = render(() => (
                <Button variant="link">Link</Button>
            ));
            expect(getByRole('button').className).toContain('link');
        });
    });

    it('applies size class', () => {
        const { getByRole } = render(() => (
            <Button size="lg">Large</Button>
        ));

        const button = getByRole('button');
        expect(button.className).toContain('lg');
    });

    // Keyboard Interaction Tests
    describe('Keyboard Interactions', () => {
        it('Space key triggers onClick on keyup', () => {
            const onClick = vi.fn();
            const { getByRole } = render(() => (
                <Button onClick={onClick}>Click Me</Button>
            ));

            const button = getByRole('button');
            fireEvent.keyDown(button, { key: ' ', code: 'Space' });
            fireEvent.keyUp(button, { key: ' ', code: 'Space' });

            expect(onClick).toHaveBeenCalledTimes(1);
        });

        it('Enter key triggers onClick immediately', () => {
            const onClick = vi.fn();
            const { getByRole } = render(() => (
                <Button onClick={onClick}>Click Me</Button>
            ));

            const button = getByRole('button');
            fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });

            expect(onClick).toHaveBeenCalledTimes(1);
        });

        it('disabled button blocks keyboard activation', () => {
            const onClick = vi.fn();
            const { getByRole } = render(() => (
                <Button onClick={onClick} disabled>Click Me</Button>
            ));

            const button = getByRole('button');
            fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
            fireEvent.keyDown(button, { key: ' ', code: 'Space' });
            fireEvent.keyUp(button, { key: ' ', code: 'Space' });

            expect(onClick).not.toHaveBeenCalled();
        });

        it('loading button blocks keyboard activation', () => {
            const onClick = vi.fn();
            const { getByRole } = render(() => (
                <Button onClick={onClick} loading>Click Me</Button>
            ));

            const button = getByRole('button');
            fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
            fireEvent.keyDown(button, { key: ' ', code: 'Space' });
            fireEvent.keyUp(button, { key: ' ', code: 'Space' });

            expect(onClick).not.toHaveBeenCalled();
        });
    });

    // Focus Management Tests
    describe('Focus Management', () => {
        it('is focusable when enabled', () => {
            const { getByRole } = render(() => (
                <Button>Click Me</Button>
            ));

            const button = getByRole('button');
            expect(button.getAttribute('tabindex')).not.toBe('-1');
        });

        it('is not focusable when disabled (tabindex=-1)', () => {
            const { getByRole } = render(() => (
                <Button disabled>Click Me</Button>
            ));

            const button = getByRole('button');
            expect(button.getAttribute('tabindex')).toBe('-1');
        });
    });

    // Press Cancel Test
    describe('Press Cancel', () => {
        it('does not fire onClick when mouse leaves during press', () => {
            const onClick = vi.fn();
            const { getByRole } = render(() => (
                <Button onClick={onClick}>Click Me</Button>
            ));

            const button = getByRole('button');
            fireEvent.mouseDown(button);
            fireEvent.mouseLeave(button); // Cancel the press
            fireEvent.mouseUp(button);

            expect(onClick).not.toHaveBeenCalled();
        });
    });

    // Prop Reactivity Tests (catches bugs where prop changes after mount have no effect)
    describe('Prop Reactivity', () => {
        it('responds to disabled prop changing from false to true', () => {
            const onClick = vi.fn();
            const [disabled, setDisabled] = createSignal(false);

            const { getByRole } = render(() => (
                <Button onClick={onClick} disabled={disabled()}>Click Me</Button>
            ));

            const button = getByRole('button');

            // Should work when not disabled
            fireEvent.mouseDown(button);
            fireEvent.mouseUp(button);
            expect(onClick).toHaveBeenCalledTimes(1);

            // Disable the button
            setDisabled(true);

            // Should NOT work when disabled
            fireEvent.mouseDown(button);
            fireEvent.mouseUp(button);
            expect(onClick).toHaveBeenCalledTimes(1); // Still 1, not 2
        });

        it('responds to loading prop changing from false to true', () => {
            const onClick = vi.fn();
            const [loading, setLoading] = createSignal(false);

            const { getByRole } = render(() => (
                <Button onClick={onClick} loading={loading()}>Click Me</Button>
            ));

            const button = getByRole('button');

            // Should work when not loading
            fireEvent.mouseDown(button);
            fireEvent.mouseUp(button);
            expect(onClick).toHaveBeenCalledTimes(1);

            // Set loading
            setLoading(true);

            // Should NOT work when loading
            fireEvent.mouseDown(button);
            fireEvent.mouseUp(button);
            expect(onClick).toHaveBeenCalledTimes(1); // Still 1, not 2
        });
    });
});
