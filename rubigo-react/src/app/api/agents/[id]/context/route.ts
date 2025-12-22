/**
 * Agent Context API
 * 
 * POST /api/agents/[id]/context - Join agent to a chat context
 * DELETE /api/agents/[id]/context - Leave a context
 */

import { NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createChatContextForAgent, leaveContext } from "@/lib/agent-context";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * POST - Join agent to a chat context
 * Body: { channelId: string, tier?: "sync" | "near_sync" | "async" }
 */
export async function POST(request: Request, { params }: RouteParams) {
    const { id } = await params;

    // Verify agent exists
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

    // Parse request body
    let body: { channelId: string; tier?: "sync" | "near_sync" | "async" };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { success: false, error: "Invalid JSON" },
            { status: 400 }
        );
    }

    if (!body.channelId) {
        return NextResponse.json(
            { success: false, error: "channelId is required" },
            { status: 400 }
        );
    }

    // Verify channel exists
    const channels = await db
        .select()
        .from(schema.chatChannels)
        .where(eq(schema.chatChannels.id, body.channelId))
        .limit(1);

    if (channels.length === 0) {
        return NextResponse.json(
            { success: false, error: "Channel not found" },
            { status: 404 }
        );
    }

    try {
        const result = await createChatContextForAgent(
            id,
            body.channelId,
            body.tier || "sync"
        );

        return NextResponse.json({
            success: true,
            agentId: id,
            agentName: agents[0].name,
            channelId: body.channelId,
            channelName: channels[0].name,
            contextId: result.contextId,
            firstEventId: result.eventId,
            tier: body.tier || "sync",
            message: `${agents[0].name} joined #${channels[0].name} with ${body.tier || "sync"} reactivity. First event scheduled immediately.`,
        });
    } catch (error) {
        console.error("Context creation error:", error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}

/**
 * DELETE - Leave a context
 * Body: { contextId: string }
 */
export async function DELETE(request: Request, { params }: RouteParams) {
    const { id } = await params;

    let body: { contextId: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { success: false, error: "Invalid JSON" },
            { status: 400 }
        );
    }

    if (!body.contextId) {
        return NextResponse.json(
            { success: false, error: "contextId is required" },
            { status: 400 }
        );
    }

    try {
        await leaveContext(id, body.contextId);

        return NextResponse.json({
            success: true,
            message: "Left context, pending events cancelled",
        });
    } catch (error) {
        console.error("Leave context error:", error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
