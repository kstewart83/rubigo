/**
 * Agent Event Scheduling - DES Event Queue Management
 * 
 * Handles scheduling, retrieving, and processing events from the priority queue.
 * Events are ordered by scheduled_for timestamp.
 */

import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, lte, isNull, asc } from "drizzle-orm";

/**
 * Delay configurations by reaction tier (in seconds)
 */
export const TIER_DELAYS = {
    sync: { min: 30, max: 30 },         // 30 seconds (for testing visibility)
    near_sync: { min: 60, max: 120 },   // 1-2 minutes
    async: { min: 300, max: 900 },      // 5-15 minutes
} as const;

/**
 * Generate a unique ID
 */
function generateId(): string {
    return Math.random().toString(36).substring(2, 10);
}

/**
 * Get a random delay within the tier's range
 */
export function getDelayForTier(tier: keyof typeof TIER_DELAYS): number {
    const range = TIER_DELAYS[tier];
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
}

/**
 * Add seconds to a date and return ISO string
 */
function addSeconds(date: Date | string, seconds: number): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Date(d.getTime() + seconds * 1000).toISOString();
}

/**
 * Schedule an event for an agent
 */
export async function scheduleEvent(params: {
    agentId: string;
    eventType: schema.NewAgentScheduledEvent["eventType"];
    contextId?: string | null;
    scheduledFor: string | Date;
    payload?: Record<string, unknown>;
}): Promise<string> {
    const id = generateId();
    const scheduledFor = typeof params.scheduledFor === "string"
        ? params.scheduledFor
        : params.scheduledFor.toISOString();

    await db.insert(schema.agentScheduledEvents).values({
        id,
        agentId: params.agentId,
        eventType: params.eventType,
        contextId: params.contextId ?? null,
        scheduledFor,
        payload: params.payload ? JSON.stringify(params.payload) : null,
        createdAt: new Date().toISOString(),
        processedAt: null,
    });

    return id;
}

/**
 * Schedule the next event for a context based on its reaction tier
 */
export async function scheduleNextContextCheck(
    agentId: string,
    contextId: string,
    eventType: schema.NewAgentScheduledEvent["eventType"],
    tier: keyof typeof TIER_DELAYS = "sync",
    payload?: Record<string, unknown>
): Promise<string> {
    const delaySeconds = getDelayForTier(tier);
    const scheduledFor = addSeconds(new Date(), delaySeconds);

    return scheduleEvent({
        agentId,
        eventType,
        contextId,
        scheduledFor,
        payload,
    });
}

/**
 * Get the next event that is ready to process
 * Returns null if no events are ready (scheduled_for > now)
 */
export async function getNextReadyEvent(): Promise<schema.AgentScheduledEvent | null> {
    const now = new Date().toISOString();

    const events = await db
        .select()
        .from(schema.agentScheduledEvents)
        .where(
            and(
                lte(schema.agentScheduledEvents.scheduledFor, now),
                isNull(schema.agentScheduledEvents.processedAt)
            )
        )
        .orderBy(asc(schema.agentScheduledEvents.scheduledFor))
        .limit(1);

    return events.length > 0 ? events[0] : null;
}

/**
 * Get all pending events (for UI display)
 */
export async function getPendingEvents(limit = 20, offset = 0): Promise<{
    events: schema.AgentScheduledEvent[];
    total: number;
}> {
    const events = await db
        .select()
        .from(schema.agentScheduledEvents)
        .where(isNull(schema.agentScheduledEvents.processedAt))
        .orderBy(asc(schema.agentScheduledEvents.scheduledFor))
        .limit(limit)
        .offset(offset);

    // Get total count
    const countResult = await db
        .select({ count: schema.agentScheduledEvents.id })
        .from(schema.agentScheduledEvents)
        .where(isNull(schema.agentScheduledEvents.processedAt));

    return {
        events,
        total: countResult.length,
    };
}

/**
 * Mark an event as processed
 */
export async function markEventProcessed(eventId: string): Promise<void> {
    await db
        .update(schema.agentScheduledEvents)
        .set({ processedAt: new Date().toISOString() })
        .where(eq(schema.agentScheduledEvents.id, eventId));
}

/**
 * Cancel all pending events for an agent in a specific context
 * Used when agent leaves a context
 */
export async function cancelPendingEvents(
    agentId: string,
    contextId: string
): Promise<number> {
    // Mark as processed with special note in payload
    await db
        .update(schema.agentScheduledEvents)
        .set({
            processedAt: new Date().toISOString(),
            payload: JSON.stringify({ cancelled: true, reason: "context_left" }),
        })
        .where(
            and(
                eq(schema.agentScheduledEvents.agentId, agentId),
                eq(schema.agentScheduledEvents.contextId, contextId),
                isNull(schema.agentScheduledEvents.processedAt)
            )
        );

    return 1; // Placeholder - Drizzle doesn't return affected count easily
}

/**
 * Get the time until the next event is ready
 * Returns null if no pending events, 0 if event is ready now
 */
export async function getTimeUntilNextEvent(): Promise<number | null> {
    const events = await db
        .select({ scheduledFor: schema.agentScheduledEvents.scheduledFor })
        .from(schema.agentScheduledEvents)
        .where(isNull(schema.agentScheduledEvents.processedAt))
        .orderBy(asc(schema.agentScheduledEvents.scheduledFor))
        .limit(1);

    if (events.length === 0) {
        return null;
    }

    const nextTime = new Date(events[0].scheduledFor).getTime();
    const now = Date.now();

    return Math.max(0, nextTime - now);
}
