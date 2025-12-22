/**
 * Screen Share Room Status API
 * 
 * Get room status from Go SFU
 */

import { NextRequest, NextResponse } from "next/server";

const SFU_URL = process.env.SFU_URL || "http://localhost:37003";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/screen-share/rooms/[id]/status
 * Get room status (has broadcaster, viewer count)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { id: roomId } = await params;

    try {
        const sfuResponse = await fetch(`${SFU_URL}/internal/room/${roomId}/status`, {
            method: "GET",
        });

        if (!sfuResponse.ok) {
            return NextResponse.json(
                { success: false, error: "Room not found" },
                { status: 404 }
            );
        }

        const status = await sfuResponse.json();
        return NextResponse.json({ success: true, ...status });
    } catch (error) {
        console.error("Status error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to connect to SFU" },
            { status: 503 }
        );
    }
}
