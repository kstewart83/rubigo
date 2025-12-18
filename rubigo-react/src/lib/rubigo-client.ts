/**
 * Rubigo SDK Client
 * 
 * A typed client library for interacting with the Rubigo API.
 * Can be used by scripts and third-party applications.
 * 
 * Supports full CRUD operations for all entities:
 * - list() - Get all records
 * - get(id) - Get single record by ID
 * - create(input) - Create new record
 * - update(id, updates) - Update existing record
 * - delete(id) - Delete record
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

export interface PersonnelListParams {
    page?: number;
    pageSize?: number;
    search?: string;
    department?: string;
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
    name: string;
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

// API Response types
export interface ApiResult {
    success: boolean;
    id?: string;
    error?: string;
}

export interface ListResult<T> {
    success: boolean;
    data: T[];
    total?: number;
    page?: number;
    pageSize?: number;
    error?: string;
}

export interface GetResult<T> {
    success: boolean;
    data?: T;
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

    async listPersonnel(params?: PersonnelListParams): Promise<ListResult<unknown>> {
        const query = new URLSearchParams();
        if (params?.page) query.set("page", String(params.page));
        if (params?.pageSize) query.set("pageSize", String(params.pageSize));
        if (params?.search) query.set("search", params.search);
        if (params?.department) query.set("department", params.department);
        const queryStr = query.toString();
        return this.request<ListResult<unknown>>("GET", `/api/personnel${queryStr ? `?${queryStr}` : ""}`);
    }

    async getPersonnel(id: string): Promise<GetResult<unknown>> {
        return this.request<GetResult<unknown>>("GET", `/api/personnel/${id}`);
    }

    async createPersonnel(input: PersonnelInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/personnel", input);
    }

    async updatePersonnel(id: string, updates: Partial<PersonnelInput>): Promise<ApiResult> {
        return this.request<ApiResult>("PUT", `/api/personnel/${id}`, updates);
    }

    async deletePersonnel(id: string): Promise<ApiResult> {
        return this.request<ApiResult>("DELETE", `/api/personnel/${id}`);
    }

    // ========================================================================
    // Solution Space API
    // ========================================================================

    async listSolutions(): Promise<ListResult<unknown>> {
        return this.request<ListResult<unknown>>("GET", "/api/solutions");
    }

    async getSolution(id: string): Promise<GetResult<unknown>> {
        return this.request<GetResult<unknown>>("GET", `/api/solutions/${id}`);
    }

    async createSolution(input: SolutionInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/solutions", input);
    }

    async updateSolution(id: string, updates: Partial<SolutionInput>): Promise<ApiResult> {
        return this.request<ApiResult>("PUT", `/api/solutions/${id}`, updates);
    }

    async deleteSolution(id: string): Promise<ApiResult> {
        return this.request<ApiResult>("DELETE", `/api/solutions/${id}`);
    }

    async listProducts(): Promise<ListResult<unknown>> {
        return this.request<ListResult<unknown>>("GET", "/api/products");
    }

    async getProduct(id: string): Promise<GetResult<unknown>> {
        return this.request<GetResult<unknown>>("GET", `/api/products/${id}`);
    }

    async createProduct(input: ProductInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/products", input);
    }

    async updateProduct(id: string, updates: Partial<ProductInput>): Promise<ApiResult> {
        return this.request<ApiResult>("PUT", `/api/products/${id}`, updates);
    }

    async deleteProduct(id: string): Promise<ApiResult> {
        return this.request<ApiResult>("DELETE", `/api/products/${id}`);
    }

    async listServices(): Promise<ListResult<unknown>> {
        return this.request<ListResult<unknown>>("GET", "/api/services");
    }

    async getService(id: string): Promise<GetResult<unknown>> {
        return this.request<GetResult<unknown>>("GET", `/api/services/${id}`);
    }

    async createService(input: ServiceInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/services", input);
    }

    async updateService(id: string, updates: Partial<ServiceInput>): Promise<ApiResult> {
        return this.request<ApiResult>("PUT", `/api/services/${id}`, updates);
    }

    async deleteService(id: string): Promise<ApiResult> {
        return this.request<ApiResult>("DELETE", `/api/services/${id}`);
    }

    async listReleases(): Promise<ListResult<unknown>> {
        return this.request<ListResult<unknown>>("GET", "/api/releases");
    }

    async getRelease(id: string): Promise<GetResult<unknown>> {
        return this.request<GetResult<unknown>>("GET", `/api/releases/${id}`);
    }

    async createRelease(input: ReleaseInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/releases", input);
    }

    async updateRelease(id: string, updates: Partial<ReleaseInput>): Promise<ApiResult> {
        return this.request<ApiResult>("PUT", `/api/releases/${id}`, updates);
    }

    async deleteRelease(id: string): Promise<ApiResult> {
        return this.request<ApiResult>("DELETE", `/api/releases/${id}`);
    }

    // ========================================================================
    // Strategy Space API
    // ========================================================================

    async listProjects(): Promise<ListResult<unknown>> {
        return this.request<ListResult<unknown>>("GET", "/api/projects");
    }

    async getProject(id: string): Promise<GetResult<unknown>> {
        return this.request<GetResult<unknown>>("GET", `/api/projects/${id}`);
    }

    async createProject(input: ProjectInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/projects", input);
    }

    async updateProject(id: string, updates: Partial<ProjectInput>): Promise<ApiResult> {
        return this.request<ApiResult>("PUT", `/api/projects/${id}`, updates);
    }

    async deleteProject(id: string): Promise<ApiResult> {
        return this.request<ApiResult>("DELETE", `/api/projects/${id}`);
    }

    async listObjectives(): Promise<ListResult<unknown>> {
        return this.request<ListResult<unknown>>("GET", "/api/objectives");
    }

    async getObjective(id: string): Promise<GetResult<unknown>> {
        return this.request<GetResult<unknown>>("GET", `/api/objectives/${id}`);
    }

    async createObjective(input: ObjectiveInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/objectives", input);
    }

    async updateObjective(id: string, updates: Partial<ObjectiveInput>): Promise<ApiResult> {
        return this.request<ApiResult>("PUT", `/api/objectives/${id}`, updates);
    }

    async deleteObjective(id: string): Promise<ApiResult> {
        return this.request<ApiResult>("DELETE", `/api/objectives/${id}`);
    }

    async listMetrics(): Promise<ListResult<unknown>> {
        return this.request<ListResult<unknown>>("GET", "/api/metrics");
    }

    async getMetric(id: string): Promise<GetResult<unknown>> {
        return this.request<GetResult<unknown>>("GET", `/api/metrics/${id}`);
    }

    async createMetric(input: MetricInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/metrics", input);
    }

    async updateMetric(id: string, updates: Partial<MetricInput>): Promise<ApiResult> {
        return this.request<ApiResult>("PUT", `/api/metrics/${id}`, updates);
    }

    async deleteMetric(id: string): Promise<ApiResult> {
        return this.request<ApiResult>("DELETE", `/api/metrics/${id}`);
    }

    async listKpis(): Promise<ListResult<unknown>> {
        return this.request<ListResult<unknown>>("GET", "/api/kpis");
    }

    async getKpi(id: string): Promise<GetResult<unknown>> {
        return this.request<GetResult<unknown>>("GET", `/api/kpis/${id}`);
    }

    async createKpi(input: KpiInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/kpis", input);
    }

    async updateKpi(id: string, updates: Partial<KpiInput>): Promise<ApiResult> {
        return this.request<ApiResult>("PUT", `/api/kpis/${id}`, updates);
    }

    async deleteKpi(id: string): Promise<ApiResult> {
        return this.request<ApiResult>("DELETE", `/api/kpis/${id}`);
    }

    // ========================================================================
    // Requirements Space API
    // ========================================================================

    async listFeatures(): Promise<ListResult<unknown>> {
        return this.request<ListResult<unknown>>("GET", "/api/features");
    }

    async getFeature(id: string): Promise<GetResult<unknown>> {
        return this.request<GetResult<unknown>>("GET", `/api/features/${id}`);
    }

    async createFeature(input: FeatureInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/features", input);
    }

    async updateFeature(id: string, updates: Partial<FeatureInput>): Promise<ApiResult> {
        return this.request<ApiResult>("PUT", `/api/features/${id}`, updates);
    }

    async deleteFeature(id: string): Promise<ApiResult> {
        return this.request<ApiResult>("DELETE", `/api/features/${id}`);
    }

    async listRules(): Promise<ListResult<unknown>> {
        return this.request<ListResult<unknown>>("GET", "/api/rules");
    }

    async getRule(id: string): Promise<GetResult<unknown>> {
        return this.request<GetResult<unknown>>("GET", `/api/rules/${id}`);
    }

    async createRule(input: RuleInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/rules", input);
    }

    async updateRule(id: string, updates: Partial<RuleInput>): Promise<ApiResult> {
        return this.request<ApiResult>("PUT", `/api/rules/${id}`, updates);
    }

    async deleteRule(id: string): Promise<ApiResult> {
        return this.request<ApiResult>("DELETE", `/api/rules/${id}`);
    }

    async listSpecifications(): Promise<ListResult<unknown>> {
        return this.request<ListResult<unknown>>("GET", "/api/specifications");
    }

    async getSpecification(id: string): Promise<GetResult<unknown>> {
        return this.request<GetResult<unknown>>("GET", `/api/specifications/${id}`);
    }

    async createSpecification(input: SpecificationInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/specifications", input);
    }

    async updateSpecification(id: string, updates: Partial<SpecificationInput>): Promise<ApiResult> {
        return this.request<ApiResult>("PUT", `/api/specifications/${id}`, updates);
    }

    async deleteSpecification(id: string): Promise<ApiResult> {
        return this.request<ApiResult>("DELETE", `/api/specifications/${id}`);
    }

    async listScenarios(): Promise<ListResult<unknown>> {
        return this.request<ListResult<unknown>>("GET", "/api/scenarios");
    }

    async getScenario(id: string): Promise<GetResult<unknown>> {
        return this.request<GetResult<unknown>>("GET", `/api/scenarios/${id}`);
    }

    async createScenario(input: ScenarioInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/scenarios", input);
    }

    async updateScenario(id: string, updates: Partial<ScenarioInput>): Promise<ApiResult> {
        return this.request<ApiResult>("PUT", `/api/scenarios/${id}`, updates);
    }

    async deleteScenario(id: string): Promise<ApiResult> {
        return this.request<ApiResult>("DELETE", `/api/scenarios/${id}`);
    }

    // ========================================================================
    // Execution Space API
    // ========================================================================

    async listInitiatives(): Promise<ListResult<unknown>> {
        return this.request<ListResult<unknown>>("GET", "/api/initiatives");
    }

    async getInitiative(id: string): Promise<GetResult<unknown>> {
        return this.request<GetResult<unknown>>("GET", `/api/initiatives/${id}`);
    }

    async createInitiative(input: InitiativeInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/initiatives", input);
    }

    async updateInitiative(id: string, updates: Partial<InitiativeInput>): Promise<ApiResult> {
        return this.request<ApiResult>("PUT", `/api/initiatives/${id}`, updates);
    }

    async deleteInitiative(id: string): Promise<ApiResult> {
        return this.request<ApiResult>("DELETE", `/api/initiatives/${id}`);
    }

    async listActivities(): Promise<ListResult<unknown>> {
        return this.request<ListResult<unknown>>("GET", "/api/activities");
    }

    async getActivity(id: string): Promise<GetResult<unknown>> {
        return this.request<GetResult<unknown>>("GET", `/api/activities/${id}`);
    }

    async createActivity(input: ActivityInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/activities", input);
    }

    async updateActivity(id: string, updates: Partial<ActivityInput>): Promise<ApiResult> {
        return this.request<ApiResult>("PUT", `/api/activities/${id}`, updates);
    }

    async deleteActivity(id: string): Promise<ApiResult> {
        return this.request<ApiResult>("DELETE", `/api/activities/${id}`);
    }

    async listRoles(): Promise<ListResult<unknown>> {
        return this.request<ListResult<unknown>>("GET", "/api/roles");
    }

    async getRole(id: string): Promise<GetResult<unknown>> {
        return this.request<GetResult<unknown>>("GET", `/api/roles/${id}`);
    }

    async createRole(input: RoleInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/roles", input);
    }

    async updateRole(id: string, updates: Partial<RoleInput>): Promise<ApiResult> {
        return this.request<ApiResult>("PUT", `/api/roles/${id}`, updates);
    }

    async deleteRole(id: string): Promise<ApiResult> {
        return this.request<ApiResult>("DELETE", `/api/roles/${id}`);
    }

    async listAssignments(): Promise<ListResult<unknown>> {
        return this.request<ListResult<unknown>>("GET", "/api/assignments");
    }

    async getAssignment(id: string): Promise<GetResult<unknown>> {
        return this.request<GetResult<unknown>>("GET", `/api/assignments/${id}`);
    }

    async createAssignment(input: AssignmentInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/assignments", input);
    }

    async updateAssignment(id: string, updates: Partial<AssignmentInput>): Promise<ApiResult> {
        return this.request<ApiResult>("PUT", `/api/assignments/${id}`, updates);
    }

    async deleteAssignment(id: string): Promise<ApiResult> {
        return this.request<ApiResult>("DELETE", `/api/assignments/${id}`);
    }

    async listAllocations(): Promise<ListResult<unknown>> {
        return this.request<ListResult<unknown>>("GET", "/api/allocations");
    }

    async getAllocation(id: string): Promise<GetResult<unknown>> {
        return this.request<GetResult<unknown>>("GET", `/api/allocations/${id}`);
    }

    async createAllocation(input: AllocationInput): Promise<ApiResult> {
        return this.request<ApiResult>("POST", "/api/allocations", input);
    }

    async updateAllocation(id: string, updates: Partial<AllocationInput>): Promise<ApiResult> {
        return this.request<ApiResult>("PUT", `/api/allocations/${id}`, updates);
    }

    async deleteAllocation(id: string): Promise<ApiResult> {
        return this.request<ApiResult>("DELETE", `/api/allocations/${id}`);
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

