import type { ServerWebSocket } from "bun";
import type { WebSocketHandler, BaseConnectionData } from "./types";

const NEXT_PORT = parseInt(process.env.NEXT_PORT || "3001", 10);

/**
 * Connection data for HMR WebSocket proxy
 */
export interface HmrConnectionData extends BaseConnectionData {
    type: "hmr";
    upstreamSocket?: WebSocket;
    query: string;
}

/**
 * HMR WebSocket proxy handler.
 * Proxies webpack-hmr WebSocket connections to the internal Next.js server.
 */
export const hmrHandler: WebSocketHandler<HmrConnectionData> = {
    path: "/_next/webpack-hmr",

    upgrade(req: Request, url: URL): HmrConnectionData | null {
        const id = crypto.randomUUID();
        return {
            type: "hmr",
            id,
            query: url.search,
        };
    },

    async open(ws: ServerWebSocket<HmrConnectionData>): Promise<void> {
        const { id, query } = ws.data;

        // Connect to upstream Next.js HMR WebSocket
        const upstreamUrl = `ws://localhost:${NEXT_PORT}/_next/webpack-hmr${query}`;

        try {
            const upstream = new WebSocket(upstreamUrl);

            upstream.onopen = () => {
                ws.data.upstreamSocket = upstream;
            };

            upstream.onmessage = (event) => {
                try {
                    ws.send(event.data);
                } catch (e) {
                    // Client disconnected
                }
            };

            upstream.onclose = () => {
                try { ws.close(); } catch (e) { }
            };

            upstream.onerror = (error) => {
                console.error(`[HMR:${id}] Upstream error:`, error);
                try { ws.close(); } catch (e) { }
            };

            ws.data.upstreamSocket = upstream;
        } catch (error) {
            console.error(`[HMR:${id}] Failed to connect to Next.js HMR:`, error);
            ws.close();
        }
    },

    message(ws: ServerWebSocket<HmrConnectionData>, message: string | Buffer): void {
        const upstream = ws.data.upstreamSocket;
        if (upstream && upstream.readyState === WebSocket.OPEN) {
            upstream.send(message);
        }
    },

    close(ws: ServerWebSocket<HmrConnectionData>): void {
        const upstream = ws.data.upstreamSocket;
        if (upstream) {
            try { upstream.close(); } catch (e) { }
        }
    },
};
