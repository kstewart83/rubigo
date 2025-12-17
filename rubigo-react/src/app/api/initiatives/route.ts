/**
 * Initiatives REST API
 * 
 * GET /api/initiatives - List all initiatives
 * POST /api/initiatives - Create a new initiative
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
        operationId: `${action}Initiative`,
        entityType: "initiative",
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

interface InitiativeInput {
    id?: string;
    name: string;
    description?: string;
    kpi_id?: string;
    status?: "planned" | "active" | "complete" | "cancelled";
    start_date?: string;
    end_date?: string;
}


export async function GET(request: NextRequest) {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") ?? null;

    const auth = await validateApiToken(token);
    if (!auth.valid) {
        return NextResponse.json(
            { success: false, error: auth.error },
            { status: 401 }
        );
    }

    try {
        const items = await db.select().from(schema.initiatives);
        return NextResponse.json({ success: true, data: items });
    } catch (error) {
        console.error("GET initiatives error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to list initiatives" },
            { status: 500 }
        );
    }
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

    let input: InitiativeInput;
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

        await db.insert(schema.initiatives).values({
            id,
            name: input.name.trim(),
            description: input.description?.trim() || null,
            kpiId: input.kpi_id || null,
            status: input.status || "planned",
            startDate: input.start_date || null,
            endDate: input.end_date || null,
        });

        await logAction(auth.actorId!, auth.actorName!, id, "create", {
            name: input.name,
            kpi_id: input.kpi_id,
        });

        revalidatePath("/projects");
        return NextResponse.json({ success: true, id }, { status: 201 });
    } catch (error) {
        console.error("Create initiative error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create initiative" },
            { status: 500 }
        );
    }
}
