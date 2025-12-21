/**
 * Agent State API
 * GET /api/agents/[id]/state - Get agent status
 * POST /api/agents/[id]/state - Update agent status
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { personnel } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const agent = await db
            .select({
                id: personnel.id,
                name: personnel.name,
                isAgent: personnel.isAgent,
                agentStatus: personnel.agentStatus,
                agentPersona: personnel.agentPersona,
            })
            .from(personnel)
            .where(eq(personnel.id, id))
            .get();

        if (!agent) {
            return NextResponse.json(
                { error: "Agent not found" },
                { status: 404 }
            );
        }

        if (!agent.isAgent) {
            return NextResponse.json(
                { error: "Personnel is not an agent" },
                { status: 400 }
            );
        }

        return NextResponse.json({
            personnelId: agent.id,
            name: agent.name,
            status: agent.agentStatus || "dormant",
            persona: agent.agentPersona ? JSON.parse(agent.agentPersona) : null,
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        const validStatuses = ["dormant", "sleeping", "idle", "working"];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
                { status: 400 }
            );
        }

        await db
            .update(personnel)
            .set({ agentStatus: status })
            .where(eq(personnel.id, id));

        return NextResponse.json({
            personnelId: id,
            status,
            updated: true,
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
