/**
 * Recent Agent Events API
 * GET /api/agents/events/recent
 * 
 * Returns recent agent events across all agents, sorted by timestamp.
 * Resolves channel names for chat actions.
 */

import { NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "20");

        // Get recent events with agent names
        const events = await db
            .select({
                id: schema.agentEvents.id,
                personnelId: schema.agentEvents.personnelId,
                agentName: schema.personnel.name,
                timestamp: schema.agentEvents.timestamp,
                eventType: schema.agentEvents.eventType,
                content: schema.agentEvents.content,
                targetEntity: schema.agentEvents.targetEntity,
                metadata: schema.agentEvents.metadata,
                aco: schema.agentEvents.aco,
            })
            .from(schema.agentEvents)
            .innerJoin(
                schema.personnel,
                eq(schema.agentEvents.personnelId, schema.personnel.id)
            )
            .orderBy(desc(schema.agentEvents.timestamp))
            .limit(limit);

        // Resolve channel names for chat actions
        const channelIds = events
            .filter(e => e.targetEntity?.startsWith("chat:"))
            .map(e => e.targetEntity!.replace("chat:", ""));

        let channelMap: Record<string, string> = {};
        if (channelIds.length > 0) {
            const channels = await db
                .select({ id: schema.chatChannels.id, name: schema.chatChannels.name })
                .from(schema.chatChannels)
                .where(inArray(schema.chatChannels.id, channelIds));
            channelMap = Object.fromEntries(
                channels.filter(c => c.name !== null).map(c => [c.id, c.name as string])
            );
        }

        // Enrich events with channel info
        const enrichedEvents = events.map(event => {
            let channelName: string | undefined;
            let actionType: string | undefined;

            if (event.targetEntity?.startsWith("chat:")) {
                const channelId = event.targetEntity.replace("chat:", "");
                channelName = channelMap[channelId];
                actionType = "message"; // Default to message, could parse from metadata

                // Try to parse metadata for more details
                if (event.metadata) {
                    try {
                        const meta = JSON.parse(event.metadata);
                        if (meta.type) actionType = meta.type;
                    } catch { /* ignore */ }
                }
            }

            return {
                ...event,
                channelName,
                actionType,
            };
        });

        return NextResponse.json({
            success: true,
            events: enrichedEvents,
            count: enrichedEvents.length,
        });
    } catch (error) {
        console.error("Error fetching recent events:", error);
        return NextResponse.json(
            { success: false, error: String(error), events: [] },
            { status: 500 }
        );
    }
}
