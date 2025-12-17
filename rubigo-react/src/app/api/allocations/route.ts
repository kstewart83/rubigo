/**
 * Allocations REST API
 * 
 * GET /api/allocations - List all allocations
 * POST /api/allocations - Create a new allocation
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
        operationId: `${action}Allocation`,
        entityType: "allocation",
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

interface AllocationInput {
    id?: string;
    assignment_id: string;
    person_id: string;
    quantity_contributed: number;
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
        const items = await db.select().from(schema.allocations);
        return NextResponse.json({ success: true, data: items });
    } catch (error) {
        console.error("GET allocations error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to list allocations" },
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

    let input: AllocationInput;
    try {
        input = await request.json();
    } catch {
        return NextResponse.json(
            { success: false, error: "Invalid JSON" },
            { status: 400 }
        );
    }

    if (!input.assignment_id) {
        return NextResponse.json(
            { success: false, error: "assignment_id is required" },
            { status: 400 }
        );
    }
    if (!input.person_id) {
        return NextResponse.json(
            { success: false, error: "person_id is required" },
            { status: 400 }
        );
    }
    if (input.quantity_contributed === undefined) {
        return NextResponse.json(
            { success: false, error: "quantity_contributed is required" },
            { status: 400 }
        );
    }

    try {
        const id = input.id || generateId();

        await db.insert(schema.allocations).values({
            id,
            assignmentId: input.assignment_id,
            personId: input.person_id,
            quantityContributed: input.quantity_contributed,
            startDate: input.start_date || null,
            endDate: input.end_date || null,
        });

        await logAction(auth.actorId!, auth.actorName!, id, "create", {
            assignment_id: input.assignment_id,
            person_id: input.person_id,
            quantity_contributed: input.quantity_contributed,
        });

        revalidatePath("/projects");
        return NextResponse.json({ success: true, id }, { status: 201 });
    } catch (error) {
        console.error("Create allocation error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create allocation" },
            { status: 500 }
        );
    }
}
