/**
 * useTabs Hook
 * 
 * SolidJS hook for the Tabs component state machine.
 */
import { createSignal, createEffect, Accessor } from 'solid-js';
import { createMachine } from '../../statechart';
import { createTabsConfig, type TabsContext } from '../config';

export interface UseTabsOptions {
    /** Default active tab id */
    defaultValue?: string;
    /** Controlled active tab id */
    value?: string;
    /** Called when active tab changes */
    onValueChange?: (value: string) => void;
}

export interface UseTabsReturn {
    /** Currently selected tab id */
    selectedId: Accessor<string>;
    /** Currently focused tab id */
    focusedId: Accessor<string>;
    /** Select a tab by id */
    selectTab: (id: string) => void;
    /** Focus next tab */
    focusNext: () => void;
    /** Focus previous tab */
    focusPrev: () => void;
    /** Focus first tab */
    focusFirst: () => void;
    /** Focus last tab */
    focusLast: () => void;
    /** Activate the currently focused tab */
    activate: () => void;
    /** Get tablist props */
    tablistProps: () => {
        role: 'tablist';
    };
    /** Get tab props for a specific tab */
    getTabProps: (id: string, index: number, total: number) => {
        role: 'tab';
        id: string;
        'aria-selected': boolean;
        'aria-controls': string;
        tabIndex: number;
        onClick: () => void;
        onKeyDown: (e: KeyboardEvent) => void;
    };
    /** Get panel props for a specific panel */
    getPanelProps: (id: string) => {
        role: 'tabpanel';
        id: string;
        'aria-labelledby': string;
        hidden: boolean;
    };
}

export function useTabs(options: UseTabsOptions = {}): UseTabsReturn {
    const defaultId = options.defaultValue ?? 'tab-0';

    const machine = createMachine(createTabsConfig({
        selectedId: options.value ?? defaultId,
        focusedId: options.value ?? defaultId,
    }));

    const [bump, setBump] = createSignal(0);
    const triggerUpdate = () => setBump(b => b + 1);

    // Track tab ids for navigation
    const [tabIds, setTabIds] = createSignal<string[]>([]);

    // Sync controlled value
    createEffect(() => {
        const value = options.value;
        if (value !== undefined && machine.getContext().selectedId !== value) {
            (machine as any).context.selectedId = value;
            (machine as any).context.focusedId = value;
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

    const selectTab = (id: string) => {
        const prevId = machine.getContext().selectedId;
        (machine as any).context.selectedId = id;
        (machine as any).context.focusedId = id;
        if (prevId !== id) {
            options.onValueChange?.(id);
        }
        triggerUpdate();
    };

    const getTabIndex = (id: string): number => {
        const ids = tabIds();
        return ids.indexOf(id);
    };

    const focusNext = () => {
        const ids = tabIds();
        const currentIndex = getTabIndex(focusedId());
        const nextIndex = (currentIndex + 1) % ids.length;
        (machine as any).context.focusedId = ids[nextIndex];
        triggerUpdate();
    };

    const focusPrev = () => {
        const ids = tabIds();
        const currentIndex = getTabIndex(focusedId());
        const prevIndex = (currentIndex - 1 + ids.length) % ids.length;
        (machine as any).context.focusedId = ids[prevIndex];
        triggerUpdate();
    };

    const focusFirst = () => {
        const ids = tabIds();
        if (ids.length > 0) {
            (machine as any).context.focusedId = ids[0];
            triggerUpdate();
        }
    };

    const focusLast = () => {
        const ids = tabIds();
        if (ids.length > 0) {
            (machine as any).context.focusedId = ids[ids.length - 1];
            triggerUpdate();
        }
    };

    const activate = () => {
        const focused = focusedId();
        selectTab(focused);
    };

    const tablistProps = () => ({
        role: 'tablist' as const,
    });

    const getTabProps = (id: string, index: number, total: number) => {
        // Register tab id
        const ids = tabIds();
        if (!ids.includes(id)) {
            setTabIds([...ids, id]);
        }

        const isSelected = selectedId() === id;

        return {
            role: 'tab' as const,
            id,
            'aria-selected': isSelected,
            'aria-controls': `${id}-panel`,
            tabIndex: isSelected ? 0 : -1,
            onClick: () => selectTab(id),
            onKeyDown: (e: KeyboardEvent) => {
                switch (e.key) {
                    case 'ArrowRight':
                        e.preventDefault();
                        focusNext();
                        break;
                    case 'ArrowLeft':
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
        };
    };

    const getPanelProps = (id: string) => ({
        role: 'tabpanel' as const,
        id: `${id}-panel`,
        'aria-labelledby': id,
        hidden: selectedId() !== id,
    });

    const rootProps = () => ({
        'aria-selected': true,
        onKeyDown: (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowRight':
                    e.preventDefault();
                    focusNext();
                    break;
                case 'ArrowLeft':
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
            }
        },
    });

    return {
        selectedId,
        focusedId,
        selectTab,
        focusNext,
        focusPrev,
        focusFirst,
        focusLast,
        activate,
        rootProps,
        tablistProps,
        getTabProps,
        getPanelProps,
    };
}
