/**
 * Agent Tick API - DES Event Processor
 * 
 * POST /api/agents/tick
 * 
 * Processes the next event from the priority queue.
 * Events are only processed if scheduled_for <= now.
 * After processing, handlers schedule the next event.
 */

import { NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import {
    getNextReadyEvent,
    markEventProcessed,
    scheduleNextContextCheck,
    getTimeUntilNextEvent,
    getPendingEvents,
    TIER_DELAYS,
} from "@/lib/agent-events";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma3:4b";

/**
 * Generate a unique ID
 */
function generateId(): string {
    return Math.random().toString(36).substring(2, 10);
}

/**
 * Handle check_chat event
 * Calls the respond-chat logic inline
 */
async function handleCheckChat(
    agentId: string,
    contextId: string | null,
    payload: Record<string, unknown> | null
): Promise<{ responded: boolean; response?: string; channel?: string }> {
    // Get agent info
    const agents = await db
        .select()
        .from(schema.personnel)
        .where(eq(schema.personnel.id, agentId))
        .limit(1);

    if (agents.length === 0) {
        return { responded: false };
    }

    const agent = agents[0];

    // Get the channel ID from context or payload
    let channelId: string | null = null;

    if (contextId) {
        const contexts = await db
            .select()
            .from(schema.syncContexts)
            .where(eq(schema.syncContexts.id, contextId))
            .limit(1);

        if (contexts.length > 0) {
            channelId = contexts[0].relatedEntityId;
        }
    }

    if (!channelId && payload?.relatedEntityId) {
        channelId = payload.relatedEntityId as string;
    }

    if (!channelId) {
        return { responded: false };
    }

    // Get recent messages (newest first, then reverse for chronological order)
    const recentMessagesRaw = await db
        .select({
            id: schema.chatMessages.id,
            content: schema.chatMessages.content,
            senderId: schema.chatMessages.senderId,
            senderName: schema.personnel.name,
        })
        .from(schema.chatMessages)
        .innerJoin(
            schema.personnel,
            eq(schema.chatMessages.senderId, schema.personnel.id)
        )
        .where(eq(schema.chatMessages.channelId, channelId))
        .orderBy(desc(schema.chatMessages.sentAt))
        .limit(10);

    // Reverse to get chronological order (oldest first for context)
    const recentMessages = recentMessagesRaw.reverse();

    // Filter to messages not from this agent
    const otherMessages = recentMessages.filter(m => m.senderId !== agentId);

    if (otherMessages.length === 0) {
        return { responded: false };
    }

    // Get the most recent message to respond to
    const targetMessage = otherMessages[otherMessages.length - 1];

    // Build context for Ollama
    const messageHistory = recentMessages
        .slice(-5)
        .map(m => `${m.senderName}: ${m.content}`)
        .join("\n");

    const systemPrompt = `You are ${agent.name}, a ${agent.title || "Employee"} at work.
You are responding to a message in a chat channel.
Be professional but friendly. Keep responses concise (1-3 sentences).
Don't use emojis excessively. Stay in character.`;

    const userPrompt = `Recent conversation:
${messageHistory}

The latest message from ${targetMessage.senderName} is:
"${targetMessage.content}"

Respond naturally as ${agent.name}:`;

    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: userPrompt,
                system: systemPrompt,
                stream: false,
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama error: ${response.status}`);
        }

        const data = await response.json();
        const responseContent = data.response.trim();

        // Post the response
        const messageId = generateId();
        await db.insert(schema.chatMessages).values({
            id: messageId,
            channelId,
            senderId: agentId,
            content: responseContent,
            sentAt: new Date().toISOString(),
        });

        // Record as agent event
        await db.insert(schema.agentEvents).values({
            id: generateId(),
            personnelId: agentId,
            timestamp: new Date().toISOString(),
            eventType: "action",
            content: `Responded: "${responseContent}"`,
            targetEntity: `chat:${channelId}`,
            contextId,
        });

        // Get channel name for response
        const channels = await db
            .select()
            .from(schema.chatChannels)
            .where(eq(schema.chatChannels.id, channelId))
            .limit(1);

        return {
            responded: true,
            response: responseContent,
            channel: channels[0]?.name || channelId,
        };
    } catch (error) {
        console.error("Chat response error:", error);
        return { responded: false };
    }
}

/**
 * Process an event based on its type
 */
async function processEvent(event: schema.AgentScheduledEvent): Promise<{
    action: string;
    details: Record<string, unknown>;
    scheduleNext: boolean;
    nextTier: keyof typeof TIER_DELAYS;
}> {
    const payload = event.payload ? JSON.parse(event.payload) : null;

    switch (event.eventType) {
        case "activate": {
            // Set agent status to active
            await db
                .update(schema.personnel)
                .set({ agentStatus: "active" })
                .where(eq(schema.personnel.id, event.agentId));

            // Get agent's channel memberships
            const memberships = await db
                .select({
                    channelId: schema.chatMembers.channelId,
                    channelName: schema.chatChannels.name,
                })
                .from(schema.chatMembers)
                .innerJoin(
                    schema.chatChannels,
                    eq(schema.chatMembers.channelId, schema.chatChannels.id)
                )
                .where(eq(schema.chatMembers.personnelId, event.agentId));

            // Create sync contexts and schedule check events for each channel
            const contexts: string[] = [];
            for (const membership of memberships) {
                // Import the context creation function
                const { createChatContextForAgent } = await import("@/lib/agent-context");
                const result = await createChatContextForAgent(
                    event.agentId,
                    membership.channelId,
                    "sync",
                    membership.channelName || undefined
                );
                contexts.push(membership.channelName || membership.channelId);
            }

            return {
                action: "activated",
                details: {
                    status: "active",
                    contextsJoined: contexts,
                    channelsMonitoring: contexts.length,
                },
                scheduleNext: false, // Context creation schedules the events
                nextTier: "sync",
            };
        }

        case "check_chat": {
            const result = await handleCheckChat(event.agentId, event.contextId, payload);
            return {
                action: result.responded ? "responded_to_chat" : "checked_chat_no_response",
                details: result,
                scheduleNext: true,
                nextTier: (payload?.tier as keyof typeof TIER_DELAYS) || "sync",
            };
        }

        case "think": {
            // Generate a random thought (existing logic)
            return {
                action: "thought",
                details: { thought: "Thinking..." },
                scheduleNext: true,
                nextTier: "async",
            };
        }

        default:
            return {
                action: "unknown_event_type",
                details: { eventType: event.eventType },
                scheduleNext: false,
                nextTier: "sync",
            };
    }
}

export async function POST() {
    try {
        // Get next ready event
        const event = await getNextReadyEvent();

        if (!event) {
            // No events ready - return info about next scheduled event
            const msUntilNext = await getTimeUntilNextEvent();
            const pending = await getPendingEvents(5);

            return NextResponse.json({
                success: true,
                action: "no_events_ready",
                message: msUntilNext === null
                    ? "No events in queue"
                    : `Next event in ${Math.ceil(msUntilNext / 1000)} seconds`,
                pendingCount: pending.total,
                nextEvents: pending.events.map(e => ({
                    id: e.id,
                    type: e.eventType,
                    scheduledFor: e.scheduledFor,
                    agentId: e.agentId,
                })),
            });
        }

        // Get agent name for response
        const agents = await db
            .select({ name: schema.personnel.name })
            .from(schema.personnel)
            .where(eq(schema.personnel.id, event.agentId))
            .limit(1);

        const agentName = agents[0]?.name || event.agentId;

        // Process the event
        const result = await processEvent(event);

        // Mark as processed
        await markEventProcessed(event.id);

        // Schedule next event if needed
        let nextEventId: string | null = null;
        if (result.scheduleNext && event.contextId) {
            // Carry forward the context info from original event
            let payload: Record<string, unknown> | undefined;
            if (event.payload) {
                try {
                    const parsed = JSON.parse(event.payload);
                    payload = {
                        contextType: parsed.contextType,
                        relatedEntityId: parsed.relatedEntityId,
                        targetName: parsed.targetName,
                    };
                } catch { /* ignore */ }
            }

            nextEventId = await scheduleNextContextCheck(
                event.agentId,
                event.contextId,
                event.eventType,
                result.nextTier,
                payload
            );
        }

        return NextResponse.json({
            success: true,
            eventId: event.id,
            agentId: event.agentId,
            agentName,
            eventType: event.eventType,
            action: result.action,
            details: result.details,
            nextEventId,
            nextEventIn: result.scheduleNext
                ? `${TIER_DELAYS[result.nextTier].min}-${TIER_DELAYS[result.nextTier].max} seconds`
                : null,
        });
    } catch (error) {
        console.error("Tick error:", error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
