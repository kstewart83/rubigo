/**
 * Calendar Event Helpers
 * 
 * Rust-style helper functions for recurring event handling.
 * Mirrors the CalendarEvent methods from rubigo-leptos.
 */

import type { CalendarDeviation } from "@/db/schema";
import type { CalendarEventWithParticipants } from "./calendar-utils";

/**
 * Computed data for a specific instance (after applying deviations)
 * Mirrors Rust's InstanceData struct
 */
export interface InstanceData {
    date: Date;
    startTime: string;
    endTime: string;
    title: string;
    description: string | null;
    location: string | null;
    timezone: string;
    isAllDay: boolean;
    hasDeviation: boolean;
}

/**
 * Get weekday abbreviation (Sun, Mon, Tue, Wed, Thu, Fri, Sat)
 */
function getWeekdayAbbr(date: Date): string {
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
}

/**
 * Check if event occurs on a specific date (considering recurrence and cancellations)
 * Mirrors Rust's CalendarEvent::occurs_on()
 */
export function occursOn(
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
    const eventDate = eventStart.toISOString().split("T")[0];

    // Exact match (original occurrence)
    if (eventDate === dateStr) {
        return true;
    }

    // Must be after event start date
    if (date < eventStart) {
        return false;
    }

    // Check recurrence end
    if (event.recurrenceUntil) {
        const recurrenceEnd = new Date(event.recurrenceUntil);
        if (date > recurrenceEnd) {
            return false;
        }
    }

    // Get recurrence interval (default to 1)
    const interval = (event as { recurrenceInterval?: number }).recurrenceInterval ?? 1;

    switch (event.recurrence) {
        case "none":
        case null:
            return false;

        case "daily": {
            // Check interval
            const daysDiff = Math.floor((date.getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24));
            return daysDiff % interval === 0;
        }

        case "weekly": {
            const recurrenceDays: string[] = event.recurrenceDays
                ? JSON.parse(event.recurrenceDays)
                : [];

            // Calculate weeks difference for interval check
            const daysDiff = Math.floor((date.getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24));
            const weeksDiff = Math.floor(daysDiff / 7);

            if (recurrenceDays.length === 0) {
                // Same weekday as original, respecting interval
                return date.getDay() === eventStart.getDay() && weeksDiff % interval === 0;
            } else {
                // Specific days, respecting interval
                const weekdayAbbr = getWeekdayAbbr(date);
                return recurrenceDays.includes(weekdayAbbr) && weeksDiff % interval === 0;
            }
        }

        case "monthly": {
            // Same day of month, respecting interval
            if (date.getDate() !== eventStart.getDate()) {
                return false;
            }
            const monthsDiff =
                (date.getFullYear() - eventStart.getFullYear()) * 12 +
                (date.getMonth() - eventStart.getMonth());
            return monthsDiff >= 0 && monthsDiff % interval === 0;
        }

        case "yearly": {
            // Same month and day, respecting interval
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
 * Get computed instance data with all overrides applied
 * Mirrors Rust's CalendarEvent::get_instance_data()
 */
export function getInstanceData(
    event: CalendarEventWithParticipants,
    date: Date,
    deviations: CalendarDeviation[]
): InstanceData | null {
    if (!occursOn(event, date, deviations)) {
        return null;
    }

    const dateStr = date.toISOString().split("T")[0];
    const deviation = deviations.find(d => d.originalDate === dateStr);

    return {
        date,
        startTime: deviation?.overrideStartTime ?? event.startTime,
        endTime: deviation?.overrideEndTime ?? event.endTime,
        title: deviation?.overrideTitle ?? event.title,
        description: (deviation as { overrideDescription?: string })?.overrideDescription ?? event.description,
        location: deviation?.overrideLocation ?? event.location,
        timezone: (deviation as { overrideTimezone?: string })?.overrideTimezone ?? event.timezone ?? "America/New_York",
        isAllDay: (event as { allDay?: boolean }).allDay ?? false,
        hasDeviation: deviation !== undefined && !deviation.cancelled,
    };
}

/**
 * Check if this is a recurring event
 */
export function isRecurring(event: CalendarEventWithParticipants): boolean {
    return event.recurrence !== null && event.recurrence !== "none";
}
