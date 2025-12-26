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
    personnel,
    type CalendarDeviation,
} from "@/db/schema";
import { eq, and, gte, lte, or } from "drizzle-orm";
import type { CalendarEventWithParticipants } from "@/lib/calendar-utils";
import { type SessionContext, filterBySession } from "@/lib/access-control/abac-filter";
import { getOrCreateAcoId } from "@/lib/access-control/aco-registry";
import { parseAco } from "@/lib/access-control/abac-filter";

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

        // Parse ACO from input and get/create normalized acoId
        const acoJson = input.aco ?? '{"sensitivity":"low"}';
        const parsedAco = parseAco(acoJson);
        const acoId = await getOrCreateAcoId({
            sensitivity: parsedAco.sensitivity,
            tenants: parsedAco.tenants,
        });

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
            // Normalized ACO (new)
            acoId,
            // Legacy ABAC fields (for backward compatibility)
            aco: acoJson,
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
                        role: "required",
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
                personnelId: p.personnelId ?? "",
                role: p.role ?? "required",
            })),
        });
    }

    // Apply session-level ABAC filtering if context provided
    if (sessionContext) {
        const SENSITIVITY_ORDER = ["public", "low", "moderate", "high"];
        const sessionLevelIndex = SENSITIVITY_ORDER.indexOf(sessionContext.sessionLevel);

        // Get tenant-specific session levels (defaults to base session level if not provided)
        const activeTenantLevels = sessionContext.activeTenantLevels ?? {};

        // Helper to check if an ACO is accessible based on tenant-specific levels
        const isAcoAccessible = (parsedAco: ReturnType<typeof parseAco>): boolean => {
            // For untenanted data, check base level only
            if (parsedAco.tenantNames.length === 0) {
                const objectLevelIndex = SENSITIVITY_ORDER.indexOf(parsedAco.sensitivity);
                return sessionLevelIndex >= objectLevelIndex;
            }

            // For tenanted data, check each tenant's level
            for (const tenantName of parsedAco.tenantNames) {
                // User must have this tenant in their active session
                if (!sessionContext.activeTenants.includes(tenantName)) {
                    return false;
                }

                // Get the required level for this tenant from the ACO
                const requiredLevel = parsedAco.tenantLevels[tenantName] ?? parsedAco.sensitivity;
                const requiredLevelIndex = SENSITIVITY_ORDER.indexOf(requiredLevel);

                // Get user's session level for this tenant
                const userTenantLevel = activeTenantLevels[tenantName] ?? sessionContext.sessionLevel;
                const userTenantLevelIndex = SENSITIVITY_ORDER.indexOf(userTenantLevel);

                // User's tenant level must be >= required level
                if (userTenantLevelIndex < requiredLevelIndex) {
                    return false;
                }
            }
            return true;
        };

        // Helper to check if description is accessible
        const isDescriptionAccessible = (event: typeof result[0]): boolean => {
            const descAco = parseAco(event.descriptionAco || event.aco);
            return isAcoAccessible(descAco);
        };

        // Filter events and redact inaccessible descriptions
        return result
            .filter(event => {
                // Filter by base event ACO
                const parsedAco = parseAco(event.aco);
                return isAcoAccessible(parsedAco);
            })
            .map(event => {
                // Redact description if not accessible (server-side security)
                if (event.description && !isDescriptionAccessible(event)) {
                    return {
                        ...event,
                        description: null, // Redact content
                        descriptionAco: null, // Hide classification level
                        _descriptionRedacted: true, // Marker for UI
                    };
                }
                return event;
            });
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
            personnelId: p.personnelId ?? "",
            role: p.role ?? "required",
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

        // If ACO is being updated, also update the normalized acoId
        let acoId: number | undefined;
        if (input.aco !== undefined) {
            const parsedAco = parseAco(input.aco);
            acoId = await getOrCreateAcoId({
                sensitivity: parsedAco.sensitivity,
                tenants: parsedAco.tenants,
            });
        }

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
                ...(acoId !== undefined && { acoId }), // Normalized ACO
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

// ============================================================================
// Participant Management
// ============================================================================

import { teams } from "@/db/schema";
import type { ParticipantRole } from "@/lib/participant-resolver";

/**
 * Add a participant (individual or team) to an event
 */
export async function addEventParticipant(input: {
    eventId: string;
    personnelId?: string;
    teamId?: string;
    role?: ParticipantRole;
    addedBy?: string;
}): Promise<{ success: boolean; id?: string; error?: string; existed?: boolean }> {
    try {
        // Validate: must have exactly one of personnelId or teamId
        if ((!input.personnelId && !input.teamId) || (input.personnelId && input.teamId)) {
            return { success: false, error: "Must specify exactly one of personnelId or teamId" };
        }

        // Check for existing participant (dedup)
        const conditions = [eq(calendarParticipants.eventId, input.eventId)];
        if (input.personnelId) {
            conditions.push(eq(calendarParticipants.personnelId, input.personnelId));
        } else {
            conditions.push(eq(calendarParticipants.teamId, input.teamId!));
        }
        const existing = await db.select({ id: calendarParticipants.id })
            .from(calendarParticipants)
            .where(and(...conditions))
            .get();

        if (existing) {
            return { success: true, id: existing.id, existed: true };
        }

        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        await db.insert(calendarParticipants).values({
            id,
            eventId: input.eventId,
            personnelId: input.personnelId ?? null,
            teamId: input.teamId ?? null,
            role: input.role ?? "required",
            addedAt: now,
            addedBy: input.addedBy ?? null,
        });

        return { success: true, id };
    } catch (error) {
        console.error("Failed to add participant:", error);
        return { success: false, error: "Failed to add participant" };
    }
}

/**
 * Remove a participant from an event
 */
export async function removeEventParticipant(
    eventId: string,
    participantId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        await db
            .delete(calendarParticipants)
            .where(
                and(
                    eq(calendarParticipants.eventId, eventId),
                    eq(calendarParticipants.id, participantId)
                )
            );

        return { success: true };
    } catch (error) {
        console.error("Failed to remove participant:", error);
        return { success: false, error: "Failed to remove participant" };
    }
}

/**
 * Update a participant's role
 */
export async function updateParticipantRole(
    participantId: string,
    role: ParticipantRole
): Promise<{ success: boolean; error?: string }> {
    try {
        await db
            .update(calendarParticipants)
            .set({ role })
            .where(eq(calendarParticipants.id, participantId));

        return { success: true };
    } catch (error) {
        console.error("Failed to update participant role:", error);
        return { success: false, error: "Failed to update role" };
    }
}

/**
 * Get raw participant records for an event (before resolution)
 */
export async function getEventParticipantsRaw(eventId: string): Promise<{
    success: boolean;
    data?: Array<{
        id: string;
        personnelId: string | null;
        teamId: string | null;
        role: string | null;
        addedAt: string | null;
        personnelName: string | null;
        teamName: string | null;
    }>;
    error?: string;
}> {
    try {
        const participants = await db
            .select({
                id: calendarParticipants.id,
                personnelId: calendarParticipants.personnelId,
                teamId: calendarParticipants.teamId,
                role: calendarParticipants.role,
                addedAt: calendarParticipants.addedAt,
                personnelName: personnel.name,
                teamName: teams.name,
            })
            .from(calendarParticipants)
            .leftJoin(personnel, eq(calendarParticipants.personnelId, personnel.id))
            .leftJoin(teams, eq(calendarParticipants.teamId, teams.id))
            .where(eq(calendarParticipants.eventId, eventId));

        return { success: true, data: participants };
    } catch (error) {
        console.error("Failed to get participants:", error);
        return { success: false, error: "Failed to get participants" };
    }
}

/**
 * Set all participants for an event (replaces existing)
 */
export async function setEventParticipants(
    eventId: string,
    participants: Array<{
        personnelId?: string;
        teamId?: string;
        role: ParticipantRole;
    }>,
    addedBy?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Delete existing participants
        await db
            .delete(calendarParticipants)
            .where(eq(calendarParticipants.eventId, eventId));

        // Add new participants
        const now = new Date().toISOString();
        for (const p of participants) {
            if (!p.personnelId && !p.teamId) continue;

            await db.insert(calendarParticipants).values({
                id: crypto.randomUUID(),
                eventId,
                personnelId: p.personnelId ?? null,
                teamId: p.teamId ?? null,
                role: p.role,
                addedAt: now,
                addedBy: addedBy ?? null,
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Failed to set participants:", error);
        return { success: false, error: "Failed to set participants" };
    }
}
