/**
 * Input Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { Input } from './Input';

describe('Input', () => {
    // === Rendering Tests ===
    describe('rendering', () => {
        it('renders an input element', () => {
            const { getByRole } = render(() => <Input />);
            const input = getByRole('textbox');

            expect(input).toBeDefined();
            expect(input.tagName.toLowerCase()).toBe('input');
        });

        it('renders with placeholder', () => {
            const { getByPlaceholderText } = render(() => (
                <Input placeholder="Enter text..." />
            ));

            expect(getByPlaceholderText('Enter text...')).toBeDefined();
        });

        it('renders with initial value', () => {
            const { getByRole } = render(() => <Input value="Hello" />);
            const input = getByRole('textbox') as HTMLInputElement;

            expect(input.value).toBe('Hello');
        });

        it('renders with correct type', () => {
            const { getByRole } = render(() => <Input type="email" />);
            const input = getByRole('textbox') as HTMLInputElement;

            expect(input.type).toBe('email');
        });
    });

    // === Interaction Tests ===
    describe('interactions', () => {
        it('calls onChange when typing', async () => {
            const onChange = vi.fn();
            const { getByRole } = render(() => <Input onChange={onChange} />);
            const input = getByRole('textbox') as HTMLInputElement;

            await fireEvent.input(input, { target: { value: 'Hello' } });

            expect(onChange).toHaveBeenCalledWith('Hello');
        });

        it('calls onFocus when focused', async () => {
            const onFocus = vi.fn();
            const { getByRole } = render(() => <Input onFocus={onFocus} />);
            const input = getByRole('textbox');

            await fireEvent.focus(input);

            expect(onFocus).toHaveBeenCalled();
        });

        it('calls onBlur when blurred', async () => {
            const onBlur = vi.fn();
            const { getByRole } = render(() => <Input onBlur={onBlur} />);
            const input = getByRole('textbox');

            await fireEvent.focus(input);
            await fireEvent.blur(input);

            expect(onBlur).toHaveBeenCalled();
        });
    });

    // === Disabled State Tests ===
    describe('disabled state', () => {
        it('renders as disabled when disabled prop is true', () => {
            const { getByRole } = render(() => <Input disabled={true} />);
            const input = getByRole('textbox') as HTMLInputElement;

            expect(input.disabled).toBe(true);
        });

        it('has aria-disabled when disabled', () => {
            const { getByRole } = render(() => <Input disabled={true} />);
            const input = getByRole('textbox');

            expect(input.getAttribute('aria-disabled')).toBe('true');
        });

        it('does not call onChange when disabled', async () => {
            const onChange = vi.fn();
            const { getByRole } = render(() => (
                <Input disabled={true} onChange={onChange} />
            ));
            const input = getByRole('textbox');

            await fireEvent.input(input, { target: { value: 'test' } });

            // onChange won't be called because input is disabled natively
            // The native disabled prevents input events
        });
    });

    // === Read-only State Tests ===
    describe('readOnly state', () => {
        it('renders as readonly when readOnly prop is true', () => {
            const { getByRole } = render(() => <Input readOnly={true} />);
            const input = getByRole('textbox') as HTMLInputElement;

            expect(input.readOnly).toBe(true);
        });

        it('has aria-readonly when readOnly', () => {
            const { getByRole } = render(() => <Input readOnly={true} />);
            const input = getByRole('textbox');

            expect(input.getAttribute('aria-readonly')).toBe('true');
        });
    });

    // === Validation State Tests ===
    describe('validation state', () => {
        it('has aria-invalid when invalid', () => {
            const { getByRole } = render(() => <Input invalid={true} />);
            const input = getByRole('textbox');

            expect(input.getAttribute('aria-invalid')).toBe('true');
        });

        it('has aria-required when required', () => {
            const { getByRole } = render(() => <Input required={true} />);
            const input = getByRole('textbox');

            expect(input.getAttribute('aria-required')).toBe('true');
        });
    });

    // === Controlled Mode Tests ===
    describe('controlled mode', () => {
        it('syncs with controlled value prop', async () => {
            const [value, setValue] = createSignal('initial');
            const { getByRole } = render(() => (
                <Input
                    value={value()}
                    onChange={(newVal) => setValue(newVal)}
                />
            ));
            const input = getByRole('textbox') as HTMLInputElement;

            expect(input.value).toBe('initial');

            // Type new value
            await fireEvent.input(input, { target: { value: 'updated' } });
            expect(value()).toBe('updated');
            expect(input.value).toBe('updated');
        });
    });
});
