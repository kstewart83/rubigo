/**
 * Assignments REST API
 * 
 * POST /api/assignments - Create a new assignment
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
        operationId: `${action}Assignment`,
        entityType: "assignment",
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

interface AssignmentInput {
    id?: string;
    activity_id: string;
    role_id: string;
    quantity: number;
    unit?: string;
    raci_type?: "responsible" | "accountable" | "consulted" | "informed";
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

    let input: AssignmentInput;
    try {
        input = await request.json();
    } catch {
        return NextResponse.json(
            { success: false, error: "Invalid JSON" },
            { status: 400 }
        );
    }

    if (!input.activity_id) {
        return NextResponse.json(
            { success: false, error: "activity_id is required" },
            { status: 400 }
        );
    }
    if (!input.role_id) {
        return NextResponse.json(
            { success: false, error: "role_id is required" },
            { status: 400 }
        );
    }
    if (input.quantity === undefined) {
        return NextResponse.json(
            { success: false, error: "quantity is required" },
            { status: 400 }
        );
    }

    try {
        const id = input.id || generateId();

        await db.insert(schema.assignments).values({
            id,
            activityId: input.activity_id,
            roleId: input.role_id,
            quantity: input.quantity,
            unit: input.unit || "fte",
            raciType: input.raci_type || "responsible",
        });

        await logAction(auth.actorId!, auth.actorName!, id, "create", {
            activity_id: input.activity_id,
            role_id: input.role_id,
            quantity: input.quantity,
        });

        revalidatePath("/projects");
        return NextResponse.json({ success: true, id }, { status: 201 });
    } catch (error) {
        console.error("Create assignment error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create assignment" },
            { status: 500 }
        );
    }
}
