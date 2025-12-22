/**
 * Agent Context Management
 * 
 * Manages agent participation in sync contexts.
 * Joining a context schedules the first event.
 * Leaving a context cancels pending events.
 */

import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { scheduleEvent, cancelPendingEvents, TIER_DELAYS } from "./agent-events";

/**
 * Generate a unique ID
 */
function generateId(): string {
    return Math.random().toString(36).substring(2, 10);
}

/**
 * Map context type to event type
 */
function getEventTypeForContext(
    contextType: string
): schema.NewAgentScheduledEvent["eventType"] {
    switch (contextType) {
        case "chat_active":
            return "check_chat";
        case "meeting":
            return "check_chat"; // Meetings also involve chat-like interaction
        default:
            return "think";
    }
}

/**
 * Create a new sync context
 */
export async function createSyncContext(params: {
    contextType: schema.NewSyncContext["contextType"];
    reactionTier: schema.NewSyncContext["reactionTier"];
    relatedEntityId?: string;
}): Promise<string> {
    const id = generateId();

    await db.insert(schema.syncContexts).values({
        id,
        contextType: params.contextType,
        reactionTier: params.reactionTier,
        relatedEntityId: params.relatedEntityId ?? null,
        startedAt: new Date().toISOString(),
        endedAt: null,
    });

    return id;
}

/**
 * Join an agent to a sync context
 * This schedules the first event for them to check the context
 */
export async function joinContext(
    agentId: string,
    contextId: string,
    targetName?: string
): Promise<{ participantId: string; eventId: string }> {
    // Get context details
    const contexts = await db
        .select()
        .from(schema.syncContexts)
        .where(eq(schema.syncContexts.id, contextId))
        .limit(1);

    if (contexts.length === 0) {
        throw new Error("Context not found");
    }

    const context = contexts[0];

    // Add participant record
    const participantId = generateId();
    await db.insert(schema.syncContextParticipants).values({
        id: participantId,
        contextId,
        personnelId: agentId,
        joinedAt: new Date().toISOString(),
        leftAt: null,
    });

    // Schedule the first event with tier delay
    const tierConfig = TIER_DELAYS[context.reactionTier as keyof typeof TIER_DELAYS] || TIER_DELAYS.sync;
    const delaySeconds = Math.floor(Math.random() * (tierConfig.max - tierConfig.min + 1)) + tierConfig.min;
    const scheduledFor = new Date(Date.now() + delaySeconds * 1000).toISOString();

    const eventId = await scheduleEvent({
        agentId,
        eventType: getEventTypeForContext(context.contextType),
        contextId,
        scheduledFor,
        payload: {
            contextType: context.contextType,
            relatedEntityId: context.relatedEntityId,
            targetName: targetName || context.relatedEntityId,
        },
    });

    return { participantId, eventId };
}

/**
 * Remove an agent from a sync context
 * This cancels their pending events for this context
 */
export async function leaveContext(
    agentId: string,
    contextId: string
): Promise<void> {
    // Mark participant as left
    await db
        .update(schema.syncContextParticipants)
        .set({ leftAt: new Date().toISOString() })
        .where(
            and(
                eq(schema.syncContextParticipants.contextId, contextId),
                eq(schema.syncContextParticipants.personnelId, agentId),
                isNull(schema.syncContextParticipants.leftAt)
            )
        );

    // Cancel pending events
    await cancelPendingEvents(agentId, contextId);
}

/**
 * End a sync context entirely
 * All participants are marked as left, all events cancelled
 */
export async function endContext(contextId: string): Promise<void> {
    // Mark context as ended
    await db
        .update(schema.syncContexts)
        .set({ endedAt: new Date().toISOString() })
        .where(eq(schema.syncContexts.id, contextId));

    // Get all participants
    const participants = await db
        .select()
        .from(schema.syncContextParticipants)
        .where(
            and(
                eq(schema.syncContextParticipants.contextId, contextId),
                isNull(schema.syncContextParticipants.leftAt)
            )
        );

    // Leave each participant
    for (const p of participants) {
        await leaveContext(p.personnelId, contextId);
    }
}

/**
 * Get all active contexts for an agent
 */
export async function getActiveContextsForAgent(agentId: string): Promise<{
    participation: schema.SyncContextParticipant;
    context: schema.SyncContext;
}[]> {
    const results = await db
        .select({
            participation: schema.syncContextParticipants,
            context: schema.syncContexts,
        })
        .from(schema.syncContextParticipants)
        .innerJoin(
            schema.syncContexts,
            eq(schema.syncContextParticipants.contextId, schema.syncContexts.id)
        )
        .where(
            and(
                eq(schema.syncContextParticipants.personnelId, agentId),
                isNull(schema.syncContextParticipants.leftAt),
                isNull(schema.syncContexts.endedAt)
            )
        );

    return results;
}

/**
 * Helper: Create a chat context and add an agent to it
 * Convenience function for testing
 */
export async function createChatContextForAgent(
    agentId: string,
    channelId: string,
    tier: "sync" | "near_sync" | "async" = "sync",
    channelName?: string
): Promise<{ contextId: string; eventId: string }> {
    // Create the context
    const contextId = await createSyncContext({
        contextType: "chat_active",
        reactionTier: tier,
        relatedEntityId: channelId,
    });

    // Join the agent (pass channelName for payload)
    const { eventId } = await joinContext(agentId, contextId, channelName);

    return { contextId, eventId };
}
