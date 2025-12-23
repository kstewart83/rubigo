/**
 * AI SDK Ollama Provider
 * 
 * Configured singleton for ai-sdk-ollama provider with environment-based settings.
 * Wraps health check logic from the legacy OllamaClient.
 */

import { ollama, createOllama } from 'ai-sdk-ollama';

// Configuration from environment
const OLLAMA_BASE_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "gemma3:4b";

// Create configured provider instance
const configuredProvider = createOllama({
    baseURL: OLLAMA_BASE_URL,
});

/**
 * Get the configured Ollama model for agent generation
 */
export function getOllamaModel(modelName?: string) {
    return configuredProvider(modelName || DEFAULT_MODEL);
}

/**
 * Get embedding model for RAG/similarity tasks
 */
export function getOllamaEmbeddingModel(modelName: string = 'nomic-embed-text') {
    return ollama.embedding(modelName);
}

/**
 * Check if Ollama is available and the model is loaded
 * Preserves the health check pattern from the legacy OllamaClient
 */
export interface OllamaHealthStatus {
    available: boolean;
    model?: string;
    version?: string;
    error?: string;
}

export async function checkOllamaHealth(): Promise<OllamaHealthStatus> {
    try {
        // Check Ollama API version endpoint
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${OLLAMA_BASE_URL}/api/version`, {
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            return { available: false, error: "Ollama API not responding" };
        }

        const versionData = await response.json();

        // Check if our model is available
        const modelsResponse = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
        if (modelsResponse.ok) {
            const modelsData = await modelsResponse.json();
            const modelFound = modelsData.models?.some(
                (m: { name: string }) =>
                    m.name === DEFAULT_MODEL ||
                    m.name.startsWith(DEFAULT_MODEL.split(":")[0])
            );

            if (!modelFound) {
                return {
                    available: false,
                    version: versionData.version,
                    error: `Model ${DEFAULT_MODEL} not found. Run: ollama pull ${DEFAULT_MODEL}`,
                };
            }
        }

        return {
            available: true,
            model: DEFAULT_MODEL,
            version: versionData.version,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return {
            available: false,
            error: errorMessage.includes("abort")
                ? "Ollama connection timeout - is Ollama running?"
                : errorMessage,
        };
    }
}

/**
 * Get the configured model name
 */
export function getModelName(): string {
    return DEFAULT_MODEL;
}

/**
 * Get the base URL
 */
export function getBaseUrl(): string {
    return OLLAMA_BASE_URL;
}

// Re-export commonly used AI SDK functions for convenience
export { generateText, streamText, generateObject, tool } from 'ai';
export { ollama } from 'ai-sdk-ollama';
