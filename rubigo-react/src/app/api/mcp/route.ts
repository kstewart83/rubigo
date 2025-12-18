/**
 * MCP Streamable HTTP Endpoint
 * 
 * Implements MCP protocol over HTTP using Streamable HTTP transport.
 * Supports POST for messages, GET for SSE stream, DELETE for session termination.
 */

import { NextRequest, NextResponse } from "next/server";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer } from "@/lib/mcp-server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

// ============================================================================
// Session Management
// ============================================================================

// In-memory session storage (for development - production should use Redis/DB)
const sessions = new Map<string, StreamableHTTPServerTransport>();

// ============================================================================
// Authentication Helper
// ============================================================================

interface AuthResult {
    success: boolean;
    error?: string;
    actorId?: string;
    actorName?: string;
    isAdmin?: boolean;
}

async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return { success: false, error: "Missing or invalid Authorization header" };
    }

    const token = authHeader.slice(7);
    const expectedToken = process.env.RUBIGO_API_TOKEN;

    if (!expectedToken) {
        return { success: false, error: "Server not configured with API token" };
    }

    if (token !== expectedToken) {
        return { success: false, error: "Invalid API token" };
    }

    // Find the Global Administrator
    const admins = await db.select()
        .from(schema.personnel)
        .where(eq(schema.personnel.isGlobalAdmin, true))
        .limit(1);

    if (admins.length === 0) {
        return { success: false, error: "No Global Administrator found" };
    }

    const admin = admins[0];

    return {
        success: true,
        actorId: admin.id,
        actorName: admin.name,
        isAdmin: true,
    };
}

// ============================================================================
// POST Handler - Process MCP messages
// ============================================================================

export async function POST(request: NextRequest) {
    // Authenticate
    const auth = await authenticateRequest(request);
    if (!auth.success) {
        return NextResponse.json(
            { error: auth.error },
            { status: 401 }
        );
    }

    // Get or create session
    const sessionId = request.headers.get("mcp-session-id") || crypto.randomUUID();

    let transport = sessions.get(sessionId);
    if (!transport) {
        // Create new transport and server for this session
        transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => sessionId,
        });

        const server = createMcpServer({
            actorId: auth.actorId!,
            actorName: auth.actorName!,
            isAdmin: auth.isAdmin!,
        });

        // Connect server to transport
        await server.connect(transport);

        sessions.set(sessionId, transport);
    }

    // Handle the request
    try {
        const body = await request.json();
        const response = await transport.handleRequest(request, body);

        // Add session ID header to response
        const headers = new Headers();
        headers.set("mcp-session-id", sessionId);
        headers.set("content-type", "application/json");

        return new NextResponse(JSON.stringify(response), { headers });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}

// ============================================================================
// GET Handler - SSE stream for server-initiated messages
// ============================================================================

export async function GET(request: NextRequest) {
    // Authenticate
    const auth = await authenticateRequest(request);
    if (!auth.success) {
        return NextResponse.json(
            { error: auth.error },
            { status: 401 }
        );
    }

    const sessionId = request.headers.get("mcp-session-id");
    if (!sessionId) {
        return NextResponse.json(
            { error: "Missing mcp-session-id header" },
            { status: 400 }
        );
    }

    const transport = sessions.get(sessionId);
    if (!transport) {
        return NextResponse.json(
            { error: "Session not found" },
            { status: 404 }
        );
    }

    // Return SSE stream
    try {
        const response = await transport.handleSSERequest(request);
        return response;
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}

// ============================================================================
// DELETE Handler - Session termination
// ============================================================================

export async function DELETE(request: NextRequest) {
    const sessionId = request.headers.get("mcp-session-id");
    if (!sessionId) {
        return NextResponse.json(
            { error: "Missing mcp-session-id header" },
            { status: 400 }
        );
    }

    const transport = sessions.get(sessionId);
    if (transport) {
        await transport.close();
        sessions.delete(sessionId);
    }

    return NextResponse.json({ success: true });
}
