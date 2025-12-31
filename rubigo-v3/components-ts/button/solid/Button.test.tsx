/**
 * Button Component Tests
 * 
 * Tests for the Button SolidJS component.
 * Key test: onClick should fire exactly once per click (not double-fire).
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@solidjs/testing-library';
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

    it('applies variant class', () => {
        const { getByRole } = render(() => (
            <Button variant="destructive">Delete</Button>
        ));

        const button = getByRole('button');
        expect(button.className).toContain('destructive');
    });

    it('applies size class', () => {
        const { getByRole } = render(() => (
            <Button size="lg">Large</Button>
        ));

        const button = getByRole('button');
        expect(button.className).toContain('lg');
    });
});
