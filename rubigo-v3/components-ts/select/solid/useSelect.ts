/**
 * useSelect Hook
 */
import { createSignal, createEffect, Accessor, onCleanup } from 'solid-js';

export interface UseSelectOptions {
    value?: string;
    defaultValue?: string;
    disabled?: boolean;
    onValueChange?: (value: string) => void;
    onOpenChange?: (open: boolean) => void;
}

export interface UseSelectReturn {
    open: Accessor<boolean>;
    selectedValue: Accessor<string>;
    highlightedValue: Accessor<string>;
    disabled: Accessor<boolean>;
    openDropdown: () => void;
    closeDropdown: () => void;
    toggleDropdown: () => void;
    selectValue: (value: string) => void;
    highlightValue: (value: string) => void;
    highlightNext: () => void;
    highlightPrev: () => void;
    highlightFirst: () => void;
    highlightLast: () => void;
    registerOption: (value: string) => void;
    triggerProps: () => {
        role: 'combobox';
        'aria-haspopup': 'listbox';
        'aria-expanded': boolean;
        'aria-disabled': boolean | undefined;
        tabIndex: number;
        onClick: () => void;
        onKeyDown: (e: KeyboardEvent) => void;
    };
    listboxProps: () => {
        role: 'listbox';
    };
    getOptionProps: (value: string) => {
        role: 'option';
        'aria-selected': boolean;
        'data-highlighted': boolean;
        onClick: () => void;
        onMouseEnter: () => void;
    };
}

export function useSelect(optionsInput: UseSelectOptions | (() => UseSelectOptions) = {}): UseSelectReturn {
    const getOptions = typeof optionsInput === 'function' ? optionsInput : () => optionsInput;
    const options = getOptions();

    const defaultVal = options.value ?? options.defaultValue ?? '';

    const [open, setOpen] = createSignal(false);
    const [selectedValue, setSelectedValue] = createSignal(defaultVal);
    const [highlightedValue, setHighlightedValue] = createSignal(defaultVal);
    const [internalDisabled, setInternalDisabled] = createSignal(options.disabled ?? false);
    const [optionValues, setOptionValues] = createSignal<string[]>([]);

    // Disabled accessor reads from props first for immediate reactivity
    const disabled = () => getOptions().disabled ?? internalDisabled();

    // Sync controlled props
    createEffect(() => {
        const value = getOptions().value;
        if (value !== undefined && selectedValue() !== value) {
            setSelectedValue(value);
            setHighlightedValue(value);
        }
    });

    createEffect(() => {
        const d = getOptions().disabled ?? false;
        if (internalDisabled() !== d) {
            setInternalDisabled(d);
        }
    });

    // Close on outside click
    const handleDocumentClick = (e: MouseEvent) => {
        if (open()) {
            closeDropdown();
        }
    };

    createEffect(() => {
        if (open()) {
            document.addEventListener('click', handleDocumentClick);
        } else {
            document.removeEventListener('click', handleDocumentClick);
        }
    });

    onCleanup(() => {
        document.removeEventListener('click', handleDocumentClick);
    });

    const openDropdown = () => {
        if (disabled()) return;
        setOpen(true);
        setHighlightedValue(selectedValue() || optionValues()[0] || '');
        options.onOpenChange?.(true);
    };

    const closeDropdown = () => {
        setOpen(false);
        options.onOpenChange?.(false);
    };

    const toggleDropdown = () => {
        if (open()) {
            closeDropdown();
        } else {
            openDropdown();
        }
    };

    const selectValue = (value: string) => {
        if (disabled()) return;
        const prev = selectedValue();
        setSelectedValue(value);
        setHighlightedValue(value);
        closeDropdown();
        if (prev !== value) {
            options.onValueChange?.(value);
        }
    };

    const highlightValue = (value: string) => {
        setHighlightedValue(value);
    };

    const getOptionIndex = (value: string): number => optionValues().indexOf(value);

    const highlightNext = () => {
        const opts = optionValues();
        const currentIndex = getOptionIndex(highlightedValue());
        const nextIndex = Math.min(currentIndex + 1, opts.length - 1);
        setHighlightedValue(opts[nextIndex]);
    };

    const highlightPrev = () => {
        const opts = optionValues();
        const currentIndex = getOptionIndex(highlightedValue());
        const prevIndex = Math.max(currentIndex - 1, 0);
        setHighlightedValue(opts[prevIndex]);
    };

    const highlightFirst = () => {
        const opts = optionValues();
        if (opts.length > 0) {
            setHighlightedValue(opts[0]);
        }
    };

    const highlightLast = () => {
        const opts = optionValues();
        if (opts.length > 0) {
            setHighlightedValue(opts[opts.length - 1]);
        }
    };

    const registerOption = (value: string) => {
        const opts = optionValues();
        if (!opts.includes(value)) {
            setOptionValues([...opts, value]);
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (disabled()) return;

        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (open()) {
                    selectValue(highlightedValue());
                } else {
                    openDropdown();
                }
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (open()) {
                    highlightNext();
                } else {
                    openDropdown();
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (open()) {
                    highlightPrev();
                }
                break;
            case 'Home':
                e.preventDefault();
                if (open()) {
                    highlightFirst();
                }
                break;
            case 'End':
                e.preventDefault();
                if (open()) {
                    highlightLast();
                }
                break;
            case 'Escape':
                e.preventDefault();
                closeDropdown();
                break;
        }
    };

    const triggerProps = () => ({
        role: 'combobox' as const,
        'aria-haspopup': 'listbox' as const,
        'aria-expanded': open(),
        'aria-disabled': disabled() || undefined,
        tabIndex: disabled() ? -1 : 0,
        onClick: (e: MouseEvent) => {
            e.stopPropagation();
            toggleDropdown();
        },
        onKeyDown: handleKeyDown,
    });

    const listboxProps = () => ({
        role: 'listbox' as const,
    });

    const getOptionProps = (value: string) => {
        registerOption(value);
        return {
            role: 'option' as const,
            'aria-selected': selectedValue() === value,
            'data-highlighted': highlightedValue() === value,
            onClick: () => selectValue(value),
            onMouseEnter: () => highlightValue(value),
        };
    };

    return {
        open,
        selectedValue,
        highlightedValue,
        disabled,
        openDropdown,
        closeDropdown,
        close: closeDropdown,
        toggleDropdown,
        selectValue,
        highlightValue,
        highlightNext,
        highlightPrev,
        highlightFirst,
        highlightLast,
        registerOption,
        triggerProps,
        listboxProps,
        getOptionProps,
    };
}
