/**
 * Agent Calendar Integration - Handle calendar observations
 * 
 * Provides functions for agents to interact with the calendar system.
 */

import type { AgentAction, ActionResult } from "./agent-types";

export interface CalendarEvent {
    eventId: string;
    title: string;
    description?: string;
    startTime: string; // ISO 8601
    endTime: string; // ISO 8601
    eventType: string;
    location?: string;
    virtualUrl?: string;
    organizerId: string;
    organizerName: string;
    participantIds: string[];
}

export interface AgentCalendarContext {
    agentId: string;
    agentName: string;
    currentTime: string; // ISO 8601
}

/**
 * Check for upcoming events within a time window
 */
export function getUpcomingEvents(
    events: CalendarEvent[],
    context: AgentCalendarContext,
    windowMinutes: number = 15
): CalendarEvent[] {
    const now = new Date(context.currentTime).getTime();
    const windowMs = windowMinutes * 60 * 1000;

    return events.filter(event => {
        const eventStart = new Date(event.startTime).getTime();
        const timeDiff = eventStart - now;

        // Event is within the window (upcoming or just started)
        return timeDiff > -5 * 60 * 1000 && timeDiff < windowMs;
    });
}

/**
 * Check if an event is currently active
 */
export function isEventActive(event: CalendarEvent, currentTime: string): boolean {
    const now = new Date(currentTime).getTime();
    const start = new Date(event.startTime).getTime();
    const end = new Date(event.endTime).getTime();

    return now >= start && now <= end;
}

/**
 * Determine if agent should join a meeting
 */
export function shouldJoinMeeting(event: CalendarEvent, context: AgentCalendarContext): boolean {
    // Check if agent is a participant
    if (!event.participantIds.includes(context.agentId)) {
        return false;
    }

    // Check if meeting is about to start or has started
    const now = new Date(context.currentTime).getTime();
    const start = new Date(event.startTime).getTime();
    const end = new Date(event.endTime).getTime();

    // Join if within 5 minutes before to end of meeting
    return now >= start - 5 * 60 * 1000 && now <= end;
}

/**
 * Generate meeting preparation thoughts
 */
export function generateMeetingPrep(event: CalendarEvent, context: AgentCalendarContext): string {
    const startTime = new Date(event.startTime);
    const now = new Date(context.currentTime);
    const minutesUntil = Math.round((startTime.getTime() - now.getTime()) / 60000);

    if (minutesUntil > 0) {
        return `I have "${event.title}" starting in ${minutesUntil} minutes. ` +
            `I should prepare by reviewing ${event.description || "the agenda"}.`;
    } else {
        return `"${event.title}" is starting now. I should join the meeting.`;
    }
}

/**
 * Create a join meeting action
 */
export function createJoinMeetingAction(event: CalendarEvent): AgentAction {
    return {
        type: "join_meeting",
        targetEntity: `meeting:${event.eventId}`,
        metadata: {
            title: event.title,
            startTime: event.startTime,
            location: event.location,
            virtualUrl: event.virtualUrl,
        },
    };
}

/**
 * Create a leave meeting action
 */
export function createLeaveMeetingAction(event: CalendarEvent): AgentAction {
    return {
        type: "leave_meeting",
        targetEntity: `meeting:${event.eventId}`,
        metadata: {
            title: event.title,
        },
    };
}

/**
 * Process calendar check and return appropriate actions
 */
export async function processCalendarCheck(
    events: CalendarEvent[],
    context: AgentCalendarContext
): Promise<ActionResult> {
    const startTime = Date.now();

    // Check for meetings to join
    for (const event of events) {
        if (shouldJoinMeeting(event, context)) {
            return {
                success: true,
                action: createJoinMeetingAction(event),
                thought: generateMeetingPrep(event, context),
                durationMs: Date.now() - startTime,
            };
        }
    }

    // Check for upcoming meetings that need preparation
    const upcoming = getUpcomingEvents(events, context, 15);
    if (upcoming.length > 0) {
        const nextEvent = upcoming[0];
        return {
            success: true,
            action: { type: "think" },
            thought: generateMeetingPrep(nextEvent, context),
            durationMs: Date.now() - startTime,
        };
    }

    // No immediate calendar actions
    return {
        success: true,
        action: { type: "wait" },
        thought: "No upcoming meetings in the next 15 minutes.",
        durationMs: Date.now() - startTime,
    };
}

/**
 * Create a calendar event observation from raw data
 */
export function createCalendarEvent(eventPayload: Record<string, unknown>): CalendarEvent {
    return {
        eventId: String(eventPayload.eventId || eventPayload.id || ""),
        title: String(eventPayload.title || "Untitled Event"),
        description: eventPayload.description ? String(eventPayload.description) : undefined,
        startTime: String(eventPayload.startTime || new Date().toISOString()),
        endTime: String(eventPayload.endTime || new Date().toISOString()),
        eventType: String(eventPayload.eventType || "meeting"),
        location: eventPayload.location ? String(eventPayload.location) : undefined,
        virtualUrl: eventPayload.virtualUrl ? String(eventPayload.virtualUrl) : undefined,
        organizerId: String(eventPayload.organizerId || ""),
        organizerName: String(eventPayload.organizerName || "Organizer"),
        participantIds: Array.isArray(eventPayload.participantIds)
            ? eventPayload.participantIds.map(String)
            : [],
    };
}
