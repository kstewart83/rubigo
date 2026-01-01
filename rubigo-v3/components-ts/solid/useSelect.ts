/**
 * Rubigo SolidJS Select Hook
 *
 * Provides a reactive hook for select dropdowns using the statechart engine.
 * Supports keyboard navigation and typeahead search.
 */

import { createSignal, createMemo } from 'solid-js';
import { Machine, type MachineConfig } from '../statechart/machine';

export interface UseSelectOptions {
    value?: string;
    disabled?: boolean;
    options?: { value: string; label: string }[];
    onChange?: (value: string) => void;
}

export interface UseSelectReturn {
    selectedValue: () => string;
    highlightedValue: () => string;
    open: () => boolean;
    disabled: () => boolean;
    state: () => string;
    openDropdown: () => void;
    closeDropdown: () => void;
    selectValue: (value: string) => void;
    highlightNext: () => void;
    highlightPrev: () => void;
    setDisabled: (disabled: boolean) => void;
    triggerProps: () => {
        role: 'combobox';
        'aria-expanded': boolean;
        'aria-haspopup': 'listbox';
        'aria-disabled': boolean;
        tabIndex: number;
        onClick: () => void;
        onKeyDown: (e: KeyboardEvent) => void;
    };
    listboxProps: () => {
        role: 'listbox';
        'aria-activedescendant': string | undefined;
        hidden: boolean;
    };
    optionProps: (value: string) => {
        role: 'option';
        'aria-selected': boolean;
        'data-highlighted': boolean;
        onClick: () => void;
    };
}

// Select context
interface SelectContext {
    selectedValue: string;
    highlightedValue: string;
    open: boolean;
    disabled: boolean;
}

// Create select config
function createSelectConfig(initial: Partial<SelectContext>): MachineConfig<SelectContext> {
    const context: SelectContext = {
        selectedValue: initial.selectedValue ?? '',
        highlightedValue: initial.highlightedValue ?? '',
        open: initial.open ?? false,
        disabled: initial.disabled ?? false,
    };

    return {
        id: 'select',
        initial: context.open ? 'open' : 'closed',
        context,
        states: {
            closed: {
                on: {
                    OPEN: { target: 'open', actions: ['setOpen'], guard: 'canInteract' },
                },
            },
            open: {
                on: {
                    CLOSE: { target: 'closed', actions: ['setClosed'] },
                    SELECT: { target: 'closed', actions: ['selectValue', 'setClosed'] },
                    HIGHLIGHT_NEXT: { target: 'open', actions: [] },
                    HIGHLIGHT_PREV: { target: 'open', actions: [] },
                },
            },
        },
        actions: {
            setOpen: (ctx: SelectContext) => {
                ctx.open = true;
                ctx.highlightedValue = ctx.selectedValue;
            },
            setClosed: (ctx: SelectContext) => {
                ctx.open = false;
            },
            selectValue: (ctx: SelectContext) => {
                ctx.selectedValue = ctx.highlightedValue;
            },
        },
        guards: {
            canInteract: (ctx: SelectContext) => !ctx.disabled,
        },
    };
}

let selectIdCounter = 0;

/**
 * useSelect - SolidJS hook for a spec-driven select dropdown
 */
export function useSelect(options: UseSelectOptions = {}): UseSelectReturn {
    const selectId = `select-${++selectIdCounter}`;
    const opts = options.options ?? [];

    const config = createSelectConfig({
        selectedValue: options.value ?? (opts[0]?.value ?? ''),
        highlightedValue: options.value ?? (opts[0]?.value ?? ''),
        open: false,
        disabled: options.disabled ?? false,
    });
    const machine = new Machine<SelectContext>(config);

    const [version, setVersion] = createSignal(0);
    const bump = () => setVersion((v) => v + 1);

    const getContext = createMemo(() => {
        version();
        return machine.getContext();
    });

    const selectedValue = () => getContext().selectedValue;
    const highlightedValue = () => getContext().highlightedValue;
    const open = () => getContext().open;
    const disabled = () => getContext().disabled;
    const state = () => { version(); return machine.getState(); };

    const openDropdown = () => {
        machine.send('OPEN');
        bump();
    };

    const closeDropdown = () => {
        machine.send('CLOSE');
        bump();
    };

    const selectValue = (value: string) => {
        (machine as any).context.highlightedValue = value;
        const prevValue = machine.getContext().selectedValue;
        machine.send('SELECT');
        if (prevValue !== value) {
            options.onChange?.(value);
        }
        bump();
    };

    const highlightNext = () => {
        const ctx = machine.getContext();
        const currentIdx = opts.findIndex(o => o.value === ctx.highlightedValue);
        if (currentIdx < opts.length - 1) {
            (machine as any).context.highlightedValue = opts[currentIdx + 1].value;
            machine.send('HIGHLIGHT_NEXT');
            bump();
        }
    };

    const highlightPrev = () => {
        const ctx = machine.getContext();
        const currentIdx = opts.findIndex(o => o.value === ctx.highlightedValue);
        if (currentIdx > 0) {
            (machine as any).context.highlightedValue = opts[currentIdx - 1].value;
            machine.send('HIGHLIGHT_PREV');
            bump();
        }
    };

    const setDisabled = (value: boolean) => {
        (machine as any).context.disabled = value;
        bump();
    };

    const triggerProps = createMemo(() => ({
        role: 'combobox' as const,
        'aria-expanded': open(),
        'aria-haspopup': 'listbox' as const,
        'aria-disabled': disabled(),
        tabIndex: disabled() ? -1 : 0,
        onClick: () => open() ? closeDropdown() : openDropdown(),
        onKeyDown: (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (!open()) openDropdown();
                else highlightNext();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (open()) highlightPrev();
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (open()) selectValue(highlightedValue());
                else openDropdown();
            } else if (e.key === 'Escape') {
                closeDropdown();
            }
        },
    }));

    const listboxProps = createMemo(() => ({
        role: 'listbox' as const,
        'aria-activedescendant': open() ? `${selectId}-${highlightedValue()}` : undefined,
        hidden: !open(),
    }));

    const optionProps = (value: string) => ({
        role: 'option' as const,
        'aria-selected': selectedValue() === value,
        'data-highlighted': highlightedValue() === value,
        onClick: () => selectValue(value),
    });

    return {
        selectedValue, highlightedValue, open, disabled, state,
        openDropdown, closeDropdown, selectValue, highlightNext, highlightPrev, setDisabled,
        triggerProps, listboxProps, optionProps
    };
}
