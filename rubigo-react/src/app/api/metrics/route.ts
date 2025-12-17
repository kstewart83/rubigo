/**
 * Metrics REST API
 * 
 * GET /api/metrics - List all metrics
 * POST /api/metrics - Create a new metric
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
        operationId: `${action}Metric`,
        entityType: "metric",
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

interface MetricInput {
    id?: string;
    name: string;
    description?: string;
    unit: string;
    current_value?: number;
    source?: string;
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
        const items = await db.select().from(schema.metrics);
        return NextResponse.json({ success: true, data: items });
    } catch (error) {
        console.error("GET metrics error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to list metrics" },
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

    let input: MetricInput;
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
    if (!input.unit?.trim()) {
        return NextResponse.json(
            { success: false, error: "Unit is required" },
            { status: 400 }
        );
    }

    try {
        const id = input.id || generateId();

        await db.insert(schema.metrics).values({
            id,
            name: input.name.trim(),
            description: input.description?.trim() || null,
            unit: input.unit.trim(),
            currentValue: input.current_value ?? null,
            source: input.source || null,
        });

        await logAction(auth.actorId!, auth.actorName!, id, "create", {
            name: input.name,
            unit: input.unit,
        });

        revalidatePath("/projects");
        return NextResponse.json({ success: true, id }, { status: 201 });
    } catch (error) {
        console.error("Create metric error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create metric" },
            { status: 500 }
        );
    }
}
