/**
 * Rubigo Statechart Interpreter
 *
 * TypeScript implementation that mirrors the Rust interpreter.
 * Both implementations MUST conform to spec/interpreter/statechart.sudo.md
 */

// === Types ===

/** Guard function signature - receives context, returns boolean */
export type GuardFn<TContext> = (ctx: TContext, event?: Event) => boolean;

/** Action function signature - receives context, mutates it, optionally returns emitted events */
export type ActionFn<TContext> = (ctx: TContext, event?: Event) => void | string[];

/** Action can be a closure OR a config with mutation string (for simple cases) */
export type ActionDef<TContext> = ActionFn<TContext> | ActionConfig;

/** Guard can be a closure OR a string expression (for simple cases) */
export type GuardDef<TContext> = GuardFn<TContext> | string;

export interface MachineConfig<TContext extends object = Record<string, unknown>> {
    id: string;
    initial: string;
    context: TContext;
    states: Record<string, StateConfig>;
    guards?: Record<string, GuardDef<TContext>>;
    actions?: Record<string, ActionDef<TContext>>;
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
    emittedEvents?: string[];
}

// === Machine Class ===

export class Machine<TContext extends object = Record<string, unknown>> {
    readonly id: string;
    private currentState: string;
    private context: TContext;
    private readonly config: MachineConfig<TContext>;
    private readonly actionCache = new Map<string, ActionFn<TContext>>();
    private readonly guardCache = new Map<string, GuardFn<TContext>>();

    constructor(config: MachineConfig<TContext>) {
        this.id = config.id;
        this.currentState = config.initial;
        this.context = { ...config.context };
        this.config = config;

        // Process guards: store closures or compile strings
        for (const [name, guard] of Object.entries(config.guards || {})) {
            if (typeof guard === 'function') {
                this.guardCache.set(name, guard);
            } else {
                // Compile string expression to closure
                this.guardCache.set(name, this.compileGuard(guard));
            }
        }

        // Process actions: store closures or compile mutation strings
        for (const [name, action] of Object.entries(config.actions || {})) {
            if (typeof action === 'function') {
                this.actionCache.set(name, action);
            } else if (action.mutation) {
                this.actionCache.set(name, this.compileMutation(action.mutation));
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
     * Evaluate a guard by name
     */
    private evaluateGuard(guardName: string, event?: Event): boolean {
        const guardFn = this.guardCache.get(guardName);
        if (!guardFn) {
            console.warn(`Unknown guard: ${guardName}`);
            return false;
        }

        try {
            return guardFn(this.context, event);
        } catch (e) {
            console.warn(`Guard ${guardName} threw error:`, e);
            return false;
        }
    }

    /**
     * Compile a string guard expression to a closure
     */
    private compileGuard(expr: string): GuardFn<TContext> {
        return (ctx: TContext) => {
            try {
                const context = ctx as Record<string, unknown>;
                const processed = expr.replace(/context\.(\w+)/g, (_, key: string) => {
                    return JSON.stringify(context[key]);
                });
                const fn = new Function(`return (${processed})`);
                return Boolean(fn());
            } catch (e) {
                console.warn(`Failed to evaluate guard expression: ${expr}`, e);
                return false;
            }
        };
    }

    /**
     * Compile a mutation string to an action closure
     * Supports: single assignment "context.X = Y" or multi-statement "context.X = Y; context.Z = W"
     */
    private compileMutation(mutation: string): ActionFn<TContext> {
        const statements = mutation.split(';').map(s => s.trim()).filter(s => s);
        const assignments: Array<{ key: string; valueExpr: string }> = [];

        for (const stmt of statements) {
            const match = stmt.match(/^context\.(\w+)\s*=\s*(.+)$/);
            if (!match) {
                console.warn(`Invalid mutation format: ${stmt}`);
                continue;
            }
            assignments.push({ key: match[1], valueExpr: match[2] });
        }

        return (ctx: TContext) => {
            const context = ctx as Record<string, unknown>;
            for (const { key, valueExpr } of assignments) {
                try {
                    const fn = new Function('ctx', `
                        return (${valueExpr.replace(/context\.(\w+)/g, 'ctx.$1')});
                    `) as (ctx: Record<string, unknown>) => unknown;
                    context[key] = fn(context);
                } catch (e) {
                    console.warn(`Failed to execute mutation for ${key}: ${valueExpr}`, e);
                }
            }
        };
    }

    /**
     * Execute an action by name
     */
    private executeAction(actionName: string, event?: Event): string[] | void {
        const actionFn = this.actionCache.get(actionName);
        if (actionFn) {
            try {
                return actionFn(this.context, event);
            } catch (e) {
                console.warn(`Action ${actionName} threw error:`, e);
            }
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
