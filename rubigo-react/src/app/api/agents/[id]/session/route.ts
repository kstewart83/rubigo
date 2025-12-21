/**
 * Agent Session API - Create and manage agent sessions
 * 
 * POST /api/agents/[id]/session - Create a session for an agent
 * DELETE /api/agents/[id]/session - Revoke all sessions for an agent
 */

import { NextResponse } from "next/server";
import { createAgentSession, revokeAllAgentSessions } from "@/lib/agent-tokens";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * POST - Create a session for an agent
 * Returns the token the agent should use
 */
export async function POST(request: Request, { params }: RouteParams) {
    const { id } = await params;

    // Verify the personnel exists and is an agent
    const agents = await db
        .select()
        .from(schema.personnel)
        .where(
            and(
                eq(schema.personnel.id, id),
                eq(schema.personnel.isAgent, true)
            )
        )
        .limit(1);

    if (agents.length === 0) {
        return NextResponse.json(
            { success: false, error: "Agent not found" },
            { status: 404 }
        );
    }

    try {
        const token = await createAgentSession(id);

        return NextResponse.json({
            success: true,
            agentId: id,
            agentName: agents[0].name,
            token,
            message: "Session created. Use this token for API requests as this agent.",
        });
    } catch (error) {
        console.error("Session creation error:", error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}

/**
 * DELETE - Revoke all sessions for an agent
 */
export async function DELETE(request: Request, { params }: RouteParams) {
    const { id } = await params;

    try {
        await revokeAllAgentSessions(id);

        return NextResponse.json({
            success: true,
            message: "All sessions revoked",
        });
    } catch (error) {
        console.error("Session revocation error:", error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
