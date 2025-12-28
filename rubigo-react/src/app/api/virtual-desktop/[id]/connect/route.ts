/**
 * Virtual Desktop Connection API Route
 *
 * POST /api/virtual-desktop/[id]/connect - Get Guacamole connection info
 */

import { NextRequest, NextResponse } from "next/server";
import { getDesktopConnection } from "@/lib/virtual-desktop-actions";
import { validateApiToken } from "@/lib/initialization";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * POST /api/virtual-desktop/[id]/connect
 * Get connection parameters for establishing a desktop session
 * Returns tunnel URL and authentication token
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const authHeader = request.headers.get("Authorization");
        const token = authHeader?.replace("Bearer ", "") ?? null;
        const auth = await validateApiToken(token);

        if (!auth.valid || !auth.actorId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const connection = await getDesktopConnection(auth.actorId, id);

        return NextResponse.json(connection);
    } catch (error) {
        console.error("Error getting connection:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to get connection" },
            { status: 500 }
        );
    }
}
