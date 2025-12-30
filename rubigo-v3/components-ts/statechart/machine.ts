/**
 * Rubigo Statechart Interpreter
 *
 * TypeScript implementation that mirrors the Rust interpreter.
 * Both implementations MUST conform to spec/interpreter/statechart.sudo.md
 */

// === Types ===

export interface MachineConfig<TContext extends object = Record<string, unknown>> {
    id: string;
    initial: string;
    context: TContext;
    states: Record<string, StateConfig>;
    guards?: Record<string, string>;
    actions?: Record<string, ActionConfig>;
}

export interface StateConfig {
    entry?: string[];
    exit?: string[];
    on: Record<string, TransitionConfig | string>;
}

export interface TransitionConfig {
    target: string;
    actions?: string[];
    guard?: string;
}

export interface ActionConfig {
    mutation?: string;
    description?: string;
    emits?: string[];
}

export interface Event {
    name: string;
    payload?: Record<string, unknown>;
}

export interface TransitionResult {
    handled: boolean;
    newState?: string;
    actionsExecuted: string[];
}

// === Machine Class ===

export class Machine<TContext extends object = Record<string, unknown>> {
    readonly id: string;
    private currentState: string;
    private context: TContext;
    private readonly config: MachineConfig<TContext>;
    private readonly mutationCache = new Map<string, (ctx: Record<string, unknown>) => unknown>();

    constructor(config: MachineConfig<TContext>) {
        this.id = config.id;
        this.currentState = config.initial;
        this.context = { ...config.context };
        this.config = config;

        // Pre-compile all mutations
        for (const [name, action] of Object.entries(config.actions || {})) {
            if (action.mutation) {
                this.compileMutation(name, action.mutation);
            }
        }
    }

    /** Get the current state */
    getState(): string {
        return this.currentState;
    }

    /** Get the current context */
    getContext(): TContext {
        return { ...this.context };
    }

    /** Check if the machine is in a specific state */
    isInState(state: string): boolean {
        return this.currentState === state;
    }

    /**
     * Send an event to the machine
     * Returns the transition result
     */
    send(event: Event | string): TransitionResult {
        const eventObj: Event = typeof event === 'string' ? { name: event } : event;
        const result: TransitionResult = {
            handled: false,
            actionsExecuted: [],
        };

        // 1. Get current state config
        const stateConfig = this.config.states[this.currentState];
        if (!stateConfig) {
            return result;
        }

        // 2. Find transition for this event
        const transitionDef = stateConfig.on[eventObj.name];
        if (!transitionDef) {
            return result;
        }

        // 3. Normalize transition config
        const transition: TransitionConfig =
            typeof transitionDef === 'string'
                ? { target: transitionDef }
                : transitionDef;

        // 4. Evaluate guard (if present)
        if (transition.guard) {
            const guardPasses = this.evaluateGuard(transition.guard);
            if (!guardPasses) {
                return result;
            }
        }

        // 5. Execute exit actions
        if (stateConfig.exit) {
            for (const actionName of stateConfig.exit) {
                this.executeAction(actionName);
                result.actionsExecuted.push(actionName);
            }
        }

        // 6. Execute transition actions
        if (transition.actions) {
            for (const actionName of transition.actions) {
                this.executeAction(actionName);
                result.actionsExecuted.push(actionName);
            }
        }

        // 7. Update state
        this.currentState = transition.target;
        result.newState = transition.target;
        result.handled = true;

        // 8. Execute entry actions
        const newStateConfig = this.config.states[this.currentState];
        if (newStateConfig?.entry) {
            for (const actionName of newStateConfig.entry) {
                this.executeAction(actionName);
                result.actionsExecuted.push(actionName);
            }
        }

        return result;
    }

    /**
     * Evaluate a guard expression against the context
     */
    private evaluateGuard(guardName: string): boolean {
        // Look up guard expression
        const guardExpr = this.config.guards?.[guardName];
        if (!guardExpr) {
            // Unknown guard, default to false (safe)
            console.warn(`Unknown guard: ${guardName}`);
            return false;
        }

        return this.evaluateExpression(guardExpr);
    }

    /**
     * Evaluate a boolean expression against the context
     * Supports: context.X, &&, ||, !, ===, !==, parentheses
     */
    private evaluateExpression(expr: string): boolean {
        const context = this.context as Record<string, unknown>;

        try {
            const processed = expr.replace(/context\.(\w+)/g, (_, key: string) => {
                const value = context[key];
                return JSON.stringify(value);
            });

            const fn = new Function(`return (${processed})`);
            return Boolean(fn());
        } catch (e) {
            console.warn(`Failed to evaluate expression: ${expr}`, e);
            return false;
        }
    }

    /**
     * Pre-compile a mutation for fast execution
     */
    private compileMutation(actionName: string, mutation: string): void {
        // Parse: "context.X = Y"
        const match = mutation.match(/^context\.(\w+)\s*=\s*(.+)$/);
        if (!match) {
            console.warn(`Invalid mutation format: ${mutation}`);
            return;
        }

        const [, key, valueExpr] = match;

        // Create a function that takes context and returns the new value
        // We need to handle context.X references dynamically
        const fn = new Function('ctx', `
            return (${valueExpr.replace(/context\.(\w+)/g, 'ctx.$1')});
        `) as (ctx: Record<string, unknown>) => unknown;

        // Store with key info
        this.mutationCache.set(actionName, (ctx) => {
            ctx[key] = fn(ctx);
            return ctx[key];
        });
    }

    /**
     * Execute an action by name
     */
    private executeAction(actionName: string): void {
        const cachedMutation = this.mutationCache.get(actionName);
        if (cachedMutation) {
            cachedMutation(this.context as Record<string, unknown>);
        }
    }

    /**
     * Create a new machine from a JSON config file
     */
    static fromJSON<T extends object>(json: MachineConfig<T>): Machine<T> {
        return new Machine(json);
    }
}

// === Factory Functions ===

/**
 * Create a machine from a config object
 */
export function createMachine<T extends object>(
    config: MachineConfig<T>
): Machine<T> {
    return new Machine(config);
}
