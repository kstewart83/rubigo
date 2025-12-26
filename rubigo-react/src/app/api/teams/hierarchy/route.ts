/**
 * Team Hierarchy REST API
 * 
 * POST /api/teams/hierarchy - Add child team to parent
 * DELETE /api/teams/hierarchy - Remove child from parent (uses query params)
 * 
 * Requires Authorization: Bearer <token> header
 */

import { NextRequest, NextResponse } from "next/server";
import { validateApiToken } from "@/lib/initialization";
import { addChildTeam, removeChildTeam } from "@/lib/teams-actions";

interface HierarchyInput {
    parentTeamId: string;
    childTeamId: string;
}

/**
 * POST /api/teams/hierarchy
 */
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

    let input: HierarchyInput;
    try {
        input = await request.json();
    } catch {
        return NextResponse.json(
            { success: false, error: "Invalid JSON" },
            { status: 400 }
        );
    }

    if (!input.parentTeamId || !input.childTeamId) {
        return NextResponse.json(
            { success: false, error: "parentTeamId and childTeamId are required" },
            { status: 400 }
        );
    }

    const result = await addChildTeam(input.parentTeamId, input.childTeamId);

    if (result.success) {
        return NextResponse.json({ success: true }, { status: 201 });
    } else {
        if (result.error?.includes("already")) {
            return NextResponse.json({ success: true, existed: true });
        }
        return NextResponse.json(result, { status: 400 });
    }
}

/**
 * DELETE /api/teams/hierarchy
 */
export async function DELETE(request: NextRequest) {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") ?? null;

    const auth = await validateApiToken(token);
    if (!auth.valid) {
        return NextResponse.json(
            { success: false, error: auth.error },
            { status: 401 }
        );
    }

    const { searchParams } = new URL(request.url);
    const parentTeamId = searchParams.get("parentTeamId");
    const childTeamId = searchParams.get("childTeamId");

    if (!parentTeamId || !childTeamId) {
        return NextResponse.json(
            { success: false, error: "parentTeamId and childTeamId query params required" },
            { status: 400 }
        );
    }

    const result = await removeChildTeam(parentTeamId, childTeamId);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
