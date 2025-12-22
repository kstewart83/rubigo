/**
 * Agent Events API
 * GET /api/agents/[id]/events - Get agent event history
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { agentEvents, personnel } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "50", 10);

        // Verify agent exists
        const agent = await db
            .select({ id: personnel.id, isAgent: personnel.isAgent })
            .from(personnel)
            .where(eq(personnel.id, id))
            .get();

        if (!agent) {
            return NextResponse.json(
                { error: "Agent not found" },
                { status: 404 }
            );
        }

        // Get events
        const events = await db
            .select()
            .from(agentEvents)
            .where(eq(agentEvents.personnelId, id))
            .orderBy(desc(agentEvents.timestamp))
            .limit(limit)
            .all();

        return NextResponse.json({
            events: events.map(e => ({
                id: e.id,
                timestamp: e.timestamp,
                eventType: e.eventType,
                content: e.content,
                targetEntity: e.targetEntity,
                contextId: e.contextId,
            })),
            total: events.length,
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
