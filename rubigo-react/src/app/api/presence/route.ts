/**
 * Presence API Endpoint
 * 
 * POST /api/presence - Send heartbeat (fire-and-forget to worker)
 * PUT /api/presence - Set manual status override (online, away, offline)
 * GET /api/presence - Get all active users
 * DELETE /api/presence - Mark offline
 */

import { getSession } from "@/lib/session";
import { getActiveUsers } from "@/lib/presence";
import { eventRouter } from "@/workers/event-router";

export async function POST(request: Request) {
    const session = await getSession(request);
    if (!session?.personnelId) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fire-and-forget to presence worker
    eventRouter.send({
        type: "presence.heartbeat",
        personnelId: session.personnelId,
        sessionId: session.id,
    });

    return Response.json({ status: "ok" });
}

/**
 * PUT - Manual status override
 * Body: { status: "online" | "away" | "offline" }
 */
export async function PUT(request: Request) {
    const session = await getSession(request);
    if (!session?.personnelId) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const status = body.status as "online" | "away" | "offline";

        if (!["online", "away", "offline"].includes(status)) {
            return Response.json({ error: "Invalid status" }, { status: 400 });
        }

        // Send to worker
        eventRouter.send({
            type: "presence.setStatus",
            personnelId: session.personnelId,
            sessionId: session.id,
            status,
        });

        return Response.json({ status });
    } catch {
        return Response.json({ error: "Invalid request" }, { status: 400 });
    }
}

export async function GET(request: Request) {
    const session = await getSession(request);
    if (!session?.id) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const activeUsers = await getActiveUsers();
        return Response.json({ users: activeUsers });
    } catch (err) {
        console.error("[Presence] Error fetching:", err);
        return Response.json({ error: "Failed to fetch presence" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const session = await getSession(request);
    if (!session?.personnelId) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fire-and-forget to presence worker
    eventRouter.send({
        type: "presence.offline",
        personnelId: session.personnelId,
    });

    return Response.json({ status: "offline" });
}

