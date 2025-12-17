/**
 * Projects REST API - Dynamic Route
 * 
 * GET /api/projects/[id] - Get single project by ID
 * PUT /api/projects/[id] - Update project
 * DELETE /api/projects/[id] - Delete project
 * 
 * Requires Authorization: Bearer <token> header
 */

import { NextRequest, NextResponse } from "next/server";
import { validateApiToken } from "@/lib/initialization";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

interface RouteParams {
    params: Promise<{ id: string }>;
}

function generateId(): string {
    return crypto.randomUUID().split("-")[0];
}

async function logAction(
    actorId: string,
    actorName: string,
    entityId: string,
    action: "create" | "update" | "delete",
    changes: Record<string, unknown>
) {
    await db.insert(schema.actionLogs).values({
        id: generateId(),
        timestamp: new Date().toISOString(),
        operationId: `${action}Project`,
        entityType: "project",
        entityId,
        action,
        actorId,
        actorName,
        requestId: null,
        changes: JSON.stringify(changes),
        metadata: null,
        source: "api",
    });
}

/**
 * GET /api/projects/[id]
 * Returns a single project by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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
            .from(schema.projects)
            .where(eq(schema.projects.id, id))
            .limit(1);

        if (results.length === 0) {
            return NextResponse.json(
                { success: false, error: "Project not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: results[0] });
    } catch (error) {
        console.error("GET project error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to get project" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/projects/[id]
 * Updates a project
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    // Check if project exists
    const existing = await db
        .select()
        .from(schema.projects)
        .where(eq(schema.projects.id, id))
        .limit(1);

    if (existing.length === 0) {
        return NextResponse.json(
            { success: false, error: "Project not found" },
            { status: 404 }
        );
    }

    let updates: Record<string, unknown>;
    try {
        updates = await request.json();
    } catch {
        return NextResponse.json(
            { success: false, error: "Invalid JSON" },
            { status: 400 }
        );
    }

    try {
        // Map snake_case to camelCase for database
        const dbUpdates: Record<string, unknown> = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.solution_id !== undefined) dbUpdates.solutionId = updates.solution_id;
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.start_date !== undefined) dbUpdates.startDate = updates.start_date;
        if (updates.end_date !== undefined) dbUpdates.endDate = updates.end_date;

        await db
            .update(schema.projects)
            .set(dbUpdates)
            .where(eq(schema.projects.id, id));

        await logAction(auth.actorId!, auth.actorName!, id, "update", updates);
        revalidatePath("/projects");

        return NextResponse.json({ success: true, id });
    } catch (error) {
        console.error("PUT project error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update project" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/projects/[id]
 * Deletes a project
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Check if project exists
    const existing = await db
        .select()
        .from(schema.projects)
        .where(eq(schema.projects.id, id))
        .limit(1);

    if (existing.length === 0) {
        return NextResponse.json(
            { success: false, error: "Project not found" },
            { status: 404 }
        );
    }

    try {
        await db.delete(schema.projects).where(eq(schema.projects.id, id));
        await logAction(auth.actorId!, auth.actorName!, id, "delete", { id });
        revalidatePath("/projects");

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE project error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to delete project" },
            { status: 500 }
        );
    }
}
