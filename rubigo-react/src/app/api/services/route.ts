/**
 * Services REST API
 * 
 * GET /api/services - List all services
 * POST /api/services - Create a new service
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
        operationId: `${action}Service`,
        entityType: "service",
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

interface ServiceInput {
    id?: string;
    name: string;
    solution_id: string;
    service_level?: string;
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
        const items = await db.select().from(schema.services);
        return NextResponse.json({ success: true, data: items });
    } catch (error) {
        console.error("GET services error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to list services" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
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

    // Parse request body
    let input: ServiceInput;
    try {
        input = await request.json();
    } catch {
        return NextResponse.json(
            { success: false, error: "Invalid JSON" },
            { status: 400 }
        );
    }

    // Validation
    if (!input.solution_id) {
        return NextResponse.json(
            { success: false, error: "solution_id is required" },
            { status: 400 }
        );
    }

    try {
        const id = input.id || generateId();

        await db.insert(schema.services).values({
            id,
            name: input.name,
            solutionId: input.solution_id,
            serviceLevel: input.service_level || null,
        });

        await logAction(auth.actorId!, auth.actorName!, id, "create", {
            solution_id: input.solution_id,
            service_level: input.service_level,
        });

        revalidatePath("/projects");
        return NextResponse.json({ success: true, id }, { status: 201 });
    } catch (error) {
        console.error("Create service error:", error);
        const message = error instanceof Error ? error.message : "Failed to create service";
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}
