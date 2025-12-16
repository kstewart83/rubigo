/**
 * Rubigo SDK Client
 * 
 * A typed client library for interacting with the Rubigo API.
 * Can be used by scripts and third-party applications.
 */

export interface RubigoClientConfig {
    baseUrl: string;
    apiToken: string;
}

export interface PersonnelInput {
    name: string;
    email: string;
    title?: string;
    department: string;
    site?: string;
    building?: string;
    level?: number;
    space?: string;
    manager?: string;
    photo?: string;
    deskPhone?: string;
    cellPhone?: string;
    bio?: string;
}

export interface ApiResult {
    success: boolean;
    id?: string;
    error?: string;
}

export class RubigoClient {
    private baseUrl: string;
    private apiToken: string;

    constructor(config: RubigoClientConfig) {
        this.baseUrl = config.baseUrl.replace(/\/$/, ""); // Remove trailing slash
        this.apiToken = config.apiToken;
    }

    private async request<T>(
        method: string,
        path: string,
        body?: unknown
    ): Promise<T> {
        const url = `${this.baseUrl}${path}`;
        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiToken}`,
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        const data = await response.json();

        if (!response.ok && !data.error) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return data;
    }

    // ========================================================================
    // Personnel API
    // ========================================================================

    /**
     * Create a new personnel record
     */
    async createPersonnel(input: PersonnelInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/personnel", input);
    }

    // Future: Add more entity methods (solutions, projects, etc.)
}

/**
 * Create a Rubigo client with default configuration from environment
 */
export function createClient(options?: {
    baseUrl?: string;
    apiToken?: string;
}): RubigoClient {
    const baseUrl = options?.baseUrl || process.env.RUBIGO_API_URL || "http://localhost:3000";
    const apiToken = options?.apiToken || process.env.RUBIGO_API_TOKEN || "";

    if (!apiToken) {
        throw new Error("RUBIGO_API_TOKEN environment variable is required");
    }

    return new RubigoClient({ baseUrl, apiToken });
}
