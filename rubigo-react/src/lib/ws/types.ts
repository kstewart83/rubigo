import type { ServerWebSocket } from "bun";

/**
 * Base connection data that all WebSocket handlers share.
 * Each handler can extend this with type-specific fields.
 */
export interface BaseConnectionData {
    /** Handler type identifier */
    type: string;
    /** Unique connection ID */
    id: string;
}

/**
 * WebSocket handler interface for registering protocol handlers.
 * Each handler manages a specific WebSocket endpoint.
 */
export interface WebSocketHandler<T extends BaseConnectionData = BaseConnectionData> {
    /** URL path this handler responds to (e.g., "/api/ws/chat") */
    path: string;

    /** 
     * Called to upgrade an HTTP request to WebSocket.
     * Return connection data to accept, or null to reject.
     */
    upgrade(req: Request, url: URL): T | null;

    /** Called when WebSocket connection opens */
    open(ws: ServerWebSocket<T>): void | Promise<void>;

    /** Called when a message is received */
    message(ws: ServerWebSocket<T>, message: string | Buffer): void;

    /** Called when WebSocket connection closes */
    close(ws: ServerWebSocket<T>): void;
}

/**
 * Map of connection type to handler for routing messages
 */
export type HandlerRegistry = Map<string, WebSocketHandler<BaseConnectionData>>;
