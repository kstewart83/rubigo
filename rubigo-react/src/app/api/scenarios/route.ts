/**
 * Scenarios REST API
 * 
 * POST /api/scenarios - Create a new scenario (Gherkin-like)
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
        operationId: `${action}Scenario`,
        entityType: "scenario",
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

interface ScenarioInput {
    id?: string;
    rule_id: string;
    name: string;
    narrative: string;
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

    let input: ScenarioInput;
    try {
        input = await request.json();
    } catch {
        return NextResponse.json(
            { success: false, error: "Invalid JSON" },
            { status: 400 }
        );
    }

    if (!input.rule_id) {
        return NextResponse.json(
            { success: false, error: "rule_id is required" },
            { status: 400 }
        );
    }
    if (!input.name?.trim() || !input.narrative?.trim()) {
        return NextResponse.json(
            { success: false, error: "name and narrative are required" },
            { status: 400 }
        );
    }

    try {
        const id = input.id || generateId();

        await db.insert(schema.scenarios).values({
            id,
            ruleId: input.rule_id,
            name: input.name.trim(),
            narrative: input.narrative.trim(),
            status: input.status || "draft",
        });

        await logAction(auth.actorId!, auth.actorName!, id, "create", {
            rule_id: input.rule_id,
            name: input.name,
        });

        revalidatePath("/projects");
        return NextResponse.json({ success: true, id }, { status: 201 });
    } catch (error) {
        console.error("Create scenario error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create scenario" },
            { status: 500 }
        );
    }
}
