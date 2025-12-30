/**
 * Button - SolidJS styled component
 *
 * Uses the useButton hook for spec-driven state management.
 * Combines UnoCSS utilities with CSS Modules for styling.
 */

import type { Component, JSX } from 'solid-js';
import { splitProps } from 'solid-js';
import { useButton, type UseButtonOptions } from './useButton';
import styles from '../Button.module.css';

export interface ButtonProps extends UseButtonOptions {
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    class?: string;
    children: JSX.Element;
}

export const Button: Component<ButtonProps> = (props) => {
    const [local, buttonOptions] = splitProps(props, ['variant', 'size', 'class', 'children']);
    const btn = useButton(buttonOptions);

    const variantClass = () => styles[local.variant ?? 'primary'];
    const sizeClass = () => styles[local.size ?? 'md'];
    const stateClass = () => {
        if (btn.loading()) return styles.loading;
        if (btn.pressed()) return styles.pressed;
        return '';
    };

    return (
        <button
            {...btn.rootProps()}
            class={`
                ${styles.button}
                ${variantClass()}
                ${sizeClass()}
                ${stateClass()}
                ${local.class ?? ''}
            `.trim().replace(/\s+/g, ' ')}
        >
            {btn.loading() && (
                <span class={styles.spinner} aria-hidden="true" />
            )}
            <span class={btn.loading() ? styles.contentHidden : ''}>
                {local.children}
            </span>
        </button>
    );
};
