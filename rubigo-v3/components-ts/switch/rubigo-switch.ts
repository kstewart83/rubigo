/**
 * Rubigo Switch Web Component
 *
 * A spec-driven toggle switch component built on the statechart interpreter.
 * Usage: <rubigo-switch checked disabled></rubigo-switch>
 */

import { createMachine } from '../statechart';
import { switchConfig, createSwitchConfig, type SwitchContext } from './config';

/**
 * <rubigo-switch> Custom Element
 *
 * Attributes:
 * - checked: boolean - Toggle state
 * - disabled: boolean - Prevents interaction
 * - readonly: boolean - Prevents changes but allows focus
 *
 * Events:
 * - change: Fired when checked state changes
 */
export class RubigoSwitch extends HTMLElement {
    private machine = createMachine(switchConfig);
    private internals: ElementInternals;

    static formAssociated = true;
    static observedAttributes = ['checked', 'disabled', 'readonly'];

    constructor() {
        super();
        this.internals = this.attachInternals();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.syncAttributesToContext();
    }

    attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null) {
        const ctx = this.machine.getContext();
        const hasAttr = newValue !== null;

        switch (name) {
            case 'checked':
                if (ctx.checked !== hasAttr) {
                    (this.machine as any).context.checked = hasAttr;
                    this.render();
                }
                break;
            case 'disabled':
                (this.machine as any).context.disabled = hasAttr;
                this.render();
                break;
            case 'readonly':
                (this.machine as any).context.readOnly = hasAttr;
                this.render();
                break;
        }
    }

    private syncAttributesToContext() {
        const ctx = this.machine as any;
        ctx.context.checked = this.hasAttribute('checked');
        ctx.context.disabled = this.hasAttribute('disabled');
        ctx.context.readOnly = this.hasAttribute('readonly');
    }

    private setupEventListeners() {
        const root = this.shadowRoot!;
        const button = root.querySelector('button')!;

        button.addEventListener('click', () => this.toggle());
        button.addEventListener('focus', () => this.machine.send('FOCUS'));
        button.addEventListener('blur', () => this.machine.send('BLUR'));
        button.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    toggle() {
        const prevChecked = this.machine.getContext().checked;
        const result = this.machine.send('TOGGLE');

        if (result.handled) {
            const newChecked = this.machine.getContext().checked;
            if (prevChecked !== newChecked) {
                if (newChecked) {
                    this.setAttribute('checked', '');
                } else {
                    this.removeAttribute('checked');
                }
                this.dispatchEvent(new CustomEvent('change', {
                    bubbles: true,
                    detail: { checked: newChecked },
                }));
            }
            this.render();
        }
    }

    get checked(): boolean {
        return this.machine.getContext().checked;
    }

    set checked(value: boolean) {
        if (value) {
            this.setAttribute('checked', '');
        } else {
            this.removeAttribute('checked');
        }
    }

    get disabled(): boolean {
        return this.machine.getContext().disabled;
    }

    set disabled(value: boolean) {
        if (value) {
            this.setAttribute('disabled', '');
        } else {
            this.removeAttribute('disabled');
        }
    }

    private render() {
        const ctx = this.machine.getContext();

        this.shadowRoot!.innerHTML = `
      <style>
        :host { display: inline-block; }
        button {
          position: relative;
          width: 44px;
          height: 24px;
          padding: 2px;
          border: none;
          border-radius: 12px;
          background: ${ctx.checked ? '#22c55e' : '#e5e7eb'};
          cursor: ${ctx.disabled ? 'not-allowed' : 'pointer'};
          opacity: ${ctx.disabled ? 0.5 : 1};
          transition: background-color 0.2s ease;
          outline: none;
        }
        button:focus-visible {
          box-shadow: 0 0 0 2px #fff, 0 0 0 4px #3b82f6;
        }
        .thumb {
          position: absolute;
          top: 2px;
          left: ${ctx.checked ? '22px' : '2px'};
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          transition: left 0.2s ease;
        }
      </style>
      <button role="switch" aria-checked="${ctx.checked}" aria-disabled="${ctx.disabled}" tabindex="${ctx.disabled ? -1 : 0}">
        <span class="thumb"></span>
      </button>
    `;

        const button = this.shadowRoot!.querySelector('button')!;
        button.addEventListener('click', () => this.toggle());
        button.addEventListener('focus', () => this.machine.send('FOCUS'));
        button.addEventListener('blur', () => this.machine.send('BLUR'));
        button.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                this.toggle();
            }
        });
    }
}

if (typeof customElements !== 'undefined') {
    customElements.define('rubigo-switch', RubigoSwitch);
}
