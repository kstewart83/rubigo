import { NextRequest, NextResponse } from "next/server";
import { addEventParticipant, getEventParticipantsRaw } from "@/lib/calendar-actions";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
        return NextResponse.json({ success: false, error: "eventId required" }, { status: 400 });
    }

    const result = await getEventParticipantsRaw(eventId);
    return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { eventId, personnelId, teamId, role } = body;

        if (!eventId) {
            return NextResponse.json({ success: false, error: "eventId required" }, { status: 400 });
        }

        if (!personnelId && !teamId) {
            return NextResponse.json({ success: false, error: "personnelId or teamId required" }, { status: 400 });
        }

        const result = await addEventParticipant({
            eventId,
            personnelId,
            teamId,
            role,
        });

        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }
}
