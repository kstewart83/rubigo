/**
 * Screen Share Publish API
 * 
 * Broadcaster SDP exchange - proxies to Go SFU
 */

import { NextRequest, NextResponse } from "next/server";

const SFU_URL = process.env.SFU_URL || "http://localhost:37003";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * POST /api/screen-share/rooms/[id]/publish
 * Broadcaster sends SDP offer, receives answer
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    const { id: roomId } = await params;

    let body: { sdp: string; type: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { success: false, error: "Invalid JSON" },
            { status: 400 }
        );
    }

    if (!body.sdp || !body.type) {
        return NextResponse.json(
            { success: false, error: "sdp and type are required" },
            { status: 400 }
        );
    }

    try {
        // Proxy SDP offer to Go SFU
        const sfuResponse = await fetch(`${SFU_URL}/internal/room/${roomId}/publish`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!sfuResponse.ok) {
            const error = await sfuResponse.text();
            return NextResponse.json(
                { success: false, error: `SFU error: ${error}` },
                { status: sfuResponse.status }
            );
        }

        const answer = await sfuResponse.json();
        return NextResponse.json({ success: true, ...answer });
    } catch (error) {
        console.error("Publish error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to connect to SFU" },
            { status: 503 }
        );
    }
}
