/**
 * useToggleGroup Hook
 */
import { createSignal, createEffect, Accessor } from 'solid-js';
import { createMachine } from '../../statechart';
import { createToggleGroupConfig, type ToggleGroupContext } from '../config';

export interface UseToggleGroupOptions {
    value?: string;
    defaultValue?: string;
    disabled?: boolean;
    onValueChange?: (value: string) => void;
}

export interface UseToggleGroupReturn {
    selectedId: Accessor<string>;
    focusedId: Accessor<string>;
    disabled: Accessor<boolean>;
    select: (id: string) => void;
    /** Spec-compliant alias for select */
    selectItem: (id: string) => void;
    focusNext: () => void;
    focusPrev: () => void;
    focusFirst: () => void;
    focusLast: () => void;
    activate: () => void;
    registerItem: (id: string) => void;
    getItemProps: (id: string) => {
        role: 'radio';
        'aria-checked': boolean;
        'aria-disabled': boolean | undefined;
        tabIndex: number;
        onClick: () => void;
        onKeyDown: (e: KeyboardEvent) => void;
    };
    rootProps: () => {
        role: 'radiogroup';
        'aria-disabled': boolean | undefined;
    };
}

export function useToggleGroup(optionsInput: UseToggleGroupOptions | (() => UseToggleGroupOptions) = {}): UseToggleGroupReturn {
    const getOptions = typeof optionsInput === 'function' ? optionsInput : () => optionsInput;
    const options = getOptions();

    const defaultId = options.value ?? options.defaultValue ?? 'item-0';

    const machine = createMachine(createToggleGroupConfig({
        selectedId: defaultId,
        focusedId: defaultId,
        disabled: options.disabled ?? false,
    }));

    const [bump, setBump] = createSignal(0);
    const triggerUpdate = () => setBump(b => b + 1);

    const [itemIds, setItemIds] = createSignal<string[]>([]);

    // Sync controlled props
    createEffect(() => {
        const value = getOptions().value;
        if (value !== undefined) {
            const ctx = machine.getContext();
            if (ctx.selectedId !== value) {
                (machine as any).context.selectedId = value;
                (machine as any).context.focusedId = value;
                triggerUpdate();
            }
        }
    });

    createEffect(() => {
        const disabled = getOptions().disabled ?? false;
        if (machine.getContext().disabled !== disabled) {
            (machine as any).context.disabled = disabled;
            triggerUpdate();
        }
    });

    const selectedId = () => {
        bump();
        return machine.getContext().selectedId;
    };

    const focusedId = () => {
        bump();
        return machine.getContext().focusedId;
    };

    const disabled = () => {
        bump();
        return getOptions().disabled ?? machine.getContext().disabled;
    };

    const getItemIndex = (id: string): number => itemIds().indexOf(id);

    const select = (id: string) => {
        const ctx = machine.getContext();
        if (ctx.disabled) return;
        if (ctx.selectedId === id) return;

        (machine as any).context.selectedId = id;
        (machine as any).context.focusedId = id;
        getOptions().onValueChange?.(id);
        triggerUpdate();
    };

    const focusNext = () => {
        const ctx = machine.getContext();
        if (ctx.disabled) return;
        const ids = itemIds();
        const currentIndex = getItemIndex(ctx.focusedId);
        const nextIndex = (currentIndex + 1) % ids.length;
        (machine as any).context.focusedId = ids[nextIndex];
        triggerUpdate();
    };

    const focusPrev = () => {
        const ctx = machine.getContext();
        if (ctx.disabled) return;
        const ids = itemIds();
        const currentIndex = getItemIndex(ctx.focusedId);
        const prevIndex = (currentIndex - 1 + ids.length) % ids.length;
        (machine as any).context.focusedId = ids[prevIndex];
        triggerUpdate();
    };

    const focusFirst = () => {
        const ctx = machine.getContext();
        if (ctx.disabled) return;
        const ids = itemIds();
        if (ids.length > 0) {
            (machine as any).context.focusedId = ids[0];
            triggerUpdate();
        }
    };

    const focusLast = () => {
        const ctx = machine.getContext();
        if (ctx.disabled) return;
        const ids = itemIds();
        if (ids.length > 0) {
            (machine as any).context.focusedId = ids[ids.length - 1];
            triggerUpdate();
        }
    };

    const activate = () => {
        const ctx = machine.getContext();
        if (ctx.disabled) return;
        select(ctx.focusedId);
    };

    const registerItem = (id: string) => {
        const ids = itemIds();
        if (!ids.includes(id)) {
            setItemIds([...ids, id]);
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                focusNext();
                activate();
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                focusPrev();
                activate();
                break;
            case 'Home':
                e.preventDefault();
                focusFirst();
                activate();
                break;
            case 'End':
                e.preventDefault();
                focusLast();
                activate();
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                activate();
                break;
        }
    };

    const getItemProps = (id: string) => {
        registerItem(id);
        const isSelected = selectedId() === id;

        return {
            role: 'radio' as const,
            'aria-checked': isSelected,
            'aria-disabled': disabled() || undefined,
            tabIndex: isSelected ? 0 : -1,
            onClick: () => select(id),
            onKeyDown: handleKeyDown,
        };
    };

    const rootProps = () => ({
        role: 'radiogroup' as const,
        'aria-disabled': disabled() || undefined,
        'aria-checked': true,
        onKeyDown: handleKeyDown,
    });

    return {
        selectedId,
        focusedId,
        disabled,
        select,
        selectItem: select,  // Spec-compliant alias
        focusNext,
        focusPrev,
        focusFirst,
        focusLast,
        activate,
        registerItem,
        getItemProps,
        rootProps,
    };
}
