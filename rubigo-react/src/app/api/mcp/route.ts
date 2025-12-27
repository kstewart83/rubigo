/**
 * MCP HTTP Endpoint - Streamable HTTP Transport
 * 
 * Implements MCP protocol over HTTP with support for both:
 * - application/json responses (simple mode)
 * - text/event-stream responses (SSE mode for Streamable HTTP Transport)
 * 
 * Note: Database imports are done lazily inside handlers to avoid SQLite lock
 * issues during Next.js build (which runs multiple workers).
 */

import { NextRequest, NextResponse } from "next/server";
import { validateApiToken } from "@/lib/initialization";
import { tools, handleToolCall, type McpActorContext } from "@/lib/mcp-tools";
import { mcpRateLimiter } from "@/lib/rate-limiter";

// ============================================================================
// MCP Protocol Types
// ============================================================================

interface JsonRpcRequest {
    jsonrpc: "2.0";
    method: string;
    params?: Record<string, unknown>;
    id?: number | string;
}

interface JsonRpcResponse {
    jsonrpc: "2.0";
    result?: unknown;
    error?: { code: number; message: string };
    id?: number | string;
}

// ============================================================================
// SSE Helper Functions
// ============================================================================

/**
 * Format a JSON-RPC message as an SSE event
 */
function formatSseEvent(data: unknown, eventType?: string): string {
    const lines: string[] = [];
    if (eventType) {
        lines.push(`event: ${eventType}`);
    }
    lines.push(`data: ${JSON.stringify(data)}`);
    lines.push(""); // Empty line to terminate the event
    return lines.join("\n") + "\n";
}

/**
 * Create an SSE response with proper headers
 */
function createSseResponse(body: string): Response {
    return new Response(body, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}

// ============================================================================
// Resource Handlers (lazy db import to avoid build-time SQLite locks)
// ============================================================================

async function readResource(uri: string): Promise<{ contents: Array<{ uri: string; mimeType: string; text: string }> }> {
    // Lazy import to avoid SQLite lock during build
    const { db } = await import("@/db");
    const schema = await import("@/db/schema");

    const handlers: Record<string, () => Promise<unknown[]>> = {
        "rubigo://personnel": async () => db.select().from(schema.personnel),
        "rubigo://projects": async () => db.select().from(schema.projects),
        "rubigo://objectives": async () => db.select().from(schema.objectives),
        "rubigo://features": async () => db.select().from(schema.features),
        "rubigo://rules": async () => db.select().from(schema.rules),
        "rubigo://scenarios": async () => db.select().from(schema.scenarios),
        "rubigo://solutions": async () => db.select().from(schema.solutions),
        "rubigo://activities": async () => db.select().from(schema.activities),
        "rubigo://initiatives": async () => db.select().from(schema.initiatives),
        "rubigo://metrics": async () => db.select().from(schema.metrics),
        "rubigo://kpis": async () => db.select().from(schema.kpis),
        "rubigo://roles": async () => db.select().from(schema.roles),
    };

    const handler = handlers[uri];
    if (!handler) {
        throw new Error(`Unknown resource: ${uri}`);
    }

    const data = await handler();
    return {
        contents: [{
            uri,
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2),
        }],
    };
}

// ============================================================================
// MCP Method Handlers
// ============================================================================

async function handleMcpRequest(
    method: string,
    params: Record<string, unknown> | undefined,
    actor: McpActorContext
): Promise<unknown> {
    switch (method) {
        case "initialize":
            return {
                protocolVersion: "2024-11-05",
                capabilities: {
                    resources: { subscribe: false, listChanged: false },
                    tools: { listChanged: false },
                },
                serverInfo: {
                    name: "rubigo",
                    version: "0.3.0",
                },
            };

        case "initialized":
            return {};

        case "notifications/initialized":
            // Client notification after initialization - just acknowledge
            return null; // Return null for notifications (no response needed)

        case "resources/list":
            return {
                resources: [
                    { uri: "rubigo://personnel", name: "Personnel Directory", mimeType: "application/json" },
                    { uri: "rubigo://projects", name: "Projects", mimeType: "application/json" },
                    { uri: "rubigo://objectives", name: "Objectives", mimeType: "application/json" },
                    { uri: "rubigo://features", name: "Features", mimeType: "application/json" },
                    { uri: "rubigo://rules", name: "Rules", mimeType: "application/json" },
                    { uri: "rubigo://scenarios", name: "Scenarios", mimeType: "application/json" },
                    { uri: "rubigo://solutions", name: "Solutions", mimeType: "application/json" },
                    { uri: "rubigo://activities", name: "Activities", mimeType: "application/json" },
                    { uri: "rubigo://initiatives", name: "Initiatives", mimeType: "application/json" },
                    { uri: "rubigo://metrics", name: "Metrics", mimeType: "application/json" },
                    { uri: "rubigo://kpis", name: "KPIs", mimeType: "application/json" },
                    { uri: "rubigo://roles", name: "Roles", mimeType: "application/json" },
                ],
            };

        case "resources/read":
            const uri = params?.uri as string;
            if (!uri) {
                throw new Error("Missing uri parameter");
            }
            return readResource(uri);

        case "tools/list":
            return { tools };

        case "tools/call":
            const name = params?.name as string;
            const args = (params?.arguments || {}) as Record<string, unknown>;
            if (!name) {
                throw new Error("Missing name parameter");
            }
            return handleToolCall(name, args, actor);

        default:
            throw new Error(`Unknown method: ${method}`);
    }
}

// ============================================================================
// POST Handler - Streamable HTTP Transport
// ============================================================================

export async function POST(request: NextRequest) {
    // Authenticate
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") ?? null;

    const auth = await validateApiToken(token);
    if (!auth.valid) {
        return NextResponse.json(
            { error: auth.error },
            { status: 401 }
        );
    }

    // Rate limiting
    if (token) {
        const rateLimit = mcpRateLimiter.check(token);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { jsonrpc: "2.0", error: { code: -32000, message: "Rate limit exceeded" } },
                { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.retryAfterMs || 1000) / 1000)) } }
            );
        }
    }

    // Parse JSON-RPC request
    let rpcRequest: JsonRpcRequest;
    try {
        rpcRequest = await request.json();
    } catch {
        return NextResponse.json(
            { jsonrpc: "2.0", error: { code: -32700, message: "Parse error" } },
            { status: 400 }
        );
    }

    // Validate JSON-RPC format
    if (rpcRequest.jsonrpc !== "2.0" || !rpcRequest.method) {
        return NextResponse.json(
            { jsonrpc: "2.0", error: { code: -32600, message: "Invalid Request" }, id: rpcRequest.id },
            { status: 400 }
        );
    }

    // Create actor context
    const actor: McpActorContext = {
        actorId: auth.actorId!,
        actorName: auth.actorName!,
        isAdmin: true,
    };

    // Check if client accepts SSE (Streamable HTTP Transport)
    const acceptHeader = request.headers.get("accept") || "";
    const wantsSse = acceptHeader.includes("text/event-stream");

    // Handle MCP method
    try {
        const result = await handleMcpRequest(rpcRequest.method, rpcRequest.params, actor);

        // For notifications (no id), return 202 Accepted with no body
        if (rpcRequest.id === undefined || result === null) {
            return new Response(null, { status: 202 });
        }

        const response: JsonRpcResponse = {
            jsonrpc: "2.0",
            result,
            id: rpcRequest.id,
        };

        // Return SSE format if client prefers it
        if (wantsSse) {
            // For Streamable HTTP Transport, wrap response in SSE event
            // The "message" event type signals a JSON-RPC message
            const sseBody = formatSseEvent(response, "message");
            return createSseResponse(sseBody);
        }

        // Return plain JSON for simple clients
        return NextResponse.json(response);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal error";
        const response: JsonRpcResponse = {
            jsonrpc: "2.0",
            error: { code: -32603, message },
            id: rpcRequest.id,
        };

        if (wantsSse) {
            const sseBody = formatSseEvent(response, "message");
            return createSseResponse(sseBody);
        }

        return NextResponse.json(response, { status: 500 });
    }
}

// ============================================================================
// GET Handler - SSE Stream for Server-to-Client Messages
// ============================================================================

export async function GET(request: NextRequest) {
    // Authenticate
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") ?? null;

    const auth = await validateApiToken(token);
    if (!auth.valid) {
        return NextResponse.json(
            { error: auth.error },
            { status: 401 }
        );
    }

    // Rate limiting
    if (token) {
        const rateLimit = mcpRateLimiter.check(token);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: "Rate limit exceeded" },
                { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.retryAfterMs || 1000) / 1000)) } }
            );
        }
    }

    // Check if client wants SSE
    const acceptHeader = request.headers.get("accept") || "";
    if (!acceptHeader.includes("text/event-stream")) {
        // Per MCP spec: return 405 if client doesn't want SSE
        return new Response("Method Not Allowed", { status: 405 });
    }

    // For now, we don't have server-initiated messages, so just keep the connection open
    // This satisfies the Streamable HTTP Transport spec requirement
    // In the future, this could be used for server push notifications

    // Create a stream that sends a heartbeat and stays open
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        start(controller) {
            // Send initial comment to establish connection
            controller.enqueue(encoder.encode(": connected\n\n"));

            // Keep-alive ping every 30 seconds (optional)
            const interval = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(": ping\n\n"));
                } catch {
                    clearInterval(interval);
                }
            }, 30000);

            // Clean up on close
            request.signal.addEventListener("abort", () => {
                clearInterval(interval);
                controller.close();
            });
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}
