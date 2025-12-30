/**
 * useTabs - SolidJS hook for a spec-driven tabs component
 *
 * Based on the tabs.sudo.md specification.
 */

import { createSignal, createMemo } from 'solid-js';
import { createMachine } from '../statechart';
import { createTabsConfig, type TabsContext } from '../tabs/config';

export interface UseTabsOptions {
    defaultValue?: string;
    tabs?: string[];
}

export interface UseTabsReturn {
    selectedId: () => string;
    focusedId: () => string;
    select: (id: string) => void;
    focusNext: () => void;
    focusPrev: () => void;
    focusFirst: () => void;
    focusLast: () => void;
    activate: () => void;
    tabListProps: () => {
        role: 'tablist';
        'aria-orientation': 'horizontal';
    };
    getTabProps: (id: string) => {
        role: 'tab';
        id: string;
        'aria-selected': boolean;
        'aria-controls': string;
        tabIndex: number;
        onClick: () => void;
        onKeyDown: (e: KeyboardEvent) => void;
    };
    getPanelProps: (id: string) => {
        role: 'tabpanel';
        id: string;
        'aria-labelledby': string;
        hidden: boolean;
    };
}

export function useTabs(options: UseTabsOptions = {}): UseTabsReturn {
    const machine = createMachine(createTabsConfig({
        selectedId: options.defaultValue ?? 'tab-0',
        focusedId: options.defaultValue ?? 'tab-0',
    }));

    const [version, setVersion] = createSignal(0);
    const bump = () => setVersion((v) => v + 1);

    const getContext = createMemo(() => {
        version();
        return machine.getContext();
    });

    const selectedId = () => getContext().selectedId;
    const focusedId = () => getContext().focusedId;

    const select = (id: string) => {
        (machine as any).context.selectedId = id;
        (machine as any).context.focusedId = id;
        bump();
    };

    const focusNext = () => { machine.send('FOCUS_NEXT'); bump(); };
    const focusPrev = () => { machine.send('FOCUS_PREV'); bump(); };
    const focusFirst = () => { machine.send('FOCUS_FIRST'); bump(); };
    const focusLast = () => { machine.send('FOCUS_LAST'); bump(); };
    const activate = () => { machine.send('ACTIVATE'); bump(); };

    const tabListProps = () => ({
        role: 'tablist' as const,
        'aria-orientation': 'horizontal' as const,
    });

    const getTabProps = (id: string) => ({
        role: 'tab' as const,
        id,
        'aria-selected': selectedId() === id,
        'aria-controls': `${id}-panel`,
        tabIndex: selectedId() === id ? 0 : -1,
        onClick: () => select(id),
        onKeyDown: (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') focusNext();
            else if (e.key === 'ArrowLeft') focusPrev();
            else if (e.key === 'Home') focusFirst();
            else if (e.key === 'End') focusLast();
            else if (e.key === 'Enter' || e.key === ' ') activate();
        },
    });

    const getPanelProps = (id: string) => ({
        role: 'tabpanel' as const,
        id: `${id}-panel`,
        'aria-labelledby': id,
        hidden: selectedId() !== id,
    });

    return {
        selectedId, focusedId, select,
        focusNext, focusPrev, focusFirst, focusLast, activate,
        tabListProps, getTabProps, getPanelProps,
    };
}
