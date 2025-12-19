/**
 * Chat Channels API
 * 
 * CRUD operations for chat channels
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chatChannels, chatMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

// GET /api/chat/channels - List all channels
export async function GET() {
    try {
        const channels = await db.select().from(chatChannels).where(eq(chatChannels.type, "channel"));
        return NextResponse.json({ success: true, data: channels });
    } catch (error) {
        console.error("Error listing channels:", error);
        return NextResponse.json(
            { success: false, error: "Failed to list channels" },
            { status: 500 }
        );
    }
}

// POST /api/chat/channels - Create a new channel
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, description, type, createdBy } = body;

        if (!name || !type) {
            return NextResponse.json(
                { success: false, error: "name and type are required" },
                { status: 400 }
            );
        }

        const channelId = id || nanoid(6);
        const now = new Date().toISOString();

        await db.insert(chatChannels).values({
            id: channelId,
            name,
            description,
            type,
            createdBy,
            createdAt: now,
        });

        // If createdBy is specified, add them as a member
        if (createdBy) {
            await db.insert(chatMembers).values({
                id: nanoid(6),
                channelId,
                personnelId: createdBy,
                joinedAt: now,
            });
        }

        return NextResponse.json({ success: true, id: channelId });
    } catch (error) {
        console.error("Error creating channel:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create channel" },
            { status: 500 }
        );
    }
}
