/**
 * Input Component
 * 
 * A text input component for user data entry.
 */
import { Component, splitProps, JSX } from 'solid-js';
import { useInput, type UseInputOptions } from './useInput';
import styles from '../../Input.module.css';

export interface InputProps extends UseInputOptions {
    /** Additional CSS class */
    class?: string;
}

export const Input: Component<InputProps> = (props) => {
    const [local, inputOptions] = splitProps(props, ['class']);

    const { focused, disabled, hasError, inputProps } = useInput(inputOptions);

    const inputClass = () => {
        const classes = [styles.input];
        if (focused()) classes.push(styles.focused);
        if (disabled()) classes.push(styles.disabled);
        if (hasError()) classes.push(styles.error);
        if (local.class) classes.push(local.class);
        return classes.join(' ');
    };

    return (
        <input
            class={inputClass()}
            {...inputProps()}
        />
    );
};
