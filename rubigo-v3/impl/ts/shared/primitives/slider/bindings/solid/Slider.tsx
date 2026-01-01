/**
 * Slider Component
 */
import { Component, splitProps } from 'solid-js';
import { useSlider, type UseSliderOptions } from './useSlider';
import styles from '../../Slider.module.css';

export interface SliderProps extends UseSliderOptions {
    class?: string;
}

export const Slider: Component<SliderProps> = (props) => {
    const [local, sliderOptions] = splitProps(props, ['class']);
    const slider = useSlider(sliderOptions);

    const rootClass = () => {
        const classes = [styles.root];
        if (slider.disabled()) classes.push(styles.disabled);
        if (slider.dragging()) classes.push(styles.dragging);
        if (local.class) classes.push(local.class);
        return classes.join(' ');
    };

    return (
        <div class={rootClass()}>
            <div class={styles.track} {...slider.trackProps()}>
                <div
                    class={styles.range}
                    style={{ width: `${slider.percentage()}%` }}
                />
                <div
                    class={styles.thumb}
                    style={{ left: `${slider.percentage()}%` }}
                    {...slider.thumbProps()}
                />
            </div>
        </div>
    );
};
