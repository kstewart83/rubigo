/**
 * Virtual Desktop Connection API Route
 *
 * POST /api/virtual-desktop/[id]/connect - Get Guacamole connection info
 * 
 * Auth: Accepts either Bearer token OR X-Persona-Id header
 */

import { NextRequest, NextResponse } from "next/server";
import { getDesktopConnection } from "@/lib/virtual-desktop-actions";
import { validateApiToken } from "@/lib/initialization";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * Helper to validate request auth
 */
async function validateRequest(request: NextRequest): Promise<{ valid: boolean; actorId?: string; error?: string }> {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") ?? null;

    if (token) {
        const auth = await validateApiToken(token);
        if (auth.valid && auth.actorId) {
            return { valid: true, actorId: auth.actorId };
        }
    }

    const personaId = request.headers.get("X-Persona-Id");
    if (personaId) {
        return { valid: true, actorId: personaId };
    }

    return { valid: false, error: "Unauthorized" };
}

/**
 * POST /api/virtual-desktop/[id]/connect
 * Get connection parameters for establishing a desktop session
 * Returns tunnel URL and authentication token
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = await validateRequest(request);
        if (!auth.valid || !auth.actorId) {
            return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 });
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
