/**
 * Calendar Server Actions
 * 
 * CRUD operations for calendar events
 */

"use server";

import { db } from "@/db";
import {
    calendarEvents,
    calendarParticipants,
    calendarDeviations,
    type CalendarDeviation,
} from "@/db/schema";
import { eq, and, gte, lte, or } from "drizzle-orm";
import type { CalendarEventWithParticipants } from "@/lib/calendar-utils";
import { type SessionContext, filterBySession } from "@/lib/access-control/abac-filter";

// ============================================================================
// Types
// ============================================================================

export type EventType =
    | "meeting" | "standup" | "allHands" | "oneOnOne" | "training"
    | "interview" | "holiday" | "conference" | "review" | "planning"
    | "appointment" | "reminder" | "outOfOffice";

export type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "yearly";

export interface CalendarEventInput {
    title: string;
    description?: string;
    startTime: string; // ISO 8601
    endTime: string;
    eventType?: EventType;
    recurrence?: RecurrenceType;
    recurrenceDays?: string[]; // ["Mon", "Wed", "Fri"]
    recurrenceUntil?: string;
    timezone?: string;
    location?: string;
    participantIds?: string[];
    allDay?: boolean;
    // Security/ABAC fields
    aco?: string;
    descriptionAco?: string;
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Create a new calendar event
 */
export async function createCalendarEvent(
    input: CalendarEventInput,
    organizerId: string
): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
        const now = new Date().toISOString();
        const id = crypto.randomUUID();

        // Insert event
        await db.insert(calendarEvents).values({
            id,
            title: input.title,
            description: input.description ?? null,
            startTime: input.startTime,
            endTime: input.endTime,
            eventType: input.eventType ?? "meeting",
            recurrence: input.recurrence ?? "none",
            recurrenceDays: input.recurrenceDays ? JSON.stringify(input.recurrenceDays) : null,
            recurrenceUntil: input.recurrenceUntil ?? null,
            timezone: input.timezone ?? "America/New_York",
            location: input.location ?? null,
            organizerId,
            deleted: false,
            createdAt: now,
            updatedAt: now,
            // Security/ABAC fields
            aco: input.aco ?? '{"sensitivity":"low"}',
            descriptionAco: input.descriptionAco ?? null,
        });

        // Add organizer as participant
        await db.insert(calendarParticipants).values({
            id: crypto.randomUUID(),
            eventId: id,
            personnelId: organizerId,
            role: "organizer",
        });

        // Add other participants
        if (input.participantIds && input.participantIds.length > 0) {
            for (const personnelId of input.participantIds) {
                if (personnelId !== organizerId) {
                    await db.insert(calendarParticipants).values({
                        id: crypto.randomUUID(),
                        eventId: id,
                        personnelId,
                        role: "participant",
                    });
                }
            }
        }

        return { success: true, id };
    } catch (error) {
        console.error("Failed to create calendar event:", error);
        return { success: false, error: "Failed to create event" };
    }
}

/**
 * Get calendar events for a date range
 * @param startDate - Start of date range (ISO 8601)
 * @param endDate - End of date range (ISO 8601)
 * @param sessionContext - Optional session context for ABAC filtering
 */
export async function getCalendarEvents(
    startDate: string,
    endDate: string,
    sessionContext?: SessionContext
): Promise<CalendarEventWithParticipants[]> {
    // Get base events in range (non-recurring)
    const events = await db
        .select()
        .from(calendarEvents)
        .where(
            and(
                eq(calendarEvents.deleted, false),
                or(
                    // Non-recurring events in range
                    and(
                        eq(calendarEvents.recurrence, "none"),
                        gte(calendarEvents.startTime, startDate),
                        lte(calendarEvents.startTime, endDate)
                    ),
                    // Recurring events that started before end of range
                    and(
                        or(
                            eq(calendarEvents.recurrence, "daily"),
                            eq(calendarEvents.recurrence, "weekly"),
                            eq(calendarEvents.recurrence, "monthly"),
                            eq(calendarEvents.recurrence, "yearly")
                        ),
                        lte(calendarEvents.startTime, endDate)
                    )
                )
            )
        );

    // Get participants for each event
    const result: CalendarEventWithParticipants[] = [];
    for (const event of events) {
        const participants = await db
            .select({
                personnelId: calendarParticipants.personnelId,
                role: calendarParticipants.role,
            })
            .from(calendarParticipants)
            .where(eq(calendarParticipants.eventId, event.id));

        result.push({
            ...event,
            participants: participants.map(p => ({
                personnelId: p.personnelId,
                role: p.role ?? "participant",
            })),
        });
    }

    // Apply session-level ABAC filtering if context provided
    if (sessionContext) {
        return filterBySession(result, sessionContext);
    }

    return result;
}

/**
 * Get a single calendar event by ID
 */
export async function getCalendarEvent(id: string): Promise<CalendarEventWithParticipants | null> {
    const events = await db
        .select()
        .from(calendarEvents)
        .where(and(eq(calendarEvents.id, id), eq(calendarEvents.deleted, false)));

    if (events.length === 0) return null;

    const event = events[0];
    const participants = await db
        .select({
            personnelId: calendarParticipants.personnelId,
            role: calendarParticipants.role,
        })
        .from(calendarParticipants)
        .where(eq(calendarParticipants.eventId, id));

    return {
        ...event,
        participants: participants.map(p => ({
            personnelId: p.personnelId,
            role: p.role ?? "participant",
        })),
    };
}

/**
 * Update a calendar event
 */
export async function updateCalendarEvent(
    id: string,
    input: Partial<CalendarEventInput>
): Promise<{ success: boolean; error?: string }> {
    try {
        const now = new Date().toISOString();

        await db
            .update(calendarEvents)
            .set({
                ...(input.title !== undefined && { title: input.title }),
                ...(input.description !== undefined && { description: input.description }),
                ...(input.startTime !== undefined && { startTime: input.startTime }),
                ...(input.endTime !== undefined && { endTime: input.endTime }),
                ...(input.eventType !== undefined && { eventType: input.eventType }),
                ...(input.recurrence !== undefined && { recurrence: input.recurrence }),
                ...(input.recurrenceDays !== undefined && {
                    recurrenceDays: JSON.stringify(input.recurrenceDays),
                }),
                ...(input.recurrenceUntil !== undefined && { recurrenceUntil: input.recurrenceUntil }),
                ...(input.location !== undefined && { location: input.location }),
                ...(input.aco !== undefined && { aco: input.aco }),
                ...(input.descriptionAco !== undefined && { descriptionAco: input.descriptionAco }),
                updatedAt: now,
            })
            .where(eq(calendarEvents.id, id));

        return { success: true };
    } catch (error) {
        console.error("Failed to update calendar event:", error);
        return { success: false, error: "Failed to update event" };
    }
}

/**
 * Delete a calendar event (soft delete)
 */
export async function deleteCalendarEvent(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await db
            .update(calendarEvents)
            .set({ deleted: true, updatedAt: new Date().toISOString() })
            .where(eq(calendarEvents.id, id));

        return { success: true };
    } catch (error) {
        console.error("Failed to delete calendar event:", error);
        return { success: false, error: "Failed to delete event" };
    }
}

/**
 * Cancel a single instance of a recurring event
 */
export async function cancelEventInstance(
    eventId: string,
    date: string // YYYY-MM-DD
): Promise<{ success: boolean; error?: string }> {
    try {
        await db.insert(calendarDeviations).values({
            id: crypto.randomUUID(),
            eventId,
            originalDate: date,
            cancelled: true,
        });

        return { success: true };
    } catch (error) {
        console.error("Failed to cancel event instance:", error);
        return { success: false, error: "Failed to cancel instance" };
    }
}

/**
 * Get deviations for an event
 */
export async function getEventDeviations(eventId: string): Promise<CalendarDeviation[]> {
    return db
        .select()
        .from(calendarDeviations)
        .where(eq(calendarDeviations.eventId, eventId));
}

/**
 * Modify a single instance of a recurring event
 * Creates or updates a deviation for the specified date
 */
export async function modifyEventInstance(
    eventId: string,
    originalDate: string, // YYYY-MM-DD - the instance being modified
    modifications: {
        startTime?: string; // Full datetime string or just time
        endTime?: string;
        title?: string;
        description?: string;
        location?: string;
        timezone?: string;
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        // Check if a deviation already exists for this date
        const existing = await db
            .select()
            .from(calendarDeviations)
            .where(
                and(
                    eq(calendarDeviations.eventId, eventId),
                    eq(calendarDeviations.originalDate, originalDate)
                )
            );

        if (existing.length > 0) {
            // Update existing deviation
            await db
                .update(calendarDeviations)
                .set({
                    overrideStartTime: modifications.startTime,
                    overrideEndTime: modifications.endTime,
                    overrideTitle: modifications.title,
                    overrideDescription: modifications.description,
                    overrideLocation: modifications.location,
                    overrideTimezone: modifications.timezone,
                    cancelled: false, // Ensure it's not cancelled if we're modifying
                })
                .where(eq(calendarDeviations.id, existing[0].id));
        } else {
            // Create new deviation
            await db.insert(calendarDeviations).values({
                id: crypto.randomUUID(),
                eventId,
                originalDate,
                overrideStartTime: modifications.startTime,
                overrideEndTime: modifications.endTime,
                overrideTitle: modifications.title,
                overrideDescription: modifications.description,
                overrideLocation: modifications.location,
                overrideTimezone: modifications.timezone,
                cancelled: false,
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Failed to modify event instance:", error);
        return { success: false, error: "Failed to modify instance" };
    }
}

/**
 * Move a single instance of a recurring event to a different date
 * This creates:
 * 1. An anchored cancellation for the original date
 * 2. An unanchored deviation for the new date
 */
export async function moveEventInstance(
    eventId: string,
    originalDate: string, // YYYY-MM-DD - the instance being moved FROM
    newDate: string,      // YYYY-MM-DD - the date to move TO
    modifications?: {
        startTime?: string;
        endTime?: string;
        title?: string;
        description?: string;
        location?: string;
        timezone?: string;
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        // 1. Create or update anchored cancellation for the original date
        const existingCancellation = await db
            .select()
            .from(calendarDeviations)
            .where(
                and(
                    eq(calendarDeviations.eventId, eventId),
                    eq(calendarDeviations.originalDate, originalDate)
                )
            );

        if (existingCancellation.length > 0) {
            // Update to cancelled
            await db
                .update(calendarDeviations)
                .set({ cancelled: true })
                .where(eq(calendarDeviations.id, existingCancellation[0].id));
        } else {
            // Create new cancellation
            await db.insert(calendarDeviations).values({
                id: crypto.randomUUID(),
                eventId,
                originalDate,
                cancelled: true,
            });
        }

        // 2. Check if unanchored deviation already exists for the new date
        const existingUnanchored = await db
            .select()
            .from(calendarDeviations)
            .where(
                and(
                    eq(calendarDeviations.eventId, eventId),
                    eq(calendarDeviations.newDate, newDate)
                )
            );

        if (existingUnanchored.length > 0) {
            // Update existing unanchored deviation
            await db
                .update(calendarDeviations)
                .set({
                    overrideStartTime: modifications?.startTime,
                    overrideEndTime: modifications?.endTime,
                    overrideTitle: modifications?.title,
                    overrideDescription: modifications?.description,
                    overrideLocation: modifications?.location,
                    overrideTimezone: modifications?.timezone,
                    cancelled: false,
                })
                .where(eq(calendarDeviations.id, existingUnanchored[0].id));
        } else {
            // Create new unanchored deviation
            await db.insert(calendarDeviations).values({
                id: crypto.randomUUID(),
                eventId,
                newDate,
                overrideStartTime: modifications?.startTime,
                overrideEndTime: modifications?.endTime,
                overrideTitle: modifications?.title,
                overrideDescription: modifications?.description,
                overrideLocation: modifications?.location,
                overrideTimezone: modifications?.timezone,
                cancelled: false,
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Failed to move event instance:", error);
        return { success: false, error: "Failed to move instance" };
    }
}

// ============================================================================
// Orphaned Deviation Management
// ============================================================================

/**
 * Get orphaned deviations for a recurring event
 * An anchored deviation is orphaned if its originalDate no longer occurs 
 * in the event's current recurrence pattern
 */
export async function getOrphanedDeviations(eventId: string): Promise<CalendarDeviation[]> {
    // First, get the event to check its recurrence pattern
    const event = await getCalendarEvent(eventId);
    if (!event) {
        return [];
    }

    // Non-recurring events can't have orphaned deviations
    if (event.recurrence === "none" || !event.recurrence) {
        return [];
    }

    // Get all deviations for this event
    const allDeviations = await getEventDeviations(eventId);

    // Import wouldOccurOn to check pattern matching
    const { wouldOccurOn } = await import("@/lib/calendar-utils");

    // Filter to only anchored deviations that are orphaned
    const orphaned = allDeviations.filter(deviation => {
        // Only check anchored deviations (those with originalDate)
        if (!deviation.originalDate) {
            return false;
        }

        // Check if this date would occur on the current pattern
        return !wouldOccurOn(event, deviation.originalDate);
    });

    return orphaned;
}

/**
 * Delete a specific deviation by ID
 */
export async function deleteDeviation(
    deviationId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        await db
            .delete(calendarDeviations)
            .where(eq(calendarDeviations.id, deviationId));

        return { success: true };
    } catch (error) {
        console.error("Failed to delete deviation:", error);
        return { success: false, error: "Failed to delete deviation" };
    }
}

/**
 * Delete all orphaned deviations for an event
 */
export async function deleteAllOrphanedDeviations(
    eventId: string
): Promise<{ success: boolean; count: number; error?: string }> {
    try {
        const orphaned = await getOrphanedDeviations(eventId);

        if (orphaned.length === 0) {
            return { success: true, count: 0 };
        }

        // Delete each orphaned deviation
        for (const deviation of orphaned) {
            await db
                .delete(calendarDeviations)
                .where(eq(calendarDeviations.id, deviation.id));
        }

        return { success: true, count: orphaned.length };
    } catch (error) {
        console.error("Failed to delete orphaned deviations:", error);
        return { success: false, count: 0, error: "Failed to delete orphaned deviations" };
    }
}
