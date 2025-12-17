/**
 * Personnel REST API - Dynamic Route
 * 
 * GET /api/personnel/[id] - Get single personnel by ID
 * PUT /api/personnel/[id] - Update personnel
 * DELETE /api/personnel/[id] - Delete personnel
 * 
 * Requires Authorization: Bearer <token> header
 */

import { NextRequest, NextResponse } from "next/server";
import { validateApiToken } from "@/lib/initialization";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { updatePersonnel, deletePersonnel } from "@/lib/personnel-actions";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/personnel/[id]
 * Returns a single personnel record by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;

    try {
        const results = await db
            .select()
            .from(schema.personnel)
            .where(eq(schema.personnel.id, id))
            .limit(1);

        if (results.length === 0) {
            return NextResponse.json(
                { success: false, error: "Personnel not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: results[0] });
    } catch (error) {
        console.error("GET personnel error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to get personnel" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/personnel/[id]
 * Updates a personnel record
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;

    // Parse request body
    let updates: Record<string, unknown>;
    try {
        updates = await request.json();
    } catch {
        return NextResponse.json(
            { success: false, error: "Invalid JSON" },
            { status: 400 }
        );
    }

    // Update via server action
    const result = await updatePersonnel(
        id,
        updates,
        auth.actorId!,
        auth.actorName!,
        "api"
    );

    if (result.success) {
        return NextResponse.json(result);
    } else {
        const status = result.error === "Personnel not found" ? 404 : 400;
        return NextResponse.json(result, { status });
    }
}

/**
 * DELETE /api/personnel/[id]
 * Deletes a personnel record
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;

    // Delete via server action
    const result = await deletePersonnel(
        id,
        auth.actorId!,
        auth.actorName!,
        "api"
    );

    if (result.success) {
        return NextResponse.json(result);
    } else {
        const status = result.error === "Personnel not found" ? 404 : 400;
        return NextResponse.json(result, { status });
    }
}
