/**
 * Agent Reset API - Dev tool to clear ALL agent state
 * 
 * POST /api/agents/reset
 * Clears:
 * - agent_events (thought/action log)
 * - agent_scheduled_events (DES queue)
 * - sync_context_participants (context memberships)
 * - sync_contexts (active contexts)
 * - agent_sessions (API tokens)
 * - agent statuses → "dormant"
 */

import { NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST() {
    try {
        // 1. Clear agent events (thoughts/actions log)
        await db.delete(schema.agentEvents);

        // 2. Clear scheduled events (DES queue)
        await db.delete(schema.agentScheduledEvents);

        // 3. Clear sync context participants
        await db.delete(schema.syncContextParticipants);

        // 4. Clear sync contexts
        await db.delete(schema.syncContexts);

        // 5. Clear agent sessions (API tokens)
        await db.delete(schema.agentSessions);

        // 6. Reset all agents to dormant status
        await db
            .update(schema.personnel)
            .set({ agentStatus: "dormant" })
            .where(eq(schema.personnel.isAgent, true));

        // Count how many agents were reset
        const agents = await db
            .select({ count: sql<number>`count(*)` })
            .from(schema.personnel)
            .where(eq(schema.personnel.isAgent, true));

        return NextResponse.json({
            success: true,
            message: "All agent state cleared",
            cleared: {
                agentEvents: true,
                scheduledEvents: true,
                syncContexts: true,
                syncParticipants: true,
                agentSessions: true,
            },
            agentsReset: agents[0]?.count || 0,
        });
    } catch (error) {
        console.error("Reset error:", error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
