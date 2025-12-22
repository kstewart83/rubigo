/**
 * POST /api/agents/loop/stop
 * 
 * Stop the server-side agent loop worker.
 */

import { agentWorkerManager } from "@/lib/agent-worker-manager";

export async function POST() {
    try {
        const result = agentWorkerManager.stop();

        return Response.json({
            ...result,
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
