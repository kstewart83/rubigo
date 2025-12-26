/**
 * Teams REST API - Individual Team
 * 
 * GET /api/teams/[id] - Get team by ID
 * PUT /api/teams/[id] - Update team
 * DELETE /api/teams/[id] - Delete team
 * 
 * Requires Authorization: Bearer <token> header
 */

import { NextRequest, NextResponse } from "next/server";
import { validateApiToken } from "@/lib/initialization";
import { getTeam, updateTeam, deleteTeam } from "@/lib/teams-actions";

interface RouteContext {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/teams/[id]
 */
export async function GET(request: NextRequest, context: RouteContext) {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") ?? null;

    const auth = await validateApiToken(token);
    if (!auth.valid) {
        return NextResponse.json(
            { success: false, error: auth.error },
            { status: 401 }
        );
    }

    const { id } = await context.params;
    const result = await getTeam(id);

    if (!result.success) {
        return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json(result);
}

/**
 * PUT /api/teams/[id]
 */
export async function PUT(request: NextRequest, context: RouteContext) {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") ?? null;

    const auth = await validateApiToken(token);
    if (!auth.valid) {
        return NextResponse.json(
            { success: false, error: auth.error },
            { status: 401 }
        );
    }

    const { id } = await context.params;

    let updates: { name?: string; description?: string; aco?: string };
    try {
        updates = await request.json();
    } catch {
        return NextResponse.json(
            { success: false, error: "Invalid JSON" },
            { status: 400 }
        );
    }

    const result = await updateTeam(id, updates);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
}

/**
 * DELETE /api/teams/[id]
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") ?? null;

    const auth = await validateApiToken(token);
    if (!auth.valid) {
        return NextResponse.json(
            { success: false, error: auth.error },
            { status: 401 }
        );
    }

    const { id } = await context.params;
    const result = await deleteTeam(id);

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
