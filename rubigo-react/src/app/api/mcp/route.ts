/**
 * MCP HTTP Endpoint
 * 
 * Implements MCP protocol over HTTP.
 * Handles JSON-RPC messages directly for compatibility with Next.js App Router.
 */

import { NextRequest, NextResponse } from "next/server";
import { validateApiToken } from "@/lib/initialization";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { tools, handleToolCall, type McpActorContext } from "@/lib/mcp-tools";

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
// Resource Handlers
// ============================================================================

async function readResource(uri: string): Promise<{ contents: Array<{ uri: string; mimeType: string; text: string }> }> {
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
                    version: "0.1.0",
                },
            };

        case "initialized":
            return {};

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
// POST Handler
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

    // Handle MCP method
    try {
        const result = await handleMcpRequest(rpcRequest.method, rpcRequest.params, actor);

        const response: JsonRpcResponse = {
            jsonrpc: "2.0",
            result,
            id: rpcRequest.id,
        };

        return NextResponse.json(response);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal error";
        const response: JsonRpcResponse = {
            jsonrpc: "2.0",
            error: { code: -32603, message },
            id: rpcRequest.id,
        };

        return NextResponse.json(response, { status: 500 });
    }
}
