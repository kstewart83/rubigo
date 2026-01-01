/**
 * Slider Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { Slider } from './Slider';

describe('Slider', () => {
    describe('rendering', () => {
        it('renders a slider element', () => {
            const { getByRole } = render(() => <Slider />);
            expect(getByRole('slider')).toBeDefined();
        });

        it('renders with default value at min', () => {
            const { getByRole } = render(() => <Slider min={0} max={100} />);
            const slider = getByRole('slider');
            expect(slider.getAttribute('aria-valuenow')).toBe('0');
        });

        it('renders with custom initial value', () => {
            const { getByRole } = render(() => <Slider value={50} min={0} max={100} />);
            const slider = getByRole('slider');
            expect(slider.getAttribute('aria-valuenow')).toBe('50');
        });
    });

    describe('accessibility', () => {
        it('has correct ARIA attributes', () => {
            const { getByRole } = render(() => <Slider value={25} min={0} max={100} />);
            const slider = getByRole('slider');

            expect(slider.getAttribute('aria-valuenow')).toBe('25');
            expect(slider.getAttribute('aria-valuemin')).toBe('0');
            expect(slider.getAttribute('aria-valuemax')).toBe('100');
        });

        it('has tabindex for keyboard focus', () => {
            const { getByRole } = render(() => <Slider />);
            const slider = getByRole('slider');
            expect(slider.getAttribute('tabindex')).toBe('0');
        });

        it('has aria-disabled when disabled', () => {
            const { getByRole } = render(() => <Slider disabled />);
            const slider = getByRole('slider');
            expect(slider.getAttribute('aria-disabled')).toBe('true');
        });
    });

    describe('keyboard navigation', () => {
        it('increments on ArrowRight', async () => {
            const onValueChange = vi.fn();
            const { getByRole } = render(() => (
                <Slider value={50} min={0} max={100} step={1} onValueChange={onValueChange} />
            ));
            const slider = getByRole('slider');

            await fireEvent.keyDown(slider, { key: 'ArrowRight' });

            expect(onValueChange).toHaveBeenCalledWith(51);
        });

        it('decrements on ArrowLeft', async () => {
            const onValueChange = vi.fn();
            const { getByRole } = render(() => (
                <Slider value={50} min={0} max={100} step={1} onValueChange={onValueChange} />
            ));
            const slider = getByRole('slider');

            await fireEvent.keyDown(slider, { key: 'ArrowLeft' });

            expect(onValueChange).toHaveBeenCalledWith(49);
        });

        it('jumps to min on Home', async () => {
            const onValueChange = vi.fn();
            const { getByRole } = render(() => (
                <Slider value={50} min={0} max={100} onValueChange={onValueChange} />
            ));
            const slider = getByRole('slider');

            await fireEvent.keyDown(slider, { key: 'Home' });

            expect(onValueChange).toHaveBeenCalledWith(0);
        });

        it('jumps to max on End', async () => {
            const onValueChange = vi.fn();
            const { getByRole } = render(() => (
                <Slider value={50} min={0} max={100} onValueChange={onValueChange} />
            ));
            const slider = getByRole('slider');

            await fireEvent.keyDown(slider, { key: 'End' });

            expect(onValueChange).toHaveBeenCalledWith(100);
        });
    });

    describe('value constraints', () => {
        it('clamps value to max', async () => {
            const onValueChange = vi.fn();
            const { getByRole } = render(() => (
                <Slider value={100} min={0} max={100} step={1} onValueChange={onValueChange} />
            ));
            const slider = getByRole('slider');

            await fireEvent.keyDown(slider, { key: 'ArrowRight' });

            // Should not call because value already at max
            expect(onValueChange).not.toHaveBeenCalled();
        });

        it('clamps value to min', async () => {
            const onValueChange = vi.fn();
            const { getByRole } = render(() => (
                <Slider value={0} min={0} max={100} step={1} onValueChange={onValueChange} />
            ));
            const slider = getByRole('slider');

            await fireEvent.keyDown(slider, { key: 'ArrowLeft' });

            // Should not call because value already at min
            expect(onValueChange).not.toHaveBeenCalled();
        });
    });

    describe('disabled state', () => {
        it('blocks keyboard interaction when disabled', async () => {
            const onValueChange = vi.fn();
            const { getByRole } = render(() => (
                <Slider value={50} disabled onValueChange={onValueChange} />
            ));
            const slider = getByRole('slider');

            await fireEvent.keyDown(slider, { key: 'ArrowRight' });

            expect(onValueChange).not.toHaveBeenCalled();
        });

        it('has tabindex -1 when disabled', () => {
            const { getByRole } = render(() => <Slider disabled />);
            const slider = getByRole('slider');
            expect(slider.getAttribute('tabindex')).toBe('-1');
        });
    });

    describe('controlled mode', () => {
        it('syncs with controlled value', async () => {
            const [value, setValue] = createSignal(50);
            const { getByRole } = render(() => (
                <Slider value={value()} onValueChange={setValue} min={0} max={100} />
            ));
            const slider = getByRole('slider');

            expect(slider.getAttribute('aria-valuenow')).toBe('50');

            await fireEvent.keyDown(slider, { key: 'ArrowRight' });

            expect(value()).toBe(51);
        });
    });
});
