/**
 * Calendar Utility Functions
 * 
 * Pure functions for calendar operations (not server actions)
 */

import type { CalendarDeviation } from "@/db/schema";

// Event type display info
export type EventType =
    | "meeting" | "standup" | "allHands" | "oneOnOne" | "training"
    | "interview" | "holiday" | "conference" | "review" | "planning"
    | "appointment" | "reminder" | "outOfOffice";

export const eventTypeInfo: Record<EventType, { label: string; color: string; textColor?: string }> = {
    meeting: { label: "Meeting", color: "#1a73e8" },           // Darker blue, ~4.7:1
    standup: { label: "Standup", color: "#0d7a47" },           // Darker green, ~5.2:1
    allHands: { label: "All Hands", color: "#5e35b1" },        // Deep purple, ~6.5:1
    oneOnOne: { label: "1:1", color: "#e65100" },              // Darker orange, ~4.6:1
    training: { label: "Training", color: "#0097a7" },         // Darker cyan, ~4.5:1
    interview: { label: "Interview", color: "#c2185b" },       // Darker pink, ~5.5:1
    holiday: { label: "Holiday", color: "#616161" },           // Darker grey, ~5.3:1
    conference: { label: "Conference", color: "#303f9f" },     // Darker indigo, ~7.5:1
    review: { label: "Review", color: "#5d4037" },             // Darker brown, ~7.5:1
    planning: { label: "Planning", color: "#455a64" },         // Darker blue-grey, ~6.3:1
    appointment: { label: "Appointment", color: "#689f38" },   // Darker green, ~4.5:1
    reminder: { label: "Reminder", color: "#f9a825", textColor: "#1a1a1a" }, // Darker yellow + dark text
    outOfOffice: { label: "Out of Office", color: "#757575" }, // Medium grey, ~4.6:1
};

export interface CalendarEventWithParticipants {
    id: string;
    title: string;
    description: string | null;
    startTime: string;
    endTime: string;
    allDay: boolean | null;
    eventType: string | null;
    recurrence: string | null;
    recurrenceInterval: number | null;
    recurrenceDays: string | null;
    recurrenceUntil: string | null;
    timezone: string | null;
    location: string | null;
    virtualUrl: string | null;
    organizerId: string | null;
    deleted: boolean | null;
    createdAt: string;
    updatedAt: string;
    // Security/ABAC fields
    acoId: number | null; // Normalized FK to aco_objects
    aco: string;
    descriptionAco: string | null;
    sco: string | null;
    // Server-side redaction marker
    _descriptionRedacted?: boolean;
    participants: Array<{
        personnelId: string;
        role: string;
    }>;
}

/**
 * Expand recurring events into individual instances for a date range
 * Uses occursOn helper for recurrence logic and applies deviation overrides
 * 
 * Handles two types of deviations:
 * - Anchored: Modifies/cancels a specific recurrence instance (originalDate set)
 * - Unanchored: Standalone event from a "moved" instance (newDate set)
 */
export function expandRecurringEvents(
    events: CalendarEventWithParticipants[],
    startDate: string,
    endDate: string,
    deviations: Map<string, CalendarDeviation[]>
): Array<CalendarEventWithParticipants & { instanceDate: string; isRecurring: boolean; hasDeviation: boolean; isUnanchored?: boolean }> {
    const result: Array<CalendarEventWithParticipants & { instanceDate: string; isRecurring: boolean; hasDeviation: boolean; isUnanchored?: boolean }> = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (const event of events) {
        const eventDeviations = deviations.get(event.id) || [];

        // Separate anchored and unanchored deviations
        const anchoredDeviations = eventDeviations.filter(d => d.originalDate != null);
        const unanchoredDeviations = eventDeviations.filter(d => d.newDate != null);

        // Build set of dates where unanchored exist (for collision detection)
        const unanchoredDates = new Set(
            unanchoredDeviations.map(d => d.newDate!).filter(Boolean)
        );

        if (event.recurrence === "none" || !event.recurrence) {
            // Non-recurring: add as-is (but check if not deleted)
            if (!event.deleted) {
                result.push({
                    ...event,
                    instanceDate: event.startTime.split("T")[0],
                    isRecurring: false,
                    hasDeviation: false,
                });
            }
        } else {
            // Recurring: iterate through date range and check each day
            const recurrenceEnd = event.recurrenceUntil ? new Date(event.recurrenceUntil) : end;
            const actualEnd = recurrenceEnd < end ? recurrenceEnd : end;
            const currentDate = new Date(start);

            while (currentDate <= actualEnd) {
                const dateStr = currentDate.toISOString().split("T")[0];

                // Collision detection: if unanchored exists on this date, skip natural occurrence
                if (unanchoredDates.has(dateStr)) {
                    currentDate.setDate(currentDate.getDate() + 1);
                    continue;
                }

                // Use occursOn logic inline to check if event occurs on this date
                if (shouldOccurOn(event, currentDate, anchoredDeviations)) {
                    // Find anchored deviation for this date to apply overrides
                    const deviation = anchoredDeviations.find(d => d.originalDate === dateStr);

                    result.push({
                        ...event,
                        // Apply deviation overrides if present
                        title: deviation?.overrideTitle ?? event.title,
                        startTime: deviation?.overrideStartTime ?? event.startTime,
                        endTime: deviation?.overrideEndTime ?? event.endTime,
                        location: deviation?.overrideLocation ?? event.location,
                        description: (deviation as { overrideDescription?: string })?.overrideDescription ?? event.description,
                        timezone: (deviation as { overrideTimezone?: string })?.overrideTimezone ?? event.timezone,
                        instanceDate: dateStr,
                        isRecurring: true,
                        hasDeviation: deviation !== undefined && !deviation.cancelled,
                    });
                }

                currentDate.setDate(currentDate.getDate() + 1);
            }

            // Add unanchored deviations as separate one-time events
            for (const unanchored of unanchoredDeviations) {
                const unanchoredDate = unanchored.newDate!;
                // Only include if within the requested date range
                if (unanchoredDate >= startDate && unanchoredDate <= endDate) {
                    result.push({
                        ...event,
                        title: unanchored.overrideTitle ?? event.title,
                        startTime: unanchored.overrideStartTime ?? event.startTime,
                        endTime: unanchored.overrideEndTime ?? event.endTime,
                        location: unanchored.overrideLocation ?? event.location,
                        description: (unanchored as { overrideDescription?: string })?.overrideDescription ?? event.description,
                        timezone: (unanchored as { overrideTimezone?: string })?.overrideTimezone ?? event.timezone,
                        instanceDate: unanchoredDate,
                        isRecurring: true, // Still part of the series
                        hasDeviation: true,
                        isUnanchored: true,
                    });
                }
            }
        }
    }

    return result;
}

/**
 * Check if event should occur on a specific date
 * Handles recurrence patterns, intervals, and cancellations
 */
function shouldOccurOn(
    event: CalendarEventWithParticipants,
    date: Date,
    deviations: CalendarDeviation[]
): boolean {
    // Check if entire event is deleted
    if (event.deleted) {
        return false;
    }

    const dateStr = date.toISOString().split("T")[0];

    // Check if this specific instance is cancelled
    const deviation = deviations.find(d => d.originalDate === dateStr);
    if (deviation?.cancelled) {
        return false;
    }

    const eventStart = new Date(event.startTime);
    const eventStartDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Must be on or after event start date (compare dates only, not time)
    if (checkDate < eventStartDate) {
        return false;
    }

    // Get recurrence interval (default to 1)
    const interval = event.recurrenceInterval ?? 1;
    const recurrenceDays: string[] = event.recurrenceDays
        ? JSON.parse(event.recurrenceDays)
        : [];

    switch (event.recurrence) {
        case "daily": {
            const daysDiff = Math.floor((date.getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24));
            return daysDiff >= 0 && daysDiff % interval === 0;
        }

        case "weekly": {
            const daysDiff = Math.floor((date.getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24));
            const weeksDiff = Math.floor(daysDiff / 7);
            const weekdayAbbr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];

            if (recurrenceDays.length === 0) {
                // Same weekday as original
                return date.getDay() === eventStart.getDay() && weeksDiff % interval === 0;
            } else {
                // Specific days
                return recurrenceDays.includes(weekdayAbbr) && weeksDiff % interval === 0;
            }
        }

        case "monthly": {
            if (date.getDate() !== eventStart.getDate()) {
                return false;
            }
            const monthsDiff =
                (date.getFullYear() - eventStart.getFullYear()) * 12 +
                (date.getMonth() - eventStart.getMonth());
            return monthsDiff >= 0 && monthsDiff % interval === 0;
        }

        case "yearly": {
            if (date.getMonth() !== eventStart.getMonth() ||
                date.getDate() !== eventStart.getDate()) {
                return false;
            }
            const yearsDiff = date.getFullYear() - eventStart.getFullYear();
            return yearsDiff >= 0 && yearsDiff % interval === 0;
        }

        default:
            return false;
    }
}

/**
 * Check if a date WOULD occur on the event's recurrence pattern
 * This ignores deviations - it only checks the pure recurrence pattern
 * Used for detecting orphaned deviations
 */
export function wouldOccurOn(
    event: CalendarEventWithParticipants,
    dateStr: string
): boolean {
    // Non-recurring events don't have pattern matching
    if (event.recurrence === "none" || !event.recurrence) {
        return false;
    }

    // Check if entire event is deleted
    if (event.deleted) {
        return false;
    }

    const date = new Date(dateStr + "T12:00:00"); // Noon to avoid timezone issues
    const eventStart = new Date(event.startTime);
    const eventStartDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Must be on or after event start date
    if (checkDate < eventStartDate) {
        return false;
    }

    // Check recurrence end date
    if (event.recurrenceUntil) {
        const recurrenceEnd = new Date(event.recurrenceUntil);
        if (checkDate > recurrenceEnd) {
            return false;
        }
    }

    // Get recurrence interval (default to 1)
    const interval = event.recurrenceInterval ?? 1;
    const recurrenceDays: string[] = event.recurrenceDays
        ? JSON.parse(event.recurrenceDays)
        : [];

    switch (event.recurrence) {
        case "daily": {
            const daysDiff = Math.floor((date.getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24));
            return daysDiff >= 0 && daysDiff % interval === 0;
        }

        case "weekly": {
            const daysDiff = Math.floor((date.getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24));
            const weeksDiff = Math.floor(daysDiff / 7);
            const weekdayAbbr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];

            if (recurrenceDays.length === 0) {
                // Same weekday as original
                return date.getDay() === eventStart.getDay() && weeksDiff % interval === 0;
            } else {
                // Specific days
                return recurrenceDays.includes(weekdayAbbr) && weeksDiff % interval === 0;
            }
        }

        case "monthly": {
            if (date.getDate() !== eventStart.getDate()) {
                return false;
            }
            const monthsDiff =
                (date.getFullYear() - eventStart.getFullYear()) * 12 +
                (date.getMonth() - eventStart.getMonth());
            return monthsDiff >= 0 && monthsDiff % interval === 0;
        }

        case "yearly": {
            if (date.getMonth() !== eventStart.getMonth() ||
                date.getDate() !== eventStart.getDate()) {
                return false;
            }
            const yearsDiff = date.getFullYear() - eventStart.getFullYear();
            return yearsDiff >= 0 && yearsDiff % interval === 0;
        }

        default:
            return false;
    }
}
