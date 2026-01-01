/**
 * Switch Component
 * 
 * A toggle switch component for boolean on/off states.
 */
import { Component, splitProps, JSX } from 'solid-js';
import { useSwitch, type UseSwitchOptions } from './useSwitch';
import styles from '../../Switch.module.css';

export interface SwitchProps extends UseSwitchOptions {
    /** Additional CSS class */
    class?: string;
    /** Label text */
    children?: JSX.Element;
}

export const Switch: Component<SwitchProps> = (props) => {
    const [local, switchOptions] = splitProps(props, ['class', 'children']);

    const { checked, disabled, focused, rootProps } = useSwitch(switchOptions);

    const containerClass = () => {
        const classes = [styles.container];
        if (local.class) classes.push(local.class);
        return classes.join(' ');
    };

    const switchClass = () => {
        const classes = [styles.switch];
        if (checked()) classes.push(styles.checked);
        if (disabled()) classes.push(styles.disabled);
        if (focused()) classes.push(styles.focused);
        return classes.join(' ');
    };

    return (
        <label class={containerClass()}>
            <button
                type="button"
                class={switchClass()}
                {...rootProps()}
            >
                <span class={styles.thumb} />
            </button>
            {local.children && (
                <span class={styles.label}>{local.children}</span>
            )}
        </label>
    );
};
