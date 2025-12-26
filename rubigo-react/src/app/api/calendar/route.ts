/**
 * Calendar REST API
 * 
 * GET /api/calendar - List events for a date range
 * POST /api/calendar - Create a new event
 * 
 * Optional session headers for ABAC filtering:
 * - X-Session-Level: SensitivityLevel (public|low|moderate|high)
 * - X-Active-Tenants: JSON array of tenant strings
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
import type { SensitivityLevel } from "@/lib/access-control/types";

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

    // Extract optional session context from headers for ABAC filtering
    const sessionLevelHeader = request.headers.get("X-Session-Level");
    const activeTenants = (() => {
        try {
            const header = request.headers.get("X-Active-Tenants");
            return header ? JSON.parse(header) as string[] : [];
        } catch {
            return [];
        }
    })();

    // Build session context if headers provided
    const sessionContext = sessionLevelHeader
        ? {
            sessionLevel: sessionLevelHeader as SensitivityLevel,
            activeTenants,
        }
        : undefined;

    // Extract personnel ID for participation filtering
    const personnelId = request.headers.get("X-Personnel-Id") ?? undefined;

    try {
        const events = await getCalendarEvents(startDate, endDate, sessionContext, personnelId);

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
