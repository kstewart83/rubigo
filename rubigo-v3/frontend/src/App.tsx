import { createSignal, onMount, createEffect, Show } from 'solid-js';
import { createMachine } from '../../components-ts/statechart';
import { createSwitchConfig, type SwitchContext } from '../../components-ts/switch/config';

// TypeScript reactive wrapper
function createReactiveSwitch(overrides?: Partial<SwitchContext>) {
  const machine = createMachine(createSwitchConfig(overrides));
  const [version, setVersion] = createSignal(0);
  const bump = () => setVersion((v) => v + 1);

  return {
    checked: () => { version(); return machine.getContext().checked; },
    disabled: () => { version(); return machine.getContext().disabled; },
    state: () => { version(); return machine.getState(); },
    toggle: () => { machine.send('TOGGLE'); bump(); },
    focus: () => { machine.send('FOCUS'); bump(); },
    blur: () => { machine.send('BLUR'); bump(); },
  };
}

// WASM reactive wrapper
function createWasmSwitch(wasmMachine: any) {
  const [version, setVersion] = createSignal(0);
  const bump = () => setVersion((v) => v + 1);

  return {
    checked: () => { version(); return wasmMachine.getContext()?.checked ?? false; },
    disabled: () => { version(); return wasmMachine.getContext()?.disabled ?? false; },
    state: () => { version(); return wasmMachine.currentState(); },
    toggle: () => { wasmMachine.send('TOGGLE'); bump(); },
    focus: () => { wasmMachine.send('FOCUS'); bump(); },
    blur: () => { wasmMachine.send('BLUR'); bump(); },
  };
}

// Switch component (works with either TS or WASM)
function StatechartSwitch(props: {
  switch: {
    checked: () => boolean;
    disabled: () => boolean;
    state: () => string;
    toggle: () => void;
    focus: () => void;
    blur: () => void;
  };
  label: string;
}) {
  const sw = props.switch;

  return (
    <div style={{ display: 'flex', 'align-items': 'center', gap: '1rem' }}>
      <button
        role="switch"
        aria-checked={sw.checked()}
        onClick={() => sw.toggle()}
        onFocus={() => sw.focus()}
        onBlur={() => sw.blur()}
        style={{
          position: 'relative',
          width: '44px',
          height: '24px',
          padding: '2px',
          border: 'none',
          'border-radius': '12px',
          background: sw.checked() ? '#22c55e' : '#e5e7eb',
          cursor: sw.disabled() ? 'not-allowed' : 'pointer',
          opacity: sw.disabled() ? 0.5 : 1,
          transition: 'background-color 0.2s ease',
          outline: 'none',
        }}
      >
        <span style={{
          position: 'absolute',
          top: '2px',
          left: sw.checked() ? '22px' : '2px',
          width: '20px',
          height: '20px',
          'border-radius': '50%',
          background: 'white',
          'box-shadow': '0 1px 3px rgba(0,0,0,0.2)',
          transition: 'left 0.2s ease',
        }} />
      </button>
      <div>
        <div>{props.label}</div>
        <div style={{ 'font-size': '0.75rem', color: '#666' }}>
          State: <code>{sw.state()}</code> | Checked: <code>{sw.checked().toString()}</code>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [apiStatus, setApiStatus] = createSignal('checking...');
  const [wasmStatus, setWasmStatus] = createSignal<'loading' | 'ready' | 'error'>('loading');
  const [wasmSwitches, setWasmSwitches] = createSignal<any[]>([]);

  // Create TS switches
  const tsSwitch1 = createReactiveSwitch();
  const tsSwitch2 = createReactiveSwitch({ checked: true });
  const tsSwitch3 = createReactiveSwitch({ disabled: true });

  onMount(async () => {
    // Check API
    try {
      const res = await fetch('/api/health');
      setApiStatus(res.ok ? 'Connected' : 'Error');
    } catch {
      setApiStatus('Offline');
    }

    // Load WASM
    try {
      // Dynamic import of the WASM module from src/wasm/
      const wasmModule = await import('./wasm/rubigo_statechart.js');
      await wasmModule.default();

      // Create switch config JSON
      const switchConfigJson = JSON.stringify({
        machine: {
          id: "switch",
          initial: "idle",
          context: { checked: false, disabled: false, readOnly: false, focused: false },
          states: {
            idle: {
              on: {
                FOCUS: { target: "focused", actions: ["setFocused"] },
                TOGGLE: { target: "idle", actions: ["toggle"], guard: "canToggle" }
              }
            },
            focused: {
              on: {
                BLUR: { target: "idle", actions: ["clearFocused"] },
                TOGGLE: { target: "focused", actions: ["toggle"], guard: "canToggle" }
              }
            }
          }
        },
        guards: { canToggle: "!context.disabled && !context.readOnly" },
        actions: {
          toggle: { mutation: "context.checked = !context.checked" },
          setFocused: { mutation: "context.focused = true" },
          clearFocused: { mutation: "context.focused = false" }
        }
      });

      // Create WASM switches
      const sw1 = new wasmModule.WasmMachine(switchConfigJson);
      const sw2 = new wasmModule.WasmMachine(switchConfigJson);
      sw2.setContextBool('checked', true);
      const sw3 = new wasmModule.WasmMachine(switchConfigJson);
      sw3.setContextBool('disabled', true);

      setWasmSwitches([
        createWasmSwitch(sw1),
        createWasmSwitch(sw2),
        createWasmSwitch(sw3),
      ]);

      setWasmStatus('ready');
    } catch (e) {
      console.error('WASM load error:', e);
      setWasmStatus('error');
    }
  });

  return (
    <div style={{ padding: '2rem', 'font-family': 'system-ui', 'max-width': '900px', margin: '0 auto' }}>
      <h1 style={{ 'margin-bottom': '0.5rem' }}>Rubigo V3 Component Demo</h1>
      <p style={{ color: '#666', 'margin-bottom': '2rem' }}>
        Same spec → Multiple implementations (TypeScript and WASM)
      </p>

      <div style={{
        background: '#f8fafc',
        padding: '1rem',
        'border-radius': '8px',
        'margin-bottom': '2rem',
        display: 'flex',
        gap: '2rem',
      }}>
        <div><strong>API:</strong> {apiStatus()}</div>
        <div><strong>WASM:</strong> {wasmStatus()}</div>
      </div>

      {/* TypeScript Implementation */}
      <div style={{
        border: '2px solid #3b82f6',
        'border-radius': '12px',
        padding: '1.5rem',
        'margin-bottom': '2rem',
      }}>
        <div style={{ display: 'flex', 'align-items': 'center', gap: '0.75rem', 'margin-bottom': '1.5rem' }}>
          <span style={{
            background: '#3b82f6',
            color: 'white',
            padding: '0.25rem 0.75rem',
            'border-radius': '999px',
            'font-size': '0.75rem',
            'font-weight': '600',
          }}>TypeScript</span>
          <h2 style={{ margin: 0 }}>Statechart Interpreter</h2>
        </div>

        <p style={{ color: '#666', 'margin-bottom': '1.5rem' }}>
          <code>components-ts/statechart/machine.ts</code> (~23M events/sec)
        </p>

        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '1rem' }}>
          <StatechartSwitch switch={tsSwitch1} label="Default switch" />
          <StatechartSwitch switch={tsSwitch2} label="Initially checked" />
          <StatechartSwitch switch={tsSwitch3} label="Disabled (guard blocks toggle)" />
        </div>
      </div>

      {/* WASM Implementation */}
      <div style={{
        border: wasmStatus() === 'ready' ? '2px solid #f97316' : '2px dashed #94a3b8',
        'border-radius': '12px',
        padding: '1.5rem',
        'margin-bottom': '2rem',
        opacity: wasmStatus() === 'ready' ? 1 : 0.7,
      }}>
        <div style={{ display: 'flex', 'align-items': 'center', gap: '0.75rem', 'margin-bottom': '1.5rem' }}>
          <span style={{
            background: '#f97316',
            color: 'white',
            padding: '0.25rem 0.75rem',
            'border-radius': '999px',
            'font-size': '0.75rem',
            'font-weight': '600',
          }}>WASM</span>
          <h2 style={{ margin: 0 }}>Rust Implementation</h2>
          <Show when={wasmStatus() === 'loading'}>
            <span style={{
              background: '#fef3c7',
              color: '#92400e',
              padding: '0.25rem 0.5rem',
              'border-radius': '4px',
              'font-size': '0.7rem',
            }}>Loading...</span>
          </Show>
          <Show when={wasmStatus() === 'error'}>
            <span style={{
              background: '#fee2e2',
              color: '#b91c1c',
              padding: '0.25rem 0.5rem',
              'border-radius': '4px',
              'font-size': '0.7rem',
            }}>Error</span>
          </Show>
        </div>

        <p style={{ color: '#666', 'margin-bottom': '1.5rem' }}>
          <code>components-rs/statechart</code> compiled to WebAssembly (267KB)
        </p>

        <Show when={wasmStatus() === 'ready' && wasmSwitches().length > 0} fallback={
          <p style={{ color: '#94a3b8' }}>
            {wasmStatus() === 'loading' ? 'Loading WASM module...' :
              wasmStatus() === 'error' ? 'Failed to load WASM. Check console for errors.' :
                'Initializing...'}
          </p>
        }>
          <div style={{ display: 'flex', 'flex-direction': 'column', gap: '1rem' }}>
            <StatechartSwitch switch={wasmSwitches()[0]} label="Default switch (WASM)" />
            <StatechartSwitch switch={wasmSwitches()[1]} label="Initially checked (WASM)" />
            <StatechartSwitch switch={wasmSwitches()[2]} label="Disabled (WASM)" />
          </div>
        </Show>
      </div>

      {/* Architecture */}
      <div style={{
        background: '#f0fdf4',
        'border-radius': '8px',
        padding: '1.5rem',
        'border-left': '4px solid #22c55e',
      }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>Architecture</h3>
        <div style={{ display: 'grid', 'grid-template-columns': 'auto 1fr', gap: '0.5rem 1rem', 'font-size': '0.9rem' }}>
          <strong>Spec:</strong><code>specifications/switch/switch.sudo.md</code>
          <strong>Generated:</strong><code>generated/switch.json</code>
          <strong>TS Interpreter:</strong><code>components-ts/statechart/machine.ts</code>
          <strong>WASM Interpreter:</strong><code>components-rs/statechart/src/wasm.rs</code>
        </div>
      </div>
    </div>
  );
}

export default App;
