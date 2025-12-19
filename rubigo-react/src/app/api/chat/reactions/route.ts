/**
 * Chat Reactions API
 * 
 * Add/remove emoji reactions to messages
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chatReactions } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

// POST /api/chat/reactions - Add a reaction
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, messageId, personnelId, emoji } = body;

        if (!messageId || !personnelId || !emoji) {
            return NextResponse.json(
                { success: false, error: "messageId, personnelId, and emoji are required" },
                { status: 400 }
            );
        }

        // Check if reaction already exists
        const existing = await db.select()
            .from(chatReactions)
            .where(and(
                eq(chatReactions.messageId, messageId),
                eq(chatReactions.personnelId, personnelId),
                eq(chatReactions.emoji, emoji)
            ));

        if (existing.length > 0) {
            return NextResponse.json({ success: true, id: existing[0].id });
        }

        const reactionId = id || nanoid(6);
        const now = new Date().toISOString();

        await db.insert(chatReactions).values({
            id: reactionId,
            messageId,
            personnelId,
            emoji,
            createdAt: now,
        });

        return NextResponse.json({ success: true, id: reactionId });
    } catch (error) {
        console.error("Error adding reaction:", error);
        return NextResponse.json(
            { success: false, error: "Failed to add reaction" },
            { status: 500 }
        );
    }
}
