/**
 * Teams REST API
 * 
 * GET /api/teams - List all teams
 * POST /api/teams - Create a new team
 * 
 * Requires Authorization: Bearer <token> header
 */

import { NextRequest, NextResponse } from "next/server";
import { validateApiToken } from "@/lib/initialization";
import { getTeams, createTeam, addTeamMember, addTeamOwner } from "@/lib/teams-actions";

/**
 * GET /api/teams
 * Returns list of all teams with members and child teams
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
        const result = await getTeams();
        return NextResponse.json(result);
    } catch (error) {
        console.error("GET teams error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to list teams" },
            { status: 500 }
        );
    }
}

interface TeamInput {
    name: string;
    description?: string;
    createdBy?: string;
    memberIds?: string[];
    ownerIds?: string[];
    aco?: string;
}

/**
 * POST /api/teams
 * Create a new team
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

    let input: TeamInput;
    try {
        input = await request.json();
    } catch {
        return NextResponse.json(
            { success: false, error: "Invalid JSON" },
            { status: 400 }
        );
    }

    // Create team
    const result = await createTeam({
        name: input.name,
        description: input.description,
        createdBy: input.createdBy || auth.actorId,
        memberIds: input.memberIds,
        aco: input.aco,
    });

    if (!result.success) {
        return NextResponse.json(result, { status: 400 });
    }

    // Add owners if specified
    if (input.ownerIds && input.ownerIds.length > 0 && result.data) {
        for (const ownerId of input.ownerIds) {
            await addTeamOwner(result.data.id, ownerId);
        }
    }

    return NextResponse.json({ success: true, id: result.data?.id }, { status: 201 });
}
