/**
 * Agent Ollama Health API
 * GET /api/agents/ollama/health
 * 
 * Inline implementation to avoid ReadableStream locked errors
 * that occur with the OllamaClient class in Next.js.
 */

import { NextResponse } from "next/server";

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma3:4b";

export async function GET() {
    try {
        // Check Ollama API version
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const versionRes = await fetch(`${OLLAMA_BASE_URL}/api/version`, {
            signal: controller.signal,
            cache: 'no-store',
        });
        clearTimeout(timeoutId);

        if (!versionRes.ok) {
            return NextResponse.json({
                available: false,
                error: "Ollama API not responding",
                baseUrl: OLLAMA_BASE_URL,
            });
        }

        const versionData = await versionRes.json();

        // Check if model is available
        const modelsRes = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
            cache: 'no-store',
        });

        if (modelsRes.ok) {
            const modelsData = await modelsRes.json();
            const modelFound = modelsData.models?.some(
                (m: { name: string }) => m.name === OLLAMA_MODEL || m.name.startsWith(OLLAMA_MODEL.split(":")[0])
            );

            if (!modelFound) {
                return NextResponse.json({
                    available: false,
                    model: OLLAMA_MODEL,
                    version: versionData.version,
                    error: `Model ${OLLAMA_MODEL} not found. Run: ollama pull ${OLLAMA_MODEL}`,
                    baseUrl: OLLAMA_BASE_URL,
                });
            }
        }

        return NextResponse.json({
            available: true,
            model: OLLAMA_MODEL,
            version: versionData.version,
            baseUrl: OLLAMA_BASE_URL,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({
            available: false,
            model: OLLAMA_MODEL,
            error: errorMessage.includes("abort")
                ? "Ollama connection timeout - is Ollama running?"
                : errorMessage,
            baseUrl: OLLAMA_BASE_URL,
        });
    }
}
