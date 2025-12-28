/**
 * Event Worker - Manages SSE connections and dispatches events
 * 
 * Runs in a background thread. Main thread communicates via postMessage.
 * 
 * Message Types:
 * - { type: 'subscribe', sessionId, controllerId } - Register SSE stream
 * - { type: 'unsubscribe', sessionId, controllerId } - Remove SSE stream
 * - { type: 'emit', sessionId, event } - Dispatch event to session
 * - { type: 'broadcast', event } - Dispatch to all sessions
 */

// Bun Worker global context

interface SessionEvent {
    id: string;
    type: string;
    payload: unknown;
    timestamp: string;
}

interface SubscribeMessage {
    type: "subscribe";
    sessionId: string;
    controllerId: string;
}

interface UnsubscribeMessage {
    type: "unsubscribe";
    sessionId: string;
    controllerId: string;
}

interface EmitMessage {
    type: "emit";
    sessionId: string;
    event: SessionEvent;
}

interface BroadcastMessage {
    type: "broadcast";
    event: SessionEvent;
}

type WorkerMessage = SubscribeMessage | UnsubscribeMessage | EmitMessage | BroadcastMessage;

// Track active SSE connections per session
// sessionId -> Set of controllerIds
const connections = new Map<string, Set<string>>();

// Track all active controller IDs for deduplication
const allControllers = new Set<string>();

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
    const msg = event.data;

    switch (msg.type) {
        case "subscribe": {
            if (!connections.has(msg.sessionId)) {
                connections.set(msg.sessionId, new Set());
            }
            connections.get(msg.sessionId)!.add(msg.controllerId);
            allControllers.add(msg.controllerId);

            console.log(`[EventWorker] Subscribed: session=${msg.sessionId}, controller=${msg.controllerId}, total=${allControllers.size}`);
            break;
        }

        case "unsubscribe": {
            const sessionConns = connections.get(msg.sessionId);
            if (sessionConns) {
                sessionConns.delete(msg.controllerId);
                if (sessionConns.size === 0) {
                    connections.delete(msg.sessionId);
                }
            }
            allControllers.delete(msg.controllerId);

            console.log(`[EventWorker] Unsubscribed: session=${msg.sessionId}, controller=${msg.controllerId}, total=${allControllers.size}`);
            break;
        }

        case "emit": {
            const sessionConns = connections.get(msg.sessionId);
            if (sessionConns && sessionConns.size > 0) {
                // Post back to main thread to write to SSE streams
                self.postMessage({
                    type: "dispatch",
                    targetControllers: Array.from(sessionConns),
                    event: msg.event,
                });
                console.log(`[EventWorker] Emitting to session ${msg.sessionId}: ${msg.event.type}`);
            }
            break;
        }

        case "broadcast": {
            // Dispatch to all active controllers
            if (allControllers.size > 0) {
                self.postMessage({
                    type: "dispatch",
                    targetControllers: Array.from(allControllers),
                    event: msg.event,
                });
                console.log(`[EventWorker] Broadcasting: ${msg.event.type} to ${allControllers.size} controllers`);
            }
            break;
        }
    }
};

// Signal ready
self.postMessage({ type: "ready" });
console.log("[EventWorker] Started");
