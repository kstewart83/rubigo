/**
 * Calendar REST API
 * 
 * GET /api/calendar - List events for a date range
 * POST /api/calendar - Create a new event
 */

import { NextRequest, NextResponse } from "next/server";
import { validateApiToken } from "@/lib/initialization";
import {
    createCalendarEvent,
    getCalendarEvents,
    getEventDeviations,
    type CalendarEventInput,
} from "@/lib/calendar-actions";
import { expandRecurringEvents } from "@/lib/calendar-utils";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
        return NextResponse.json(
            { success: false, error: "startDate and endDate query params required" },
            { status: 400 }
        );
    }

    try {
        const events = await getCalendarEvents(startDate, endDate);

        // Get deviations for all events
        const deviationsMap = new Map();
        for (const event of events) {
            if (event.recurrence !== "none") {
                const deviations = await getEventDeviations(event.id);
                deviationsMap.set(event.id, deviations);
            }
        }

        // Expand recurring events
        const expandedEvents = expandRecurringEvents(events, startDate, endDate, deviationsMap);

        return NextResponse.json({
            success: true,
            events: expandedEvents,
        });
    } catch (error) {
        console.error("Failed to fetch calendar events:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch events" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    // Validate API token
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") ?? null;

    const auth = await validateApiToken(token);
    if (!auth.valid) {
        return NextResponse.json(
            { success: false, error: auth.error },
            { status: 401 }
        );
    }

    // Parse request body
    let input: CalendarEventInput;
    try {
        input = await request.json();
    } catch {
        return NextResponse.json(
            { success: false, error: "Invalid JSON" },
            { status: 400 }
        );
    }

    // Validate required fields
    if (!input.title || !input.startTime || !input.endTime) {
        return NextResponse.json(
            { success: false, error: "title, startTime, and endTime are required" },
            { status: 400 }
        );
    }

    const result = await createCalendarEvent(input, auth.actorId!);

    if (result.success) {
        return NextResponse.json(result, { status: 201 });
    } else {
        return NextResponse.json(result, { status: 400 });
    }
}
