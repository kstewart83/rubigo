import { NextResponse } from "next/server";
import { db } from "@/db";
import { calendarDeviations, calendarEvents } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * POST /api/calendar/deviations
 * Create a new calendar deviation for seeding purposes
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            eventId,
            originalDate,
            newDate,
            cancelled,
            overrideStartTime,
            overrideEndTime,
            overrideTitle,
            overrideDescription,
            overrideLocation,
            overrideTimezone
        } = body;

        if (!eventId) {
            return NextResponse.json({ success: false, error: "eventId is required" }, { status: 400 });
        }

        // Check if the event exists
        const event = await db.select({ id: calendarEvents.id }).from(calendarEvents).where(eq(calendarEvents.id, eventId));
        if (event.length === 0) {
            return NextResponse.json({ success: false, error: `Event ${eventId} not found` }, { status: 404 });
        }

        // Check for duplicate: same eventId + originalDate or same eventId + newDate
        if (originalDate) {
            const existing = await db.select().from(calendarDeviations)
                .where(and(
                    eq(calendarDeviations.eventId, eventId),
                    eq(calendarDeviations.originalDate, originalDate)
                ));
            if (existing.length > 0) {
                return NextResponse.json({ success: true, id: existing[0].id, existed: true });
            }
        }

        if (newDate) {
            const existing = await db.select().from(calendarDeviations)
                .where(and(
                    eq(calendarDeviations.eventId, eventId),
                    eq(calendarDeviations.newDate, newDate)
                ));
            if (existing.length > 0) {
                return NextResponse.json({ success: true, id: existing[0].id, existed: true });
            }
        }

        const id = crypto.randomUUID();
        await db.insert(calendarDeviations).values({
            id,
            eventId,
            originalDate: originalDate || null,
            newDate: newDate || null,
            cancelled: cancelled ?? false,
            overrideStartTime: overrideStartTime || null,
            overrideEndTime: overrideEndTime || null,
            overrideTitle: overrideTitle || null,
            overrideDescription: overrideDescription || null,
            overrideLocation: overrideLocation || null,
            overrideTimezone: overrideTimezone || null,
        });

        return NextResponse.json({ success: true, id });
    } catch (error) {
        console.error("Error creating calendar deviation:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
