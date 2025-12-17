/**
 * Solutions REST API
 * 
 * GET /api/solutions - List all solutions
 * POST /api/solutions - Create a new solution
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
        operationId: `${action}Solution`,
        entityType: "solution",
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

interface SolutionInput {
    id?: string;
    name: string;
    description?: string;
    status?: "pipeline" | "catalog" | "retired";
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
        const solutions = await db.select().from(schema.solutions);
        return NextResponse.json({ success: true, data: solutions });
    } catch (error) {
        console.error("GET solutions error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to list solutions" },
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
    let input: SolutionInput;
    try {
        input = await request.json();
    } catch {
        return NextResponse.json(
            { success: false, error: "Invalid JSON" },
            { status: 400 }
        );
    }

    // Validation
    if (!input.name?.trim()) {
        return NextResponse.json(
            { success: false, error: "Name is required" },
            { status: 400 }
        );
    }

    try {
        const id = input.id || generateId();

        await db.insert(schema.solutions).values({
            id,
            name: input.name.trim(),
            description: input.description?.trim() || null,
            status: input.status || "pipeline",
        });

        await logAction(auth.actorId!, auth.actorName!, id, "create", {
            name: input.name,
            status: input.status || "pipeline",
        });

        revalidatePath("/projects");
        return NextResponse.json({ success: true, id }, { status: 201 });
    } catch (error) {
        console.error("Create solution error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create solution" },
            { status: 500 }
        );
    }
}
