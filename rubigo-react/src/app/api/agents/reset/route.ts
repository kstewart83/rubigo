/**
 * Agent Reset API - Dev tool to clear agent state
 * 
 * POST /api/agents/reset
 * Clears all agent events and resets statuses to dormant
 */

import { NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST() {
    try {
        // Clear all agent events
        await db.delete(schema.agentEvents);

        // Reset all agents to dormant status
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
            message: "Agent state cleared",
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
