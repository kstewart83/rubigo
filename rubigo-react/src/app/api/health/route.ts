import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Health check endpoint for staging and monitoring.
 * Validates:
 * - API is responding
 * - Database connection works
 */
export async function GET() {
    try {
        // Quick database connectivity check
        const db = getDb();
        const result = db.prepare("SELECT 1 as ok").get();

        return NextResponse.json({
            status: "healthy",
            timestamp: new Date().toISOString(),
            checks: {
                api: "ok",
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
                    database: "error",
                },
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 503 }
        );
    }
}
