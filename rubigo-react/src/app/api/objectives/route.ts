/**
 * Objectives REST API
 * 
 * POST /api/objectives - Create a new objective
 * 
 * Requires Authorization: Bearer <token> header
 */

import { NextRequest, NextResponse } from "next/server";
import { validateApiToken } from "@/lib/initialization";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { revalidatePath } from "next/cache";

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
        operationId: `${action}Objective`,
        entityType: "objective",
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

interface ObjectiveInput {
    id?: string;
    title: string;
    description?: string;
    project_id?: string;
    parent_id?: string;
    status?: "draft" | "active" | "achieved" | "deferred";
}

export async function POST(request: NextRequest) {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") ?? null;

    const auth = await validateApiToken(token);
    if (!auth.valid) {
        return NextResponse.json(
            { success: false, error: auth.error },
            { status: 401 }
        );
    }

    let input: ObjectiveInput;
    try {
        input = await request.json();
    } catch {
        return NextResponse.json(
            { success: false, error: "Invalid JSON" },
            { status: 400 }
        );
    }

    if (!input.title?.trim()) {
        return NextResponse.json(
            { success: false, error: "Title is required" },
            { status: 400 }
        );
    }

    try {
        const id = input.id || generateId();

        await db.insert(schema.objectives).values({
            id,
            title: input.title.trim(),
            description: input.description?.trim() || null,
            projectId: input.project_id || null,
            parentId: input.parent_id || null,
            status: input.status || "draft",
        });

        await logAction(auth.actorId!, auth.actorName!, id, "create", {
            title: input.title,
            project_id: input.project_id,
            parent_id: input.parent_id,
        });

        revalidatePath("/projects");
        return NextResponse.json({ success: true, id }, { status: 201 });
    } catch (error) {
        console.error("Create objective error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create objective" },
            { status: 500 }
        );
    }
}
