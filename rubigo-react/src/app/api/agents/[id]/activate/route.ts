/**
 * Agent Activate API
 * 
 * POST /api/agents/[id]/activate
 * 
 * Schedules an "activate" event on the DES queue.
 * The event must be processed by clicking "Tick".
 */

import { NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { scheduleEvent } from "@/lib/agent-events";

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
    const { id } = await params;

    // Verify agent exists and is dormant
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

    const agent = agents[0];

    if (agent.agentStatus !== "dormant") {
        return NextResponse.json(
            { success: false, error: "Agent is already active" },
            { status: 400 }
        );
    }

    try {
        // Schedule the activate event (for now)
        const eventId = await scheduleEvent({
            agentId: id,
            eventType: "activate",
            scheduledFor: new Date().toISOString(),
            payload: {
                triggeredBy: "ui_button",
            },
        });

        return NextResponse.json({
            success: true,
            message: `Scheduled activate event for ${agent.name}. Click Tick to process.`,
            eventId,
            agentId: id,
            agentName: agent.name,
        });
    } catch (error) {
        console.error("Activate error:", error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
