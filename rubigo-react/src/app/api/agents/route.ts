/**
 * Agent List API
 * GET /api/agents - List all agents with their status
 */

import { NextResponse } from "next/server";
import { db } from "@/db";
import { personnel } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
    try {
        const agents = await db
            .select({
                id: personnel.id,
                name: personnel.name,
                title: personnel.title,
                department: personnel.department,
                isAgent: personnel.isAgent,
                agentStatus: personnel.agentStatus,
                aco: personnel.aco,
            })
            .from(personnel)
            .where(eq(personnel.isAgent, true))
            .all();

        return NextResponse.json({
            agents: agents.map(a => ({
                id: a.id,
                name: a.name,
                title: a.title,
                department: a.department,
                status: a.agentStatus || "dormant",
                aco: a.aco,
            })),
            total: agents.length,
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
