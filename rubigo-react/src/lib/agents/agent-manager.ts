/**
 * Agent Manager - Main thread interface for agent simulation
 * 
 * Provides a clean API for controlling the agent simulation from
 * React components or server actions.
 */

import type {
    WorkerCommand,
    WorkerResponse,
    SimulationConfig,
    AgentRuntimeState,
    ScheduledEvent,
} from "./agent-types";
import { DEFAULT_SIMULATION_CONFIG } from "./agent-types";

export interface AgentManagerOptions {
    workerPath?: string;
    onStatusChange?: (status: SimulationStatus) => void;
    onAgentUpdate?: (agents: AgentRuntimeState[]) => void;
    onError?: (error: string) => void;
}

export interface SimulationStatus {
    running: boolean;
    agentCount: number;
    pendingEvents: number;
    lastUpdate: string;
}

/**
 * AgentManager - Controls the agent simulation worker
 */
export class AgentManager {
    private worker: Worker | null = null;
    private status: SimulationStatus = {
        running: false,
        agentCount: 0,
        pendingEvents: 0,
        lastUpdate: new Date().toISOString(),
    };
    private agents: AgentRuntimeState[] = [];
    private options: AgentManagerOptions;
    private responseHandlers: Map<string, (response: WorkerResponse) => void> = new Map();

    constructor(options: AgentManagerOptions = {}) {
        this.options = options;
    }

    /**
     * Start the worker and simulation
     */
    async start(config: Partial<SimulationConfig> = {}): Promise<boolean> {
        try {
            // Create worker if not exists
            if (!this.worker) {
                // In Next.js/Bun, we need to handle worker creation carefully
                const workerPath = this.options.workerPath || new URL("./agent-worker.ts", import.meta.url);
                this.worker = new Worker(workerPath);
                this.setupWorkerListeners();
            }

            // Send start command
            return new Promise((resolve) => {
                const handler = (response: WorkerResponse) => {
                    if (response.type === "started") {
                        this.status = {
                            running: true,
                            agentCount: response.agentCount,
                            pendingEvents: 0,
                            lastUpdate: new Date().toISOString(),
                        };
                        this.options.onStatusChange?.(this.status);
                        resolve(true);
                    } else if (response.type === "error") {
                        this.options.onError?.(response.message);
                        resolve(false);
                    }
                };

                this.addResponseHandler("start", handler);
                this.sendCommand({ type: "start", config: { ...DEFAULT_SIMULATION_CONFIG, ...config } });
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.options.onError?.(message);
            return false;
        }
    }

    /**
     * Stop the simulation
     */
    async stop(): Promise<void> {
        if (!this.worker) return;

        return new Promise((resolve) => {
            const handler = (response: WorkerResponse) => {
                if (response.type === "stopped") {
                    this.status = {
                        ...this.status,
                        running: false,
                        lastUpdate: new Date().toISOString(),
                    };
                    this.options.onStatusChange?.(this.status);
                    resolve();
                }
            };

            this.addResponseHandler("stop", handler);
            this.sendCommand({ type: "stop" });
        });
    }

    /**
     * Trigger a manual tick
     */
    async tick(): Promise<{ processed: number; pending: number }> {
        if (!this.worker) {
            return { processed: 0, pending: 0 };
        }

        return new Promise((resolve) => {
            const handler = (response: WorkerResponse) => {
                if (response.type === "tick_complete") {
                    this.status.pendingEvents = response.pending;
                    this.status.lastUpdate = new Date().toISOString();
                    this.options.onStatusChange?.(this.status);
                    resolve({ processed: response.processed, pending: response.pending });
                }
            };

            this.addResponseHandler("tick", handler);
            this.sendCommand({ type: "tick" });
        });
    }

    /**
     * Trigger an event for a specific agent
     */
    async triggerEvent(
        agentId: string,
        eventType: ScheduledEvent["eventType"],
        payload: Record<string, unknown> = {}
    ): Promise<void> {
        if (!this.worker) return;

        this.sendCommand({
            type: "trigger",
            agentId,
            event: {
                eventType,
                payload,
                scheduledFor: Date.now(),
                tier: "near_sync", // Default tier
            },
        });
    }

    /**
     * Get current status
     */
    async getStatus(): Promise<{ running: boolean; agents: AgentRuntimeState[] }> {
        if (!this.worker) {
            return { running: false, agents: [] };
        }

        return new Promise((resolve) => {
            const handler = (response: WorkerResponse) => {
                if (response.type === "status") {
                    this.agents = response.agents;
                    this.status.running = response.running;
                    this.status.agentCount = response.agents.length;
                    this.status.lastUpdate = new Date().toISOString();
                    this.options.onAgentUpdate?.(response.agents);
                    resolve({ running: response.running, agents: response.agents });
                }
            };

            this.addResponseHandler("status", handler);
            this.sendCommand({ type: "status" });
        });
    }

    /**
     * Get cached status (synchronous)
     */
    getCachedStatus(): SimulationStatus {
        return { ...this.status };
    }

    /**
     * Get cached agents (synchronous)
     */
    getCachedAgents(): AgentRuntimeState[] {
        return [...this.agents];
    }

    /**
     * Terminate the worker
     */
    terminate(): void {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        this.status = {
            running: false,
            agentCount: 0,
            pendingEvents: 0,
            lastUpdate: new Date().toISOString(),
        };
        this.agents = [];
        this.responseHandlers.clear();
    }

    /**
     * Check if worker is available
     */
    isAvailable(): boolean {
        return this.worker !== null;
    }

    private setupWorkerListeners(): void {
        if (!this.worker) return;

        this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
            const response = event.data;

            // Handle specific response types
            if (response.type === "error") {
                this.options.onError?.(response.message);
            }

            // Call response-specific handlers
            for (const [key, handler] of this.responseHandlers) {
                handler(response);
                // Remove one-time handlers
                if (key !== "persistent") {
                    this.responseHandlers.delete(key);
                }
            }
        };

        this.worker.onerror = (event) => {
            this.options.onError?.(`Worker error: ${event.message}`);
        };
    }

    private sendCommand(command: WorkerCommand): void {
        if (!this.worker) return;
        this.worker.postMessage(command);
    }

    private addResponseHandler(key: string, handler: (response: WorkerResponse) => void): void {
        this.responseHandlers.set(key, handler);
    }
}

// Singleton instance
let defaultManager: AgentManager | null = null;

export function getAgentManager(options?: AgentManagerOptions): AgentManager {
    if (!defaultManager) {
        defaultManager = new AgentManager(options);
    }
    return defaultManager;
}

export function resetAgentManager(): void {
    if (defaultManager) {
        defaultManager.terminate();
        defaultManager = null;
    }
}
