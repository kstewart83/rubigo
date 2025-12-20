/**
 * Chat Members API
 * 
 * Add/remove members from channels
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chatMembers } from "@/db/schema";
import { and, eq } from "drizzle-orm";

/** Generate a short random ID (6 chars, alphanumeric) */
function generateId(length: number = 6): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => chars[b % chars.length]).join("");
}

// POST /api/chat/members - Add a member to a channel
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, channelId, personnelId } = body;

        if (!channelId || !personnelId) {
            return NextResponse.json(
                { success: false, error: "channelId and personnelId are required" },
                { status: 400 }
            );
        }

        // Check if already a member
        const existing = await db.select()
            .from(chatMembers)
            .where(and(
                eq(chatMembers.channelId, channelId),
                eq(chatMembers.personnelId, personnelId)
            ));

        if (existing.length > 0) {
            return NextResponse.json({ success: true, id: existing[0].id, existed: true });
        }

        const memberId = id || generateId();
        const now = new Date().toISOString();

        await db.insert(chatMembers).values({
            id: memberId,
            channelId,
            personnelId,
            joinedAt: now,
        });

        return NextResponse.json({ success: true, id: memberId });
    } catch (error) {
        console.error("Error adding member:", error);
        return NextResponse.json(
            { success: false, error: "Failed to add member" },
            { status: 500 }
        );
    }
}
