/**
 * Rules REST API
 * 
 * POST /api/rules - Create a new rule (3R format)
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
        operationId: `${action}Rule`,
        entityType: "rule",
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

interface RuleInput {
    id?: string;
    feature_id: string;
    role: string;
    requirement: string;
    reason: string;
    status?: "draft" | "active" | "deprecated";
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

    let input: RuleInput;
    try {
        input = await request.json();
    } catch {
        return NextResponse.json(
            { success: false, error: "Invalid JSON" },
            { status: 400 }
        );
    }

    if (!input.feature_id) {
        return NextResponse.json(
            { success: false, error: "feature_id is required" },
            { status: 400 }
        );
    }
    if (!input.role?.trim() || !input.requirement?.trim() || !input.reason?.trim()) {
        return NextResponse.json(
            { success: false, error: "role, requirement, and reason are required" },
            { status: 400 }
        );
    }

    try {
        const id = input.id || generateId();

        await db.insert(schema.rules).values({
            id,
            featureId: input.feature_id,
            role: input.role.trim(),
            requirement: input.requirement.trim(),
            reason: input.reason.trim(),
            status: input.status || "draft",
        });

        await logAction(auth.actorId!, auth.actorName!, id, "create", {
            feature_id: input.feature_id,
            role: input.role,
        });

        revalidatePath("/projects");
        return NextResponse.json({ success: true, id }, { status: 201 });
    } catch (error) {
        console.error("Create rule error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create rule" },
            { status: 500 }
        );
    }
}
