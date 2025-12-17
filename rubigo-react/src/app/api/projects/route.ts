/**
 * Projects REST API
 * 
 * GET /api/projects - List all projects
 * POST /api/projects - Create a new project
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

interface ProjectInput {
    id?: string;
    name: string;
    description?: string;
    solution_id?: string;
    status?: "planning" | "active" | "on_hold" | "complete" | "cancelled";
    start_date?: string;
    end_date?: string;
}

/**
 * GET /api/projects
 * Returns all projects
 */
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
        const projects = await db.select().from(schema.projects);
        return NextResponse.json({ success: true, data: projects });
    } catch (error) {
        console.error("GET projects error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to list projects" },
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

    let input: ProjectInput;
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

        await db.insert(schema.projects).values({
            id,
            name: input.name.trim(),
            description: input.description?.trim() || null,
            solutionId: input.solution_id || null,
            status: input.status || "planning",
            startDate: input.start_date || null,
            endDate: input.end_date || null,
        });

        await logAction(auth.actorId!, auth.actorName!, id, "create", {
            name: input.name,
            status: input.status || "planning",
        });

        revalidatePath("/projects");
        return NextResponse.json({ success: true, id }, { status: 201 });
    } catch (error) {
        console.error("Create project error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create project" },
            { status: 500 }
        );
    }
}
