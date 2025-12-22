/**
 * Agent Worker Manager
 * 
 * Singleton that manages the lifecycle of the agent loop worker.
 * Persists across HTTP requests since Next.js/Bun keeps the process alive.
 */

// Use globalThis to ensure singleton persists across hot reloads
const GLOBAL_KEY = "__agentWorkerManager__";

interface WorkerStatus {
    running: boolean;
    tickCount: number;
    lastEventType: string | null;
    lastEventTime: Date | null;
    lastError: string | null;
    startedAt: Date | null;
}

class AgentWorkerManager {
    private worker: Worker | null = null;
    private status: WorkerStatus = {
        running: false,
        tickCount: 0,
        lastEventType: null,
        lastEventTime: null,
        lastError: null,
        startedAt: null,
    };

    /**
     * Start the agent loop worker
     */
    start(tickIntervalMs: number = 3000, serverUrl?: string): { success: boolean; message: string } {
        if (this.worker) {
            return { success: false, message: "Worker already running" };
        }

        try {
            // Create worker from the worker file
            this.worker = new Worker(
                new URL("../workers/agent-loop-worker.ts", import.meta.url).href
            );

            // Handle messages from worker
            this.worker.onmessage = (event) => {
                this.handleWorkerMessage(event.data);
            };

            // Handle errors
            this.worker.onerror = (error) => {
                console.error("[AgentWorkerManager] Worker error:", error);
                this.status.lastError = error.message;
            };

            // Send start command with server URL
            // Default to localhost:3000 if not provided
            const url = serverUrl || "http://localhost:3000";
            this.worker.postMessage({ type: "start", tickIntervalMs, serverUrl: url });

            this.status.running = true;
            this.status.startedAt = new Date();
            this.status.tickCount = 0;
            this.status.lastError = null;

            return { success: true, message: `Worker started with ${tickIntervalMs}ms interval` };
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to start worker";
            this.status.lastError = message;
            return { success: false, message };
        }
    }

    /**
     * Stop the agent loop worker
     */
    stop(): { success: boolean; message: string } {
        if (!this.worker) {
            return { success: false, message: "Worker not running" };
        }

        try {
            this.worker.terminate();
            this.worker = null;

            this.status.running = false;

            return {
                success: true,
                message: `Worker stopped after ${this.status.tickCount} ticks`
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to stop worker";
            this.status.lastError = message;
            return { success: false, message };
        }
    }

    /**
     * Get current worker status
     */
    getStatus(): WorkerStatus {
        return { ...this.status };
    }

    /**
     * Check if worker is running
     */
    isRunning(): boolean {
        return this.worker !== null && this.status.running;
    }

    /**
     * Handle messages from the worker
     */
    private handleWorkerMessage(data: Record<string, unknown>) {
        switch (data.type) {
            case "ready":
                console.log("[AgentWorkerManager] Worker ready");
                break;

            case "started":
                console.log(`[AgentWorkerManager] Worker started with ${data.tickIntervalMs}ms interval`);
                this.status.running = true;
                break;

            case "stopped":
                console.log(`[AgentWorkerManager] Worker stopped after ${data.tickCount} ticks`);
                this.status.running = false;
                break;

            case "tick":
                this.status.tickCount = data.tickCount as number;
                if (data.eventProcessed) {
                    this.status.lastEventType = data.eventType as string;
                    this.status.lastEventTime = new Date();
                }
                break;

            case "error":
                console.error("[AgentWorkerManager] Worker error:", data.message);
                this.status.lastError = data.message as string;
                break;

            default:
                console.log("[AgentWorkerManager] Unknown message:", data);
        }
    }
}

// Create or retrieve singleton instance
function getAgentWorkerManager(): AgentWorkerManager {
    const globalAny = globalThis as Record<string, unknown>;

    if (!globalAny[GLOBAL_KEY]) {
        globalAny[GLOBAL_KEY] = new AgentWorkerManager();
    }

    return globalAny[GLOBAL_KEY] as AgentWorkerManager;
}

// Export singleton
export const agentWorkerManager = getAgentWorkerManager();
