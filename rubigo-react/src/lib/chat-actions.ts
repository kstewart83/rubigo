/**
 * Chat Server Actions
 *
 * CRUD operations for chat channels and messages
 */

"use server";

import { db } from "@/db";
import {
    chatChannels,
    chatMembers,
    chatMessages,
    personnel,
    type ChatChannel,
    type ChatMessage,
    type ChatMember,
} from "@/db/schema";
import { eq, and, desc, or } from "drizzle-orm";

// ============================================================================
// Types
// ============================================================================

export interface ChatChannelWithMembers extends ChatChannel {
    members: { personnelId: string; name: string }[];
}

export interface ChatMessageWithSender extends ChatMessage {
    senderName: string;
}

// ============================================================================
// Channel Operations
// ============================================================================

/**
 * Create a new chat channel
 */
export async function createChannel(
    name: string,
    description: string | undefined,
    createdById: string
): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
        const now = new Date().toISOString();
        const id = crypto.randomUUID();

        // Insert channel
        await db.insert(chatChannels).values({
            id,
            name,
            description: description ?? null,
            type: "channel",
            createdBy: createdById,
            createdAt: now,
        });

        // Add creator as member
        await db.insert(chatMembers).values({
            id: crypto.randomUUID(),
            channelId: id,
            personnelId: createdById,
            joinedAt: now,
        });

        return { success: true, id };
    } catch (error) {
        console.error("Failed to create channel:", error);
        return { success: false, error: "Failed to create channel" };
    }
}

/**
 * Get all public channels (non-DM)
 */
export async function getChannels(): Promise<ChatChannel[]> {
    return db
        .select()
        .from(chatChannels)
        .where(eq(chatChannels.type, "channel"));
}

/**
 * Get channels that a user is a member of
 */
export async function getUserChannels(userId: string): Promise<ChatChannel[]> {
    const memberChannels = await db
        .select({
            channel: chatChannels,
        })
        .from(chatMembers)
        .innerJoin(chatChannels, eq(chatMembers.channelId, chatChannels.id))
        .where(eq(chatMembers.personnelId, userId));

    return memberChannels.map((m) => m.channel);
}

/**
 * Get a single channel by ID with members
 */
export async function getChannel(id: string): Promise<ChatChannelWithMembers | null> {
    const channels = await db
        .select()
        .from(chatChannels)
        .where(eq(chatChannels.id, id));

    if (channels.length === 0) return null;

    const channel = channels[0];

    // Get members with names
    const members = await db
        .select({
            personnelId: chatMembers.personnelId,
            name: personnel.name,
        })
        .from(chatMembers)
        .innerJoin(personnel, eq(chatMembers.personnelId, personnel.id))
        .where(eq(chatMembers.channelId, id));

    return {
        ...channel,
        members,
    };
}

/**
 * Join a channel
 */
export async function joinChannel(
    channelId: string,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const now = new Date().toISOString();

        // Check if already a member
        const existing = await db
            .select()
            .from(chatMembers)
            .where(
                and(
                    eq(chatMembers.channelId, channelId),
                    eq(chatMembers.personnelId, userId)
                )
            );

        if (existing.length > 0) {
            return { success: true }; // Already a member
        }

        await db.insert(chatMembers).values({
            id: crypto.randomUUID(),
            channelId,
            personnelId: userId,
            joinedAt: now,
        });

        return { success: true };
    } catch (error) {
        console.error("Failed to join channel:", error);
        return { success: false, error: "Failed to join channel" };
    }
}

/**
 * Leave a channel
 */
export async function leaveChannel(
    channelId: string,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        await db
            .delete(chatMembers)
            .where(
                and(
                    eq(chatMembers.channelId, channelId),
                    eq(chatMembers.personnelId, userId)
                )
            );

        return { success: true };
    } catch (error) {
        console.error("Failed to leave channel:", error);
        return { success: false, error: "Failed to leave channel" };
    }
}

// ============================================================================
// Direct Message Operations
// ============================================================================

/**
 * Get or create a DM channel between two users
 */
export async function getOrCreateDirectMessage(
    userId1: string,
    userId2: string
): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
        // Find existing DM channel between these users
        const user1Channels = await db
            .select({ channelId: chatMembers.channelId })
            .from(chatMembers)
            .where(eq(chatMembers.personnelId, userId1));

        const user2Channels = await db
            .select({ channelId: chatMembers.channelId })
            .from(chatMembers)
            .where(eq(chatMembers.personnelId, userId2));

        const user1ChannelIds = new Set(user1Channels.map((c) => c.channelId));
        const commonChannelIds = user2Channels
            .filter((c) => user1ChannelIds.has(c.channelId))
            .map((c) => c.channelId);

        // Check if any common channel is a DM
        for (const channelId of commonChannelIds) {
            const channel = await db
                .select()
                .from(chatChannels)
                .where(and(eq(chatChannels.id, channelId), eq(chatChannels.type, "dm")));

            if (channel.length > 0) {
                return { success: true, id: channel[0].id };
            }
        }

        // Create new DM channel
        const now = new Date().toISOString();
        const id = crypto.randomUUID();

        await db.insert(chatChannels).values({
            id,
            name: null, // DMs don't have names
            description: null,
            type: "dm",
            createdBy: userId1,
            createdAt: now,
        });

        // Add both users as members
        await db.insert(chatMembers).values([
            {
                id: crypto.randomUUID(),
                channelId: id,
                personnelId: userId1,
                joinedAt: now,
            },
            {
                id: crypto.randomUUID(),
                channelId: id,
                personnelId: userId2,
                joinedAt: now,
            },
        ]);

        return { success: true, id };
    } catch (error) {
        console.error("Failed to get/create DM:", error);
        return { success: false, error: "Failed to create direct message" };
    }
}

/**
 * Get DM channels for a user
 */
export async function getUserDirectMessages(userId: string): Promise<ChatChannelWithMembers[]> {
    const userChannels = await db
        .select({
            channel: chatChannels,
        })
        .from(chatMembers)
        .innerJoin(chatChannels, eq(chatMembers.channelId, chatChannels.id))
        .where(
            and(
                eq(chatMembers.personnelId, userId),
                eq(chatChannels.type, "dm")
            )
        );

    // Get members for each DM
    const result: ChatChannelWithMembers[] = [];
    for (const { channel } of userChannels) {
        const members = await db
            .select({
                personnelId: chatMembers.personnelId,
                name: personnel.name,
            })
            .from(chatMembers)
            .innerJoin(personnel, eq(chatMembers.personnelId, personnel.id))
            .where(eq(chatMembers.channelId, channel.id));

        result.push({ ...channel, members });
    }

    return result;
}

// ============================================================================
// Message Operations
// ============================================================================

/**
 * Send a message to a channel
 */
export async function sendMessage(
    channelId: string,
    senderId: string,
    content: string
): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
        const now = new Date().toISOString();
        const id = crypto.randomUUID();

        await db.insert(chatMessages).values({
            id,
            channelId,
            senderId,
            content,
            sentAt: now,
            deleted: false,
        });

        return { success: true, id };
    } catch (error) {
        console.error("Failed to send message:", error);
        return { success: false, error: "Failed to send message" };
    }
}

/**
 * Get messages for a channel
 */
export async function getMessages(
    channelId: string,
    limit: number = 50
): Promise<ChatMessageWithSender[]> {
    const messages = await db
        .select({
            message: chatMessages,
            senderName: personnel.name,
        })
        .from(chatMessages)
        .innerJoin(personnel, eq(chatMessages.senderId, personnel.id))
        .where(
            and(
                eq(chatMessages.channelId, channelId),
                eq(chatMessages.deleted, false)
            )
        )
        .orderBy(desc(chatMessages.sentAt))
        .limit(limit);

    // Reverse to get chronological order (oldest first)
    return messages.reverse().map(({ message, senderName }) => ({
        ...message,
        senderName,
    }));
}

/**
 * Delete a message (soft delete)
 */
export async function deleteMessage(
    messageId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        await db
            .update(chatMessages)
            .set({ deleted: true })
            .where(eq(chatMessages.id, messageId));

        return { success: true };
    } catch (error) {
        console.error("Failed to delete message:", error);
        return { success: false, error: "Failed to delete message" };
    }
}
