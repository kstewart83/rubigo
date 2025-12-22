/**
 * POST /api/agents/loop/start
 * 
 * Start the server-side agent loop worker.
 */

import { agentWorkerManager } from "@/lib/agent-worker-manager";

export async function POST(request: Request) {
    try {
        // Get the server URL from the request
        const url = new URL(request.url);
        const serverUrl = `${url.protocol}//${url.host}`;

        // Optional: Parse tick interval from request body
        let tickIntervalMs = 3000;
        try {
            const body = await request.json();
            if (body.tickIntervalMs && typeof body.tickIntervalMs === "number") {
                tickIntervalMs = Math.max(1000, Math.min(60000, body.tickIntervalMs));
            }
        } catch {
            // No body or invalid JSON, use default
        }

        const result = agentWorkerManager.start(tickIntervalMs, serverUrl);

        return Response.json({
            ...result,
            serverUrl,
            status: agentWorkerManager.getStatus(),
        });
    } catch (error) {
        return Response.json(
            {
                success: false,
                message: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
