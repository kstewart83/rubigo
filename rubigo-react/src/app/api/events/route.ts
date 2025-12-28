/**
 * SSE Events Endpoint
 * 
 * GET /api/events - Server-Sent Events stream for real-time updates
 * 
 * Query params:
 * - after: Event ID to resume from (for catch-up after reconnection)
 * 
 * Auth: Session cookie (same as page navigation)
 */

import { db } from "@/db";
import { sessionEvents } from "@/db/schema";
import { getSession } from "@/lib/session";
import { and, eq, gt, isNull } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Keep connections alive
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

export async function GET(request: Request) {
    // Auth via session cookie
    const session = await getSession(request);
    if (!session?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    const sessionId = session.id;
    const url = new URL(request.url);
    const afterEventId = url.searchParams.get("after");

    // Create SSE stream
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();

            // Helper to send SSE event
            const sendEvent = (event: { id: string; type: string; payload: unknown }) => {
                const data = JSON.stringify(event);
                controller.enqueue(encoder.encode(`id: ${event.id}\ndata: ${data}\n\n`));
            };

            // Send initial connection confirmation
            sendEvent({
                id: "connected",
                type: "connection",
                payload: { status: "connected", sessionId: sessionId.slice(0, 8) },
            });

            // Catch-up: Send any pending events
            try {
                const pendingEvents = await db
                    .select()
                    .from(sessionEvents)
                    .where(
                        and(
                            eq(sessionEvents.sessionId, sessionId),
                            isNull(sessionEvents.ackedAt),
                            afterEventId ? gt(sessionEvents.id, afterEventId) : undefined
                        )
                    )
                    .orderBy(sessionEvents.createdAt);

                for (const event of pendingEvents) {
                    sendEvent({
                        id: event.id,
                        type: event.eventType,
                        payload: JSON.parse(event.payload),
                    });
                }

                if (pendingEvents.length > 0) {
                    console.log(`[SSE] Sent ${pendingEvents.length} catch-up events to session ${sessionId.slice(0, 8)}`);
                }
            } catch (err) {
                console.error("[SSE] Error fetching catch-up events:", err);
            }

            // Heartbeat to keep connection alive
            const heartbeatInterval = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(": heartbeat\n\n"));
                } catch {
                    // Stream closed
                    clearInterval(heartbeatInterval);
                }
            }, HEARTBEAT_INTERVAL);

            // Poll for new events (simple approach - can be optimized with worker later)
            const pollInterval = setInterval(async () => {
                try {
                    const newEvents = await db
                        .select()
                        .from(sessionEvents)
                        .where(
                            and(
                                eq(sessionEvents.sessionId, sessionId),
                                isNull(sessionEvents.ackedAt)
                            )
                        )
                        .orderBy(sessionEvents.createdAt)
                        .limit(10);

                    for (const event of newEvents) {
                        sendEvent({
                            id: event.id,
                            type: event.eventType,
                            payload: JSON.parse(event.payload),
                        });
                    }
                } catch {
                    // Ignore poll errors
                }
            }, 1000); // Poll every second

            // Cleanup on close
            request.signal.addEventListener("abort", () => {
                clearInterval(heartbeatInterval);
                clearInterval(pollInterval);
                console.log(`[SSE] Connection closed for session ${sessionId.slice(0, 8)}`);
            });
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no", // Disable nginx buffering
        },
    });
}

/**
 * POST /api/events/ack - Acknowledge received events
 * Body: { eventIds: string[] }
 */
export async function POST(request: Request) {
    const session = await getSession(request);
    if (!session?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        const body = await request.json();
        const eventIds = body.eventIds as string[];

        if (!Array.isArray(eventIds) || eventIds.length === 0) {
            return Response.json({ error: "eventIds required" }, { status: 400 });
        }

        const now = new Date().toISOString();

        // Mark events as acknowledged
        for (const eventId of eventIds) {
            await db
                .update(sessionEvents)
                .set({ ackedAt: now })
                .where(
                    and(
                        eq(sessionEvents.id, eventId),
                        eq(sessionEvents.sessionId, session.id)
                    )
                );
        }

        return Response.json({ acknowledged: eventIds.length });
    } catch (err) {
        console.error("[SSE] Error acknowledging events:", err);
        return Response.json({ error: "Failed to acknowledge" }, { status: 500 });
    }
}
