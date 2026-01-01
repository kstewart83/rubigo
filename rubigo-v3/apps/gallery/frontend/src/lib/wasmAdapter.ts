/**
 * WASM Component Adapter
 * 
 * Provides a unified interface for dynamically loading and using WASM components
 * in the Gallery when engine='wasm' is selected.
 */

import { createSignal, onCleanup, createEffect } from 'solid-js';

// Cache for loaded WASM modules
const wasmModules: Map<string, any> = new Map();
const wasmInstances: Map<string, any> = new Map();

/**
 * Dynamically load a WASM component module
 */
export async function loadWasmComponent(componentName: string): Promise<any> {
    const normalizedName = componentName.toLowerCase();

    // Return cached module if already loaded
    if (wasmModules.has(normalizedName)) {
        return wasmModules.get(normalizedName);
    }

    try {
        // Dynamic import of the WASM bindings
        const module = await import(`/wasm/${normalizedName}/${normalizedName}.js`);

        // Initialize WASM
        await module.default();

        wasmModules.set(normalizedName, module);
        return module;
    } catch (e) {
        console.warn(`WASM module for ${normalizedName} not available:`, e);
        return null;
    }
}

/**
 * Create a WASM component instance
 */
export function createWasmInstance(module: any, componentName: string): any {
    const className = componentName.charAt(0).toUpperCase() + componentName.slice(1).toLowerCase();
    const ComponentClass = module[className];

    if (!ComponentClass) {
        console.warn(`Class ${className} not found in WASM module`);
        return null;
    }

    return new ComponentClass();
}

/**
 * Hook for using a WASM component in the Gallery
 * Returns reactive state and action dispatch function
 */
export function useWasmComponent(componentName: string | undefined, engine: 'ts' | 'wasm') {
    const [wasmReady, setWasmReady] = createSignal(false);
    const [wasmInstance, setWasmInstance] = createSignal<any>(null);
    const [context, setContext] = createSignal<Record<string, any>>({});
    const [stateName, setStateName] = createSignal('idle');

    // Load WASM when engine changes to 'wasm'
    createEffect(async () => {
        if (engine === 'wasm' && componentName) {
            const normalizedName = componentName.toLowerCase();
            const cacheKey = normalizedName;

            // Check for cached instance
            if (wasmInstances.has(cacheKey)) {
                const instance = wasmInstances.get(cacheKey);
                setWasmInstance(instance);
                syncState(instance);
                setWasmReady(true);
                return;
            }

            try {
                const module = await loadWasmComponent(normalizedName);
                if (module) {
                    const instance = createWasmInstance(module, normalizedName);
                    if (instance) {
                        wasmInstances.set(cacheKey, instance);
                        setWasmInstance(instance);
                        syncState(instance);
                        setWasmReady(true);
                    }
                }
            } catch (e) {
                console.error(`Failed to load WASM for ${componentName}:`, e);
                setWasmReady(false);
            }
        } else {
            setWasmReady(false);
        }
    });

    // Sync state from WASM instance
    function syncState(instance: any) {
        if (!instance) return;

        try {
            // Get context as JSON
            const ctxJson = instance.context_json;
            if (ctxJson) {
                setContext(JSON.parse(ctxJson));
            }

            // Get state name
            const state = instance.state_name;
            if (state) {
                setStateName(state);
            }
        } catch (e) {
            console.warn('Error syncing WASM state:', e);
        }
    }

    // Dispatch an action to WASM
    function dispatch(action: string, payload?: any): boolean {
        const instance = wasmInstance();
        if (!instance) return false;

        try {
            // Map action names to method names
            const methodName = actionToMethod(action);

            if (typeof instance[methodName] === 'function') {
                const result = instance[methodName](payload);
                syncState(instance);
                return result;
            } else {
                console.warn(`Method ${methodName} not found on WASM instance`);
                return false;
            }
        } catch (e) {
            console.error(`Error dispatching ${action}:`, e);
            return false;
        }
    }

    // Cleanup instance on unmount
    onCleanup(() => {
        const instance = wasmInstance();
        if (instance && typeof instance.free === 'function') {
            // Don't free - keep cached for reuse
            // instance.free();
        }
    });

    return {
        ready: wasmReady,
        context,
        stateName,
        dispatch
    };
}

/**
 * Map action names to WASM method names
 */
function actionToMethod(action: string): string {
    // Common mappings
    const mappings: Record<string, string> = {
        'focus': 'set_focused',
        'blur': 'clear_focused',
        'setFocused': 'set_focused',
        'clearFocused': 'clear_focused',
    };

    if (mappings[action]) {
        return mappings[action];
    }

    // Convert camelCase to snake_case
    return action.replace(/([A-Z])/g, '_$1').toLowerCase();
}
