/**
 * Cancel Calendar Event Instance
 * 
 * POST /api/calendar/[id]/cancel - Cancel a single instance of a recurring event
 */

import { NextRequest, NextResponse } from "next/server";
import { validateApiToken } from "@/lib/initialization";
import { cancelEventInstance } from "@/lib/calendar-actions";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

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
    let body: { date: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { success: false, error: "Invalid JSON" },
            { status: 400 }
        );
    }

    if (!body.date) {
        return NextResponse.json(
            { success: false, error: "date is required (YYYY-MM-DD)" },
            { status: 400 }
        );
    }

    const result = await cancelEventInstance(id, body.date);

    if (result.success) {
        return NextResponse.json(result);
    } else {
        return NextResponse.json(result, { status: 400 });
    }
}
