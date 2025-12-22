/**
 * Ollama Client - Local LLM integration for agent simulation
 * 
 * Wraps the Ollama API for generating agent thoughts and actions.
 * Handles graceful degradation when Ollama is unavailable.
 */

// Default configuration
const OLLAMA_BASE_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "gemma3:4b";

export interface OllamaConfig {
    baseUrl: string;
    model: string;
    timeout: number; // milliseconds
}

export interface GenerateOptions {
    temperature?: number;
    maxTokens?: number;
    system?: string;
    stream?: boolean;
}

export interface OllamaHealthStatus {
    available: boolean;
    model?: string;
    version?: string;
    error?: string;
}

export interface GenerateResult {
    success: boolean;
    response?: string;
    error?: string;
    model?: string;
    totalDuration?: number; // nanoseconds
}

/**
 * OllamaClient - Wrapper for local Ollama API
 * 
 * Usage:
 * ```typescript
 * const client = new OllamaClient();
 * 
 * // Check if Ollama is available
 * const health = await client.isAvailable();
 * if (!health.available) {
 *   // Handle graceful degradation
 * }
 * 
 * // Generate response
 * const result = await client.generate("What should I do next?");
 * ```
 */
export class OllamaClient {
    private config: OllamaConfig;

    constructor(config?: Partial<OllamaConfig>) {
        this.config = {
            baseUrl: config?.baseUrl || OLLAMA_BASE_URL,
            model: config?.model || DEFAULT_MODEL,
            timeout: config?.timeout || 30000, // 30 seconds default
        };
    }

    /**
     * Check if Ollama is available and the model is loaded
     */
    async isAvailable(): Promise<OllamaHealthStatus> {
        try {
            // Check Ollama API version endpoint
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`${this.config.baseUrl}/api/version`, {
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                return { available: false, error: "Ollama API not responding" };
            }

            const versionData = await response.json();

            // Check if our model is available
            const modelsResponse = await fetch(`${this.config.baseUrl}/api/tags`);
            if (modelsResponse.ok) {
                const modelsData = await modelsResponse.json();
                const modelFound = modelsData.models?.some(
                    (m: { name: string }) => m.name === this.config.model || m.name.startsWith(this.config.model.split(":")[0])
                );

                if (!modelFound) {
                    return {
                        available: false,
                        version: versionData.version,
                        error: `Model ${this.config.model} not found. Run: ollama pull ${this.config.model}`,
                    };
                }
            }

            return {
                available: true,
                model: this.config.model,
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
     * Generate a response using the configured model
     */
    async generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

            const requestBody = {
                model: this.config.model,
                prompt,
                stream: false,
                options: {
                    temperature: options?.temperature ?? 0.7,
                    num_predict: options?.maxTokens ?? 256,
                },
                ...(options?.system && { system: options.system }),
            };

            const response = await fetch(`${this.config.baseUrl}/api/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                return {
                    success: false,
                    error: `Ollama API error: ${response.status} - ${errorText}`,
                };
            }

            const data = await response.json();

            return {
                success: true,
                response: data.response,
                model: data.model,
                totalDuration: data.total_duration,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            return {
                success: false,
                error: errorMessage.includes("abort")
                    ? "Generation timeout"
                    : errorMessage,
            };
        }
    }

    /**
     * Generate a streaming response (for real-time thought display)
     */
    async *generateStream(prompt: string, options?: GenerateOptions): AsyncGenerator<string, void, unknown> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

            const requestBody = {
                model: this.config.model,
                prompt,
                stream: true,
                options: {
                    temperature: options?.temperature ?? 0.7,
                    num_predict: options?.maxTokens ?? 256,
                },
                ...(options?.system && { system: options.system }),
            };

            const response = await fetch(`${this.config.baseUrl}/api/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (!response.ok || !response.body) {
                throw new Error(`Ollama API error: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n").filter((line) => line.trim());

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        if (data.response) {
                            yield data.response;
                        }
                    } catch {
                        // Skip malformed JSON lines
                    }
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            throw new Error(`Stream generation failed: ${errorMessage}`);
        }
    }

    /**
     * Get the configured model name
     */
    getModel(): string {
        return this.config.model;
    }

    /**
     * Get the base URL
     */
    getBaseUrl(): string {
        return this.config.baseUrl;
    }
}

// Singleton instance for convenience
let defaultClient: OllamaClient | null = null;

export function getOllamaClient(): OllamaClient {
    if (!defaultClient) {
        defaultClient = new OllamaClient();
    }
    return defaultClient;
}

export function resetOllamaClient(): void {
    defaultClient = null;
}
