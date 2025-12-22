/**
 * Agent Worker - Bun Worker for background agent simulation
 * 
 * Runs in a separate thread to process agent events without
 * blocking the main UI thread.
 * 
 * Usage from main thread:
 * ```typescript
 * const worker = new Worker("./agent-worker.ts");
 * worker.postMessage({ type: "start", config: { tickRateMs: 1000 } });
 * worker.onmessage = (e) => console.log("Worker response:", e.data);
 * ```
 */

import { AgentScheduler } from "./agent-scheduler";
import type { WorkerCommand, WorkerResponse, SimulationConfig, AgentRuntimeState } from "./agent-types";
import { DEFAULT_SIMULATION_CONFIG } from "./agent-types";

// Worker context
declare const self: Worker;

let scheduler: AgentScheduler | null = null;
let config: SimulationConfig = { ...DEFAULT_SIMULATION_CONFIG };

/**
 * Send response to main thread
 */
function respond(message: WorkerResponse): void {
    self.postMessage(message);
}

/**
 * Initialize the scheduler with callbacks
 */
function initScheduler(): AgentScheduler {
    return new AgentScheduler({
        onAgentStateChange: async (agentId, newStatus) => {
            // Could emit events to main thread here
            console.log(`[AgentWorker] Agent ${agentId} -> ${newStatus}`);
        },
        onEventProcessed: async (event, result) => {
            console.log(`[AgentWorker] Event ${event.id} processed:`, result.success ? "success" : result.error);
        },
        onError: (error, event) => {
            console.error(`[AgentWorker] Error processing event ${event?.id}:`, error);
            respond({ type: "error", message: error.message });
        },
        // Note: getPersonnel requires database access which we can't do directly in worker
        // This would need to be handled via message passing with main thread
        getPersonnel: async (personnelId) => {
            // Placeholder - in real implementation, this would request from main thread
            return {
                id: personnelId,
                name: `Agent ${personnelId}`,
                title: "AI Agent",
                department: "Simulation",
                bio: "An AI agent participating in the simulation.",
            };
        },
    });
}

/**
 * Handle commands from main thread
 */
async function handleCommand(command: WorkerCommand): Promise<void> {
    switch (command.type) {
        case "start": {
            if (scheduler) {
                scheduler.stop();
            }

            // Merge config
            config = { ...DEFAULT_SIMULATION_CONFIG, ...command.config };

            // Initialize scheduler
            scheduler = initScheduler();

            // TODO: Get agent IDs from database via main thread
            // For now, use placeholder agents
            await scheduler.initializeAgents(["test01", "test02"]);

            // Start the simulation
            await scheduler.start(config.tickRateMs);

            const status = scheduler.getStatus();
            respond({ type: "started", agentCount: status.agents.length });
            break;
        }

        case "stop": {
            if (scheduler) {
                scheduler.stop();
                scheduler = null;
            }
            respond({ type: "stopped" });
            break;
        }

        case "tick": {
            if (!scheduler) {
                respond({ type: "error", message: "Scheduler not running" });
                return;
            }

            const result = await scheduler.tick();
            const status = scheduler.getStatus();
            respond({
                type: "tick_complete",
                processed: result ? 1 : 0,
                pending: status.pendingEvents,
            });
            break;
        }

        case "trigger": {
            if (!scheduler) {
                respond({ type: "error", message: "Scheduler not running" });
                return;
            }

            scheduler.scheduleEvent(
                command.agentId,
                command.event.eventType,
                command.event.payload,
                command.event.scheduledFor
            );

            const status = scheduler.getStatus();
            respond({
                type: "tick_complete",
                processed: 0,
                pending: status.pendingEvents,
            });
            break;
        }

        case "status": {
            if (!scheduler) {
                respond({
                    type: "status",
                    running: false,
                    agents: [],
                });
                return;
            }

            const status = scheduler.getStatus();
            respond({
                type: "status",
                running: status.running,
                agents: status.agents,
            });
            break;
        }

        default:
            respond({ type: "error", message: `Unknown command type` });
    }
}

// Listen for messages from main thread
self.onmessage = async (event: MessageEvent<WorkerCommand>) => {
    try {
        await handleCommand(event.data);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        respond({ type: "error", message });
    }
};

// Signal that worker is ready
console.log("[AgentWorker] Worker initialized and ready");
