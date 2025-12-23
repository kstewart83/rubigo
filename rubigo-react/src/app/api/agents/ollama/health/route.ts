/**
 * Agent Ollama Health API
 * GET /api/agents/ollama/health
 */

import { NextResponse } from "next/server";
import { OllamaClient } from "@/lib/agents";

export async function GET() {
    try {
        // Use fresh client instance per request to avoid ReadableStream locked errors
        const client = new OllamaClient();
        const health = await client.isAvailable();

        return NextResponse.json({
            available: health.available,
            model: health.model || client.getModel(),
            version: health.version,
            error: health.error,
            baseUrl: client.getBaseUrl(),
        });
    } catch (error) {
        return NextResponse.json(
            {
                available: false,
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
