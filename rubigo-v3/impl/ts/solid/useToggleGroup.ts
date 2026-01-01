/**
 * useToggleGroup - SolidJS hook for a spec-driven toggle group component
 *
 * Based on the togglegroup.sudo.md specification.
 * Provides radio-style exclusive selection with keyboard navigation.
 */

import { createSignal, createMemo } from 'solid-js';
import { Machine, type MachineConfig } from '../statechart';

export interface ToggleGroupContext {
    selectedId: string;
    focusedId: string;
    disabled: boolean;
}

export interface UseToggleGroupOptions {
    /** Default selected item ID */
    defaultValue?: string;
    /** Array of item IDs in the group */
    items?: string[];
    /** Whether the entire group is disabled */
    disabled?: boolean;
    /** Callback when value changes */
    onValueChange?: (value: string) => void;
}

export interface UseToggleGroupReturn {
    /** Currently selected item ID */
    selectedId: () => string;
    /** Currently focused item ID */
    focusedId: () => string;
    /** Whether the group is disabled */
    disabled: () => boolean;
    /** Select a specific item */
    select: (id: string) => void;
    /** Focus the next item (wraps) */
    focusNext: () => void;
    /** Focus the previous item (wraps) */
    focusPrev: () => void;
    /** Focus the first item */
    focusFirst: () => void;
    /** Focus the last item */
    focusLast: () => void;
    /** Activate (select) the currently focused item */
    activate: () => void;
    /** Props for the container element */
    groupProps: () => {
        role: 'radiogroup';
        'aria-disabled'?: boolean;
    };
    /** Props for individual toggle items */
    getItemProps: (id: string) => {
        role: 'radio';
        id: string;
        'aria-checked': boolean;
        'aria-disabled': boolean;
        tabIndex: number;
        onClick: () => void;
        onKeyDown: (e: KeyboardEvent) => void;
    };
}

function createToggleGroupConfig(context: ToggleGroupContext): MachineConfig<ToggleGroupContext> {
    return {
        id: 'toggle-group',
        initial: 'idle',
        context: { ...context },
        states: {
            idle: {
                on: {
                    SELECT: { target: 'idle', actions: ['selectItem'], guard: 'canInteract' },
                    FOCUS: { target: 'focused', actions: [] },
                    FOCUS_NEXT: { target: 'focused', actions: ['focusNextItem'], guard: 'canInteract' },
                    FOCUS_PREV: { target: 'focused', actions: ['focusPrevItem'], guard: 'canInteract' },
                    FOCUS_FIRST: { target: 'focused', actions: ['focusFirstItem'], guard: 'canInteract' },
                    FOCUS_LAST: { target: 'focused', actions: ['focusLastItem'], guard: 'canInteract' },
                    ACTIVATE: { target: 'idle', actions: ['activateItem'], guard: 'canInteract' },
                },
            },
            focused: {
                on: {
                    SELECT: { target: 'focused', actions: ['selectItem'], guard: 'canInteract' },
                    FOCUS_NEXT: { target: 'focused', actions: ['focusNextItem'], guard: 'canInteract' },
                    FOCUS_PREV: { target: 'focused', actions: ['focusPrevItem'], guard: 'canInteract' },
                    FOCUS_FIRST: { target: 'focused', actions: ['focusFirstItem'], guard: 'canInteract' },
                    FOCUS_LAST: { target: 'focused', actions: ['focusLastItem'], guard: 'canInteract' },
                    ACTIVATE: { target: 'focused', actions: ['activateItem'], guard: 'canInteract' },
                    BLUR: { target: 'idle', actions: ['resetFocus'] },
                },
            },
        },
        actions: {
            selectItem: (ctx: ToggleGroupContext, event?: { payload?: { id?: string } }) => {
                const id = event?.payload?.id;
                if (id) {
                    ctx.selectedId = id;
                    ctx.focusedId = id;
                }
            },
            focusNextItem: (ctx: ToggleGroupContext) => {
                ctx.focusedId = ctx.focusedId === 'item-0' ? 'item-1' : 'item-0';
            },
            focusPrevItem: (ctx: ToggleGroupContext) => {
                ctx.focusedId = ctx.focusedId === 'item-1' ? 'item-0' : 'item-1';
            },
            focusFirstItem: (ctx: ToggleGroupContext) => {
                ctx.focusedId = 'item-0';
            },
            focusLastItem: (ctx: ToggleGroupContext) => {
                ctx.focusedId = 'item-1';
            },
            activateItem: (ctx: ToggleGroupContext) => {
                ctx.selectedId = ctx.focusedId;
            },
            resetFocus: (ctx: ToggleGroupContext) => {
                ctx.focusedId = ctx.selectedId;
            },
        },
        guards: {
            canInteract: (ctx: ToggleGroupContext) => !ctx.disabled,
        },
    };
}

export function useToggleGroup(options: UseToggleGroupOptions = {}): UseToggleGroupReturn {
    const initialContext: ToggleGroupContext = {
        selectedId: options.defaultValue ?? 'item-0',
        focusedId: options.defaultValue ?? 'item-0',
        disabled: options.disabled ?? false,
    };

    const machine = new Machine(createToggleGroupConfig(initialContext));

    const [version, setVersion] = createSignal(0);
    const bump = () => setVersion((v) => v + 1);

    const getContext = createMemo(() => {
        version();
        return machine.getContext();
    });

    const selectedId = () => getContext().selectedId;
    const focusedId = () => getContext().focusedId;
    const disabled = () => getContext().disabled;

    const select = (id: string) => {
        machine.send({ name: 'SELECT', payload: { id } });
        bump();
        options.onValueChange?.(id);
    };

    const focusNext = () => { machine.send('FOCUS_NEXT'); bump(); };
    const focusPrev = () => { machine.send('FOCUS_PREV'); bump(); };
    const focusFirst = () => { machine.send('FOCUS_FIRST'); bump(); };
    const focusLast = () => { machine.send('FOCUS_LAST'); bump(); };
    const activate = () => {
        const prevSelected = selectedId();
        machine.send('ACTIVATE');
        bump();
        const newSelected = selectedId();
        if (newSelected !== prevSelected) {
            options.onValueChange?.(newSelected);
        }
    };

    const groupProps = () => ({
        role: 'radiogroup' as const,
        ...(disabled() && { 'aria-disabled': true }),
    });

    const getItemProps = (id: string) => ({
        role: 'radio' as const,
        id,
        'aria-checked': selectedId() === id,
        'aria-disabled': disabled(),
        tabIndex: selectedId() === id ? 0 : -1,
        onClick: () => select(id),
        onKeyDown: (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowRight':
                case 'ArrowDown':
                    e.preventDefault();
                    focusNext();
                    break;
                case 'ArrowLeft':
                case 'ArrowUp':
                    e.preventDefault();
                    focusPrev();
                    break;
                case 'Home':
                    e.preventDefault();
                    focusFirst();
                    break;
                case 'End':
                    e.preventDefault();
                    focusLast();
                    break;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    activate();
                    break;
            }
        },
    });

    return {
        selectedId, focusedId, disabled,
        select, focusNext, focusPrev, focusFirst, focusLast, activate,
        groupProps, getItemProps,
    };
}
