/**
 * Rubigo Custom Server
 * 
 * A Bun server that combines:
 * - Next.js application on all HTTP routes
 * - WebSocket handlers for real-time protocols (VDI, chat, presence, etc.)
 * 
 * This allows single-port operation for Cloudflare tunnel.
 * 
 * Usage: bun run server.ts
 */

import type { BaseConnectionData, WebSocketHandler } from "./src/lib/ws/types";
import { handlers, getHandlerByPath, getHandlerByType } from "./src/lib/ws";

const PORT = parseInt(process.env.PORT || "3000", 10);
const NEXT_PORT = parseInt(process.env.NEXT_PORT || "3001", 10);

// Track active connections by handler type
const activeConnections = new Map<string, Set<string>>();

console.log(`
╔═══════════════════════════════════════════════════╗
║       Rubigo Server (Next.js + WebSocket)         ║
╠═══════════════════════════════════════════════════╣
║  HTTP:      http://localhost:${PORT}                     ║
║  Next.js:   http://localhost:${NEXT_PORT} (internal)         ║
╠═══════════════════════════════════════════════════╣
║  WebSocket Endpoints:                             ║`);
for (const handler of handlers) {
    console.log(`║    ${handler.path.padEnd(40)}║`);
}
console.log(`╚═══════════════════════════════════════════════════╝
`);

const server = Bun.serve<BaseConnectionData>({
    port: PORT,

    async fetch(req, server) {
        const url = new URL(req.url);

        // =========================================================
        // WebSocket Endpoints - Check all registered handlers
        // =========================================================
        const handler = getHandlerByPath(url.pathname);
        if (handler) {
            const data = handler.upgrade(req, url);
            if (data) {
                const upgraded = server.upgrade(req, { data });
                if (!upgraded) {
                    return new Response("WebSocket upgrade failed", { status: 400 });
                }
                return undefined;
            }
            return new Response("WebSocket upgrade rejected", { status: 403 });
        }

        // =========================================================
        // Health Check
        // =========================================================
        if (url.pathname === "/api/health") {
            const stats: Record<string, number> = {};
            for (const [type, connections] of activeConnections) {
                stats[type] = connections.size;
            }
            return new Response(JSON.stringify({
                status: "ok",
                handlers: handlers.map(h => h.path),
                connections: stats,
            }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        // =========================================================
        // Next.js (all other routes)
        // =========================================================
        try {
            const nextUrl = new URL(req.url);
            const originalHost = req.headers.get('Host') || `localhost:${PORT}`;
            nextUrl.host = `localhost:${NEXT_PORT}`;

            // Clone headers and fix for proper proxying
            const headers = new Headers(req.headers);
            headers.delete('Accept-Encoding');

            // Set forwarding headers so Next.js knows the real origin
            headers.set('Host', `localhost:${NEXT_PORT}`);
            headers.set('X-Forwarded-Host', originalHost);
            headers.set('X-Forwarded-Proto', 'http');
            headers.set('X-Forwarded-For', '127.0.0.1');

            // Override origin to match the forwarded host for Server Actions
            if (headers.has('Origin')) {
                headers.set('Origin', `http://${originalHost}`);
            }

            const proxyReq = new Request(nextUrl.toString(), {
                method: req.method,
                headers,
                body: req.body,
            });

            const response = await fetch(proxyReq);

            // Clone response headers and strip Content-Encoding to avoid browser issues
            const responseHeaders = new Headers(response.headers);
            responseHeaders.delete('Content-Encoding');
            responseHeaders.delete('Content-Length');

            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: responseHeaders,
            });
        } catch (e) {
            console.error('[Proxy] Error:', e);
            return new Response("Next.js not available", { status: 502 });
        }
    },

    websocket: {
        async open(ws) {
            const { type, id } = ws.data;

            // Track connection
            if (!activeConnections.has(type)) {
                activeConnections.set(type, new Set());
            }
            activeConnections.get(type)!.add(id);

            // Delegate to handler
            const handler = getHandlerByType(type);
            if (handler) {
                await handler.open(ws as any);
            }
        },

        message(ws, message) {
            const { type } = ws.data;
            const handler = getHandlerByType(type);
            if (handler) {
                handler.message(ws as any, message);
            }
        },

        close(ws) {
            const { type, id } = ws.data;

            // Untrack connection
            activeConnections.get(type)?.delete(id);

            // Delegate to handler
            const handler = getHandlerByType(type);
            if (handler) {
                handler.close(ws as any);
            }
        },
    },
});

console.log(`Server running on port ${PORT}`);
