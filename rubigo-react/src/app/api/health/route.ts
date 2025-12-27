import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { validateApiToken } from "@/lib/initialization";

export const dynamic = "force-dynamic";

/**
 * Health check endpoint for staging and monitoring.
 * Requires API token authentication.
 * Validates:
 * - API token is valid
 * - Database connection works
 */
export async function GET(request: Request) {
    // Extract API token from Authorization header
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    // Validate token
    const authResult = await validateApiToken(token ?? null);
    if (!authResult.valid) {
        return NextResponse.json(
            {
                status: "unauthorized",
                error: authResult.error || "Invalid or missing API token",
            },
            { status: 401 }
        );
    }

    try {
        // Quick database connectivity check
        const db = getDb();
        const result = db.prepare("SELECT 1 as ok").get();

        return NextResponse.json({
            status: "healthy",
            timestamp: new Date().toISOString(),
            actor: authResult.actorName,
            checks: {
                api: "ok",
                auth: "ok",
                database: result ? "ok" : "error",
            },
        });
    } catch (error) {
        return NextResponse.json(
            {
                status: "unhealthy",
                timestamp: new Date().toISOString(),
                checks: {
                    api: "ok",
                    auth: "ok",
                    database: "error",
                },
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 503 }
        );
    }
}
