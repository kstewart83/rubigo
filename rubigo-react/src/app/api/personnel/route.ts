/**
 * Personnel REST API
 * 
 * POST /api/personnel - Create a new personnel record
 * 
 * Requires Authorization: Bearer <token> header
 */

import { NextRequest, NextResponse } from "next/server";
import { validateApiToken } from "@/lib/initialization";
import { createPersonnel, type PersonnelInput } from "@/lib/personnel-actions";

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
    let input: PersonnelInput;
    try {
        input = await request.json();
    } catch {
        return NextResponse.json(
            { success: false, error: "Invalid JSON" },
            { status: 400 }
        );
    }

    // Create personnel via server action (source: "api")
    const result = await createPersonnel(
        input,
        auth.actorId!,
        auth.actorName!,
        "api"
    );

    if (result.success) {
        return NextResponse.json(result, { status: 201 });
    } else {
        return NextResponse.json(result, { status: 400 });
    }
}
