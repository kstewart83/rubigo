/**
 * Activities REST API
 * 
 * POST /api/activities - Create a new activity
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
        operationId: `${action}Activity`,
        entityType: "activity",
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

interface ActivityInput {
    id?: string;
    name: string;
    description?: string;
    parent_id?: string;
    initiative_id?: string;
    blocked_by?: string;  // JSON array as string
    status?: "backlog" | "ready" | "in_progress" | "blocked" | "complete";
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

    let input: ActivityInput;
    try {
        input = await request.json();
    } catch {
        return NextResponse.json(
            { success: false, error: "Invalid JSON" },
            { status: 400 }
        );
    }

    if (!input.name?.trim()) {
        return NextResponse.json(
            { success: false, error: "Name is required" },
            { status: 400 }
        );
    }

    try {
        const id = input.id || generateId();

        await db.insert(schema.activities).values({
            id,
            name: input.name.trim(),
            description: input.description?.trim() || null,
            parentId: input.parent_id || null,
            initiativeId: input.initiative_id || null,
            blockedBy: input.blocked_by || null,
            status: input.status || "backlog",
        });

        await logAction(auth.actorId!, auth.actorName!, id, "create", {
            name: input.name,
            initiative_id: input.initiative_id,
        });

        revalidatePath("/projects");
        return NextResponse.json({ success: true, id }, { status: 201 });
    } catch (error) {
        console.error("Create activity error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create activity" },
            { status: 500 }
        );
    }
}
