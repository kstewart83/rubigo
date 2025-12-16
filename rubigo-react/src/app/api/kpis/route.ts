/**
 * KPIs REST API
 * 
 * POST /api/kpis - Create a new KPI
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
        operationId: `${action}KPI`,
        entityType: "kpi",
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

interface KpiInput {
    id?: string;
    metric_id: string;
    objective_id?: string;
    target_value: number;
    direction: "increase" | "decrease" | "maintain";
    threshold_warning?: number;
    threshold_critical?: number;
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

    let input: KpiInput;
    try {
        input = await request.json();
    } catch {
        return NextResponse.json(
            { success: false, error: "Invalid JSON" },
            { status: 400 }
        );
    }

    if (!input.metric_id) {
        return NextResponse.json(
            { success: false, error: "metric_id is required" },
            { status: 400 }
        );
    }
    if (input.target_value === undefined) {
        return NextResponse.json(
            { success: false, error: "target_value is required" },
            { status: 400 }
        );
    }
    if (!input.direction) {
        return NextResponse.json(
            { success: false, error: "direction is required" },
            { status: 400 }
        );
    }

    try {
        const id = input.id || generateId();

        await db.insert(schema.kpis).values({
            id,
            metricId: input.metric_id,
            objectiveId: input.objective_id || null,
            targetValue: input.target_value,
            direction: input.direction,
            thresholdWarning: input.threshold_warning ?? null,
            thresholdCritical: input.threshold_critical ?? null,
        });

        await logAction(auth.actorId!, auth.actorName!, id, "create", {
            metric_id: input.metric_id,
            objective_id: input.objective_id,
            target_value: input.target_value,
        });

        revalidatePath("/projects");
        return NextResponse.json({ success: true, id }, { status: 201 });
    } catch (error) {
        console.error("Create KPI error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create KPI" },
            { status: 500 }
        );
    }
}
