/**
 * Event Router
 * 
 * Central hub for routing messages to domain-specific workers.
 * Runs on main thread, spawns and manages worker threads.
 * 
 * Uses globalThis for true singleton across Next.js module loading.
 */

/// <reference lib="dom" />

// Types for messages
export interface PresenceHeartbeat {
    type: "presence.heartbeat";
    personnelId: string;
    sessionId: string;
}

export interface PresenceOffline {
    type: "presence.offline";
    personnelId: string;
}

export interface PresenceSetStatus {
    type: "presence.setStatus";
    personnelId: string;
    sessionId: string;
    status: "online" | "away" | "offline";
}

export type EventMessage = PresenceHeartbeat | PresenceOffline | PresenceSetStatus;

// Global state for singleton
interface EventRouterState {
    presenceWorker: Worker | null;
    initialized: boolean;
}

declare global {
    // eslint-disable-next-line no-var
    var eventRouterState: EventRouterState | undefined;
}

// Get or create global state
function getState(): EventRouterState {
    if (!globalThis.eventRouterState) {
        globalThis.eventRouterState = {
            presenceWorker: null,
            initialized: false,
        };
    }
    return globalThis.eventRouterState;
}

/**
 * Spawn presence worker
 */
function spawnPresenceWorker(): Worker {
    const worker = new Worker(new URL("./presence-manager.ts", import.meta.url));

    worker.onerror = (error) => {
        console.error("[EventRouter] Presence worker error:", error);
        console.log("[EventRouter] Respawning presence worker...");
        const state = getState();
        state.presenceWorker = spawnPresenceWorker();
    };

    worker.onmessage = (event) => {
        console.log("[EventRouter] Message from presence worker:", event.data);
    };

    return worker;
}

/**
 * Initialize the event router
 * Should be called once from instrumentation.ts
 */
export function initialize(): void {
    const state = getState();

    if (state.initialized) {
        console.log("[EventRouter] Already initialized");
        return;
    }

    console.log("[EventRouter] Initializing...");

    // Spawn workers
    state.presenceWorker = spawnPresenceWorker();

    // Graceful shutdown
    process.on("SIGTERM", () => {
        console.log("[EventRouter] SIGTERM received, shutting down workers...");
        state.presenceWorker?.postMessage({ type: "shutdown" });
    });

    process.on("SIGINT", () => {
        console.log("[EventRouter] SIGINT received, shutting down workers...");
        state.presenceWorker?.postMessage({ type: "shutdown" });
    });

    state.initialized = true;
    console.log("[EventRouter] Initialized with presence worker");
}

/**
 * Send a message to the appropriate worker
 */
export function send(message: EventMessage): void {
    const state = getState();

    if (!state.initialized) {
        console.warn("[EventRouter] Not initialized, dropping message:", message.type);
        return;
    }

    switch (message.type) {
        case "presence.heartbeat":
        case "presence.offline":
        case "presence.setStatus":
            state.presenceWorker?.postMessage(message);
            break;

        default:
            console.warn("[EventRouter] Unknown message type:", (message as { type: string }).type);
    }
}

/**
 * Singleton access for API routes
 */
export const eventRouter = {
    send,
    initialize,
};
