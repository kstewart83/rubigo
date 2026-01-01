/**
 * Examples Registry
 * 
 * Central import point for all generated component examples.
 * These are AUTO-GENERATED from spec files by scripts/generate-examples.sh
 */
import { Component } from 'solid-js';
import { buttonExamples } from '../generated-examples/button.examples';
import { checkboxExamples } from '../generated-examples/checkbox.examples';
import { switchExamples } from '../generated-examples/switch.examples';
import { inputExamples } from '../generated-examples/input.examples';
import { tabsExamples } from '../generated-examples/tabs.examples';
import { sliderExamples } from '../generated-examples/slider.examples';
import { collapsibleExamples } from '../generated-examples/collapsible.examples';
import { togglegroupExamples } from '../generated-examples/togglegroup.examples';
import { tooltipExamples } from '../generated-examples/tooltip.examples';
import { dialogExamples } from '../generated-examples/dialog.examples';
import { selectExamples } from '../generated-examples/select.examples';

export interface Example {
    name: string;
    description: string;
    component: Component;
    source: string;
}

// Registry of all component examples
export const EXAMPLES: Record<string, Example[]> = {
    button: buttonExamples,
    checkbox: checkboxExamples,
    switch: switchExamples,
    input: inputExamples,
    tabs: tabsExamples,
    slider: sliderExamples,
    collapsible: collapsibleExamples,
    togglegroup: togglegroupExamples,
    tooltip: tooltipExamples,
    dialog: dialogExamples,
    select: selectExamples,
};

// Helper to get examples for a component
export function getExamplesFor(component: string): Example[] {
    return EXAMPLES[component] ?? [];
}
