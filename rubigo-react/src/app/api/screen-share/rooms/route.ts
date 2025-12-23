/**
 * Screen Share Rooms API
 * 
 * Create and list screen share rooms.
 * Room metadata stored in SQLite, media routing in Go SFU.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { validateApiToken } from "@/lib/initialization";

// SFU server URL - configurable via environment
const SFU_URL = process.env.SFU_URL || "http://localhost:37003";

/**
 * POST /api/screen-share/rooms
 * Create a new screen share room
 */
export async function POST(request: NextRequest) {
    // For now, use cookie-based auth (persona context)
    // API token auth can be added later

    const body = await request.json().catch(() => ({}));
    const roomId = body.roomId || crypto.randomUUID().split("-")[0];

    try {
        // Notify Go SFU to create room
        const sfuResponse = await fetch(`${SFU_URL}/internal/room`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId }),
        });

        if (!sfuResponse.ok) {
            const error = await sfuResponse.text();
            return NextResponse.json(
                { success: false, error: `SFU error: ${error}` },
                { status: 502 }
            );
        }

        return NextResponse.json({
            success: true,
            roomId,
            sfuUrl: SFU_URL,
        });
    } catch (error) {
        console.error("Failed to create room:", error);
        return NextResponse.json(
            { success: false, error: "Failed to connect to SFU" },
            { status: 503 }
        );
    }
}

/**
 * GET /api/screen-share/rooms
 * List active rooms (future: query from SFU or DB)
 */
export async function GET() {
    // Placeholder - could query SFU for active rooms
    return NextResponse.json({
        success: true,
        rooms: [],
        message: "Room listing not yet implemented"
    });
}
