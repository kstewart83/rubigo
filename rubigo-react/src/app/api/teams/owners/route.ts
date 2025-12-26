/**
 * Team Owners REST API
 * 
 * POST /api/teams/owners - Add owner to team
 * DELETE /api/teams/owners - Remove owner (uses query params)
 * 
 * Requires Authorization: Bearer <token> header
 */

import { NextRequest, NextResponse } from "next/server";
import { validateApiToken } from "@/lib/initialization";
import { addTeamOwner, removeTeamOwner } from "@/lib/teams-actions";

interface OwnerInput {
    teamId: string;
    personnelId: string;
}

/**
 * POST /api/teams/owners
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

    let input: OwnerInput;
    try {
        input = await request.json();
    } catch {
        return NextResponse.json(
            { success: false, error: "Invalid JSON" },
            { status: 400 }
        );
    }

    if (!input.teamId || !input.personnelId) {
        return NextResponse.json(
            { success: false, error: "teamId and personnelId are required" },
            { status: 400 }
        );
    }

    const result = await addTeamOwner(input.teamId, input.personnelId);

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
 * DELETE /api/teams/owners
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
    const teamId = searchParams.get("teamId");
    const personnelId = searchParams.get("personnelId");

    if (!teamId || !personnelId) {
        return NextResponse.json(
            { success: false, error: "teamId and personnelId query params required" },
            { status: 400 }
        );
    }

    const result = await removeTeamOwner(teamId, personnelId);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
