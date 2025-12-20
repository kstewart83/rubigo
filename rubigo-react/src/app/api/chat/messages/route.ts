/**
 * Chat Messages API
 * 
 * Send and list messages in channels
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chatMessages, personnel } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

/** Generate a short random ID (6 chars, alphanumeric) */
function generateId(length: number = 6): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => chars[b % chars.length]).join("");
}

// POST /api/chat/messages - Send a message
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, channelId, senderId, content, sentAt } = body;

        if (!channelId || !senderId || !content) {
            return NextResponse.json(
                { success: false, error: "channelId, senderId, and content are required" },
                { status: 400 }
            );
        }

        const messageId = id || generateId();
        const timestamp = sentAt || new Date().toISOString();

        await db.insert(chatMessages).values({
            id: messageId,
            channelId,
            senderId,
            content,
            sentAt: timestamp,
        });

        return NextResponse.json({ success: true, id: messageId });
    } catch (error) {
        console.error("Error sending message:", error);
        return NextResponse.json(
            { success: false, error: "Failed to send message" },
            { status: 500 }
        );
    }
}
