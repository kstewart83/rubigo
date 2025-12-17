/**
 * Kpis REST API - Dynamic Route
 */

import { NextRequest, NextResponse } from "next/server";
import { validateApiToken } from "@/lib/initialization";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

interface RouteParams {
    params: Promise<{ id: string }>;
}

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
        operationId: `${action}Kpi`,
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

export async function GET(request: NextRequest, { params }: RouteParams) {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") ?? null;

    const auth = await validateApiToken(token);
    if (!auth.valid) {
        return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    const { id } = await params;

    try {
        const results = await db.select().from(schema.kpis).where(eq(schema.kpis.id, id)).limit(1);
        if (results.length === 0) {
            return NextResponse.json({ success: false, error: "Kpi not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: results[0] });
    } catch (error) {
        console.error("GET kpi error:", error);
        return NextResponse.json({ success: false, error: "Failed to get kpi" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") ?? null;

    const auth = await validateApiToken(token);
    if (!auth.valid) {
        return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    const { id } = await params;

    const existing = await db.select().from(schema.kpis).where(eq(schema.kpis.id, id)).limit(1);
    if (existing.length === 0) {
        return NextResponse.json({ success: false, error: "Kpi not found" }, { status: 404 });
    }

    let updates: Record<string, unknown>;
    try {
        updates = await request.json();
    } catch {
        return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
    }

    try {
        await db.update(schema.kpis).set(updates).where(eq(schema.kpis.id, id));
        await logAction(auth.actorId!, auth.actorName!, id, "update", updates);
        revalidatePath("/projects");
        return NextResponse.json({ success: true, id });
    } catch (error) {
        console.error("PUT kpi error:", error);
        return NextResponse.json({ success: false, error: "Failed to update kpi" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") ?? null;

    const auth = await validateApiToken(token);
    if (!auth.valid) {
        return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    const { id } = await params;

    const existing = await db.select().from(schema.kpis).where(eq(schema.kpis.id, id)).limit(1);
    if (existing.length === 0) {
        return NextResponse.json({ success: false, error: "Kpi not found" }, { status: 404 });
    }

    try {
        await db.delete(schema.kpis).where(eq(schema.kpis.id, id));
        await logAction(auth.actorId!, auth.actorName!, id, "delete", { id });
        revalidatePath("/projects");
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE kpi error:", error);
        return NextResponse.json({ success: false, error: "Failed to delete kpi" }, { status: 500 });
    }
}
