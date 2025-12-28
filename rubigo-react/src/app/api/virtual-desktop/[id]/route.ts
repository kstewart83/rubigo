/**
 * Virtual Desktop Instance API Routes
 *
 * GET /api/virtual-desktop/[id] - Get desktop details
 * PATCH /api/virtual-desktop/[id] - Update desktop (start/stop)
 * DELETE /api/virtual-desktop/[id] - Destroy desktop
 */

import { NextRequest, NextResponse } from "next/server";
import {
    getDesktop,
    startDesktop,
    stopDesktop,
    destroyDesktop,
} from "@/lib/virtual-desktop-actions";
import { validateApiToken } from "@/lib/initialization";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/virtual-desktop/[id]
 * Get desktop details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const authHeader = request.headers.get("Authorization");
        const token = authHeader?.replace("Bearer ", "") ?? null;
        const auth = await validateApiToken(token);

        if (!auth.valid || !auth.actorId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const desktop = await getDesktop(auth.actorId, id);

        if (!desktop) {
            return NextResponse.json({ error: "Desktop not found" }, { status: 404 });
        }

        return NextResponse.json(desktop);
    } catch (error) {
        console.error("Error getting desktop:", error);
        return NextResponse.json(
            { error: "Failed to get desktop" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/virtual-desktop/[id]
 * Update desktop state (start/stop)
 * Body: { action: "start" | "stop" | "restart" }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const authHeader = request.headers.get("Authorization");
        const token = authHeader?.replace("Bearer ", "") ?? null;
        const auth = await validateApiToken(token);

        if (!auth.valid || !auth.actorId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { action } = body;

        if (!action || !["start", "stop", "restart"].includes(action)) {
            return NextResponse.json(
                { error: "Invalid action. Must be start, stop, or restart" },
                { status: 400 }
            );
        }

        let desktop;
        switch (action) {
            case "start":
                desktop = await startDesktop(auth.actorId, id);
                break;
            case "stop":
                desktop = await stopDesktop(auth.actorId, id);
                break;
            case "restart":
                await stopDesktop(auth.actorId, id);
                desktop = await startDesktop(auth.actorId, id);
                break;
        }

        return NextResponse.json(desktop);
    } catch (error) {
        console.error("Error updating desktop:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to update desktop" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/virtual-desktop/[id]
 * Permanently destroy desktop
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const authHeader = request.headers.get("Authorization");
        const token = authHeader?.replace("Bearer ", "") ?? null;
        const auth = await validateApiToken(token);

        if (!auth.valid || !auth.actorId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        await destroyDesktop(auth.actorId, id);

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Error destroying desktop:", error);
        return NextResponse.json(
            { error: "Failed to destroy desktop" },
            { status: 500 }
        );
    }
}
