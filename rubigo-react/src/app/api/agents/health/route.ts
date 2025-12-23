/**
 * Agent Health Check API - Test endpoint for AI SDK integration
 * 
 * GET /api/agents/health
 * Returns Ollama availability status using the new AI SDK provider
 */

import { NextResponse } from "next/server";
import { checkOllamaHealth, getModelName, getBaseUrl } from "@/lib/agents/ai-sdk";

export async function GET() {
    try {
        const health = await checkOllamaHealth();

        return NextResponse.json({
            ...health,
            provider: "ai-sdk-ollama",
            configuredModel: getModelName(),
            configuredUrl: getBaseUrl(),
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { available: false, error: message, provider: "ai-sdk-ollama" },
            { status: 500 }
        );
    }
}
