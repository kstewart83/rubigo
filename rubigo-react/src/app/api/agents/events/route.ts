/**
 * Agent Event Queue API
 * 
 * GET /api/agents/events - Get pending events (paginated)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { isNull, asc, eq, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = (page - 1) * limit;

    try {
        // Get pending events with agent names
        const events = await db
            .select({
                id: schema.agentScheduledEvents.id,
                agentId: schema.agentScheduledEvents.agentId,
                agentName: schema.personnel.name,
                eventType: schema.agentScheduledEvents.eventType,
                contextId: schema.agentScheduledEvents.contextId,
                scheduledFor: schema.agentScheduledEvents.scheduledFor,
                payload: schema.agentScheduledEvents.payload,
                createdAt: schema.agentScheduledEvents.createdAt,
            })
            .from(schema.agentScheduledEvents)
            .leftJoin(
                schema.personnel,
                eq(schema.agentScheduledEvents.agentId, schema.personnel.id)
            )
            .where(isNull(schema.agentScheduledEvents.processedAt))
            .orderBy(asc(schema.agentScheduledEvents.scheduledFor))
            .limit(limit)
            .offset(offset);

        // Get total count
        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(schema.agentScheduledEvents)
            .where(isNull(schema.agentScheduledEvents.processedAt));

        const total = countResult[0]?.count || 0;
        const totalPages = Math.ceil(total / limit);

        // Get current time for comparison
        const now = new Date().toISOString();

        // Enrich events with ready status
        const enrichedEvents = events.map(e => ({
            ...e,
            isReady: e.scheduledFor <= now,
            msUntilReady: Math.max(0, new Date(e.scheduledFor).getTime() - Date.now()),
        }));

        return NextResponse.json({
            success: true,
            events: enrichedEvents,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
            currentTime: now,
        });
    } catch (error) {
        console.error("Event queue error:", error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
