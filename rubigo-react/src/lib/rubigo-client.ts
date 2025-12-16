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

// Solution Space types
export interface SolutionInput {
    id?: string;
    name: string;
    description?: string;
    status?: "pipeline" | "catalog" | "retired";
}

export interface ProductInput {
    id?: string;
    solution_id: string;
    version?: string;
}

export interface ServiceInput {
    id?: string;
    solution_id: string;
    service_level?: string;
}

export interface ReleaseInput {
    id?: string;
    product_id: string;
    version: string;
    release_date?: string;
    status?: string;
}

// Strategy Space types
export interface ProjectInput {
    id?: string;
    name: string;
    description?: string;
    solution_id?: string;
    status?: "planning" | "active" | "on_hold" | "complete" | "cancelled";
    start_date?: string;
    end_date?: string;
}

export interface ObjectiveInput {
    id?: string;
    title: string;
    description?: string;
    project_id?: string;
    parent_id?: string;
    status?: "draft" | "active" | "achieved" | "deferred";
}

export interface MetricInput {
    id?: string;
    name: string;
    description?: string;
    unit: string;
    current_value?: number;
}

export interface KpiInput {
    id?: string;
    metric_id: string;
    objective_id?: string;
    target_value: number;
    direction: "increase" | "decrease" | "maintain";
    threshold_warning?: number;
    threshold_critical?: number;
}

// Requirements Space types
export interface FeatureInput {
    id?: string;
    name: string;
    description?: string;
    objective_id?: string;
    status?: "planned" | "in_progress" | "complete" | "cancelled";
}

export interface RuleInput {
    id?: string;
    feature_id: string;
    role: string;
    requirement: string;
    reason: string;
    status?: "draft" | "active" | "deprecated";
}

export interface SpecificationInput {
    id?: string;
    feature_id: string;
    name: string;
    narrative: string;
    category: "performance" | "security" | "usability" | "reliability" | "accessibility" | "maintainability";
    status?: "draft" | "active" | "deprecated";
}

export interface ScenarioInput {
    id?: string;
    rule_id: string;
    name: string;
    narrative: string;
    status?: "draft" | "active" | "deprecated";
}

// Execution Space types
export interface InitiativeInput {
    id?: string;
    name: string;
    description?: string;
    kpi_id?: string;
    status?: "planned" | "active" | "complete" | "cancelled";
    start_date?: string;
    end_date?: string;
}

export interface ActivityInput {
    id?: string;
    name: string;
    description?: string;
    parent_id?: string;
    initiative_id?: string;
    blocked_by?: string;
    status?: "backlog" | "ready" | "in_progress" | "blocked" | "complete";
}

export interface RoleInput {
    id?: string;
    name: string;
    description?: string;
}

export interface AssignmentInput {
    id?: string;
    activity_id: string;
    role_id: string;
    quantity: number;
    unit?: string;
    raci_type?: "responsible" | "accountable" | "consulted" | "informed";
}

export interface AllocationInput {
    id?: string;
    assignment_id: string;
    person_id: string;
    quantity_contributed: number;
    start_date?: string;
    end_date?: string;
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

    async createPersonnel(input: PersonnelInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/personnel", input);
    }

    // ========================================================================
    // Solution Space API
    // ========================================================================

    async createSolution(input: SolutionInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/solutions", input);
    }

    async createProduct(input: ProductInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/products", input);
    }

    async createService(input: ServiceInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/services", input);
    }

    async createRelease(input: ReleaseInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/releases", input);
    }

    // ========================================================================
    // Strategy Space API
    // ========================================================================

    async createProject(input: ProjectInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/projects", input);
    }

    async createObjective(input: ObjectiveInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/objectives", input);
    }

    async createMetric(input: MetricInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/metrics", input);
    }

    async createKpi(input: KpiInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/kpis", input);
    }

    // ========================================================================
    // Requirements Space API
    // ========================================================================

    async createFeature(input: FeatureInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/features", input);
    }

    async createRule(input: RuleInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/rules", input);
    }

    async createSpecification(input: SpecificationInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/specifications", input);
    }

    async createScenario(input: ScenarioInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/scenarios", input);
    }

    // ========================================================================
    // Execution Space API
    // ========================================================================

    async createInitiative(input: InitiativeInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/initiatives", input);
    }

    async createActivity(input: ActivityInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/activities", input);
    }

    async createRole(input: RoleInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/roles", input);
    }

    async createAssignment(input: AssignmentInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/assignments", input);
    }

    async createAllocation(input: AllocationInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/allocations", input);
    }
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
