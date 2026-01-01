/**
 * Checkbox Component - SolidJS Implementation
 *
 * Uses the spec-driven useCheckbox hook and applies styling.
 */

import { Component, JSX, splitProps } from 'solid-js';
import { useCheckbox, type UseCheckboxOptions } from './useCheckbox';
import styles from '../../Checkbox.module.css';

export interface CheckboxProps extends UseCheckboxOptions {
    /** Custom CSS class */
    class?: string;
    /** Label content */
    children?: JSX.Element;
}

export const Checkbox: Component<CheckboxProps> = (props) => {
    const [local, checkboxOptions] = splitProps(props, ['class', 'children']);

    const checkbox = useCheckbox(checkboxOptions);

    const containerClasses = () => {
        const classes = [styles.container];
        if (checkbox.disabled()) classes.push(styles.disabled);
        if (local.class) classes.push(local.class);
        return classes.join(' ');
    };

    const boxClasses = () => {
        const classes = [styles.checkbox];
        if (checkbox.checked()) classes.push(styles.checked);
        if (checkbox.indeterminate()) classes.push(styles.indeterminate);
        return classes.join(' ');
    };

    return (
        <label class={containerClasses()}>
            <span
                {...checkbox.rootProps()}
                class={boxClasses()}
            >
                {/* Checkmark SVG */}
                {checkbox.checked() && !checkbox.indeterminate() && (
                    <svg viewBox="0 0 24 24" class={styles.icon}>
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                )}
                {/* Indeterminate dash */}
                {checkbox.indeterminate() && (
                    <svg viewBox="0 0 24 24" class={styles.icon}>
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                )}
            </span>
            {local.children && (
                <span class={styles.label}>{local.children}</span>
            )}
        </label>
    );
};
