/**
 * Personnel REST API
 * 
 * GET /api/personnel - List personnel (with pagination, search, filter)
 * POST /api/personnel - Create a new personnel record
 * 
 * Requires Authorization: Bearer <token> header
 */

import { NextRequest, NextResponse } from "next/server";
import { validateApiToken } from "@/lib/initialization";
import { createPersonnel, getPersonnelPage, type PersonnelInput } from "@/lib/personnel-actions";

/**
 * GET /api/personnel
 * Returns paginated list of personnel
 * 
 * Query params:
 * - page: number (default: 1)
 * - pageSize: number (default: 20, max: 100)
 * - search: string (searches name, email, title)
 * - department: string (filter by department)
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));
    const search = searchParams.get("search") || undefined;
    const department = searchParams.get("department") || undefined;

    try {
        const result = await getPersonnelPage({ page, pageSize, search, department });
        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        console.error("GET personnel list error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to list personnel" },
            { status: 500 }
        );
    }
}

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
