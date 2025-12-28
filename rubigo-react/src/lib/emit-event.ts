/**
 * Event Emitter - Helper for server actions to emit real-time events
 * 
 * Posts events to the Bun Worker which dispatches to SSE connections.
 * Also persists events to session_events table for catch-up.
 */

import { db } from "@/db";
import { sessionEvents, securitySessions } from "@/db/schema";
import { eq } from "drizzle-orm";

// Event types for the real-time system
export type EventType =
    | "presence.update"
    | "chat.message"
    | "chat.typing"
    | "calendar.update"
    | "personnel.update"
    | "notification";

export interface SessionEventPayload {
    id: string;
    type: EventType;
    payload: unknown;
    timestamp: string;
}

// Generate unique event ID
function generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Emit event to a specific session
 * Persists to DB and dispatches via worker
 */
export async function emitToSession(
    sessionId: string,
    type: EventType,
    payload: unknown
): Promise<string> {
    const event: SessionEventPayload = {
        id: generateEventId(),
        type,
        payload,
        timestamp: new Date().toISOString(),
    };

    // Persist to session_events for catch-up
    await db.insert(sessionEvents).values({
        id: event.id,
        sessionId,
        eventType: type,
        payload: JSON.stringify(payload),
        createdAt: event.timestamp,
    });

    // Post to worker for immediate dispatch
    // Note: Worker integration happens in the /api/events route
    // This function just persists; the SSE route reads and streams

    return event.id;
}

/**
 * Emit event to all active sessions (broadcast)
 * Useful for global updates like personnel changes
 * 
 * Note: Includes both real security sessions AND persona-based sessions
 */
export async function emitBroadcast(
    type: EventType,
    payload: unknown
): Promise<string[]> {
    const event: SessionEventPayload = {
        id: generateEventId(),
        type,
        payload,
        timestamp: new Date().toISOString(),
    };

    const eventIds: string[] = [];

    // Get all real security sessions
    const sessions = await db
        .select({ id: securitySessions.id })
        .from(securitySessions);

    for (const session of sessions) {
        const eventId = `${event.id}_${session.id.slice(0, 6)}`;
        await db.insert(sessionEvents).values({
            id: eventId,
            sessionId: session.id,
            eventType: type,
            payload: JSON.stringify(payload),
            createdAt: event.timestamp,
        });
        eventIds.push(eventId);
    }

    // Also get all personnel for persona-based sessions
    // (These use synthetic session IDs like "persona_{personnelId}")
    const { personnel } = await import("@/db/schema");
    const allPersonnel = await db
        .select({ id: personnel.id })
        .from(personnel);

    for (const person of allPersonnel) {
        const syntheticSessionId = `persona_${person.id}`;
        const eventId = `${event.id}_${person.id.slice(0, 6)}`;
        await db.insert(sessionEvents).values({
            id: eventId,
            sessionId: syntheticSessionId,
            eventType: type,
            payload: JSON.stringify(payload),
            createdAt: event.timestamp,
        });
        eventIds.push(eventId);
    }

    return eventIds;
}

/**
 * Emit event to sessions of specific personnel
 * Useful for targeted notifications
 */
export async function emitToPersonnel(
    personnelId: string,
    type: EventType,
    payload: unknown
): Promise<string[]> {
    // Find sessions for this personnel
    const sessions = await db
        .select({ id: securitySessions.id })
        .from(securitySessions)
        .where(eq(securitySessions.personnelId, personnelId));

    const eventIds: string[] = [];
    for (const session of sessions) {
        const eventId = await emitToSession(session.id, type, payload);
        eventIds.push(eventId);
    }

    return eventIds;
}
