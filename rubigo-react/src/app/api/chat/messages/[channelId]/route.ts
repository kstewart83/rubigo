/**
 * Chat Messages by Channel API
 * 
 * List messages for a specific channel
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chatMessages, personnel } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/chat/messages/[channelId] - List messages for a channel
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ channelId: string }> }
) {
    try {
        const { channelId } = await params;
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "50");

        const messages = await db
            .select({
                id: chatMessages.id,
                channelId: chatMessages.channelId,
                senderId: chatMessages.senderId,
                content: chatMessages.content,
                sentAt: chatMessages.sentAt,
                editedAt: chatMessages.editedAt,
                senderName: personnel.name,
            })
            .from(chatMessages)
            .leftJoin(personnel, eq(chatMessages.senderId, personnel.id))
            .where(eq(chatMessages.channelId, channelId))
            .orderBy(desc(chatMessages.sentAt))
            .limit(limit);

        return NextResponse.json({ success: true, data: messages.reverse() });
    } catch (error) {
        console.error("Error listing messages:", error);
        return NextResponse.json(
            { success: false, error: "Failed to list messages" },
            { status: 500 }
        );
    }
}
