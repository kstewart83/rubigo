/**
 * Ollama Models API
 * GET /api/agents/ollama/models
 * 
 * Returns list of available Ollama models.
 */

import { NextResponse } from "next/server";

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || "http://localhost:11434";

export async function GET() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
            signal: controller.signal,
            cache: 'no-store',
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
            return NextResponse.json({
                success: false,
                models: [],
                error: "Failed to fetch models from Ollama",
            });
        }

        const data = await res.json();
        const models = (data.models || []).map((m: { name: string; size: number; modified_at: string }) => ({
            name: m.name,
            size: m.size,
            modifiedAt: m.modified_at,
        }));

        return NextResponse.json({
            success: true,
            models,
            baseUrl: OLLAMA_BASE_URL,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({
            success: false,
            models: [],
            error: errorMessage.includes("abort")
                ? "Ollama connection timeout"
                : errorMessage,
        });
    }
}
