/**
 * GET /api/agents/loop/status
 * 
 * Get the current status of the agent loop worker.
 */

import { agentWorkerManager } from "@/lib/agent-worker-manager";

export async function GET() {
    try {
        const status = agentWorkerManager.getStatus();

        return Response.json({
            success: true,
            ...status,
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
