/**
 * WebSocket Handler Registry
 * 
 * Central registry of all WebSocket protocol handlers.
 * Add new handlers here to enable new real-time protocols.
 */

import type { WebSocketHandler, BaseConnectionData, HandlerRegistry } from "./types";
import { guacHandler } from "./guac-handler";

/**
 * All registered WebSocket handlers.
 * Add new handlers to this array to enable them.
 */
export const handlers: WebSocketHandler<BaseConnectionData>[] = [
    guacHandler as WebSocketHandler<BaseConnectionData>,
    // Future handlers:
    // chatHandler,
    // presenceHandler,
    // collabHandler,
];

/**
 * Map of handler type to handler for message routing
 */
export const handlersByType: HandlerRegistry = new Map(
    handlers.map(h => [h.path, h])
);

/**
 * Find handler by URL path
 */
export function getHandlerByPath(path: string): WebSocketHandler<BaseConnectionData> | undefined {
    return handlers.find(h => h.path === path);
}

/**
 * Find handler by connection type
 */
export function getHandlerByType(type: string): WebSocketHandler<BaseConnectionData> | undefined {
    // Derive path from type (e.g., "guac" -> "/api/guac-tunnel")
    // For now, use a simple mapping
    const typeToPath: Record<string, string> = {
        guac: "/api/guac-tunnel",
        // chat: "/api/ws/chat",
        // presence: "/api/ws/presence",
    };
    const path = typeToPath[type];
    return path ? getHandlerByPath(path) : undefined;
}
