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
});
