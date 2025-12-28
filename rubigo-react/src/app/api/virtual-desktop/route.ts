/**
 * Virtual Desktop API Routes
 *
 * GET /api/virtual-desktop - List user's desktops
 * POST /api/virtual-desktop - Create new desktop
 */

import { NextRequest, NextResponse } from "next/server";
import { listDesktops, createDesktop, listTemplates } from "@/lib/virtual-desktop-actions";
import { validateApiToken } from "@/lib/initialization";

/**
 * GET /api/virtual-desktop
 * List all desktops for the current user
 * Query params: ?templates=true to get templates instead
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Return templates if requested (no auth needed)
        if (searchParams.get("templates") === "true") {
            const templates = await listTemplates();
            return NextResponse.json(templates);
        }

        // Auth required for listing user desktops
        const authHeader = request.headers.get("Authorization");
        const token = authHeader?.replace("Bearer ", "") ?? null;
        const auth = await validateApiToken(token);

        if (!auth.valid || !auth.actorId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const desktops = await listDesktops(auth.actorId);
        return NextResponse.json(desktops);
    } catch (error) {
        console.error("Error listing desktops:", error);
        return NextResponse.json(
            { error: "Failed to list desktops" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/virtual-desktop
 * Create a new desktop
 * Body: { name: string, template: string }
 */
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("Authorization");
        const token = authHeader?.replace("Bearer ", "") ?? null;
        const auth = await validateApiToken(token);

        if (!auth.valid || !auth.actorId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, template } = body;

        if (!name || !template) {
            return NextResponse.json(
                { error: "Name and template are required" },
                { status: 400 }
            );
        }

        const desktop = await createDesktop(auth.actorId, name, template);
        return NextResponse.json(desktop, { status: 201 });
    } catch (error) {
        console.error("Error creating desktop:", error);
        return NextResponse.json(
            { error: "Failed to create desktop" },
            { status: 500 }
        );
    }
}
