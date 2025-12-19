/**
 * Chat Reactions by Message API
 * 
 * Get reactions for a specific message
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chatReactions, personnel } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

// GET /api/chat/reactions/[messageId] - Get reactions for a message
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ messageId: string }> }
) {
    try {
        const { messageId } = await params;

        // Get reactions grouped by emoji with count and user names
        const reactions = await db
            .select({
                emoji: chatReactions.emoji,
                personnelId: chatReactions.personnelId,
                personnelName: personnel.name,
            })
            .from(chatReactions)
            .leftJoin(personnel, eq(chatReactions.personnelId, personnel.id))
            .where(eq(chatReactions.messageId, messageId));

        // Group by emoji
        const grouped: Record<string, { emoji: string; count: number; users: string[] }> = {};
        for (const r of reactions) {
            if (!grouped[r.emoji]) {
                grouped[r.emoji] = { emoji: r.emoji, count: 0, users: [] };
            }
            grouped[r.emoji].count++;
            if (r.personnelName) {
                grouped[r.emoji].users.push(r.personnelName);
            }
        }

        return NextResponse.json({ success: true, data: Object.values(grouped) });
    } catch (error) {
        console.error("Error getting reactions:", error);
        return NextResponse.json(
            { success: false, error: "Failed to get reactions" },
            { status: 500 }
        );
    }
}
