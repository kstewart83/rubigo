import { parse } from "@iarna/toml";
import { readFileSync } from "fs";
import { join } from "path";
import type {
    ProjectData,
    Service,
    Project,
    Objective,
    Feature,
    Metric,
    KPI,
    Initiative,
    Activity,
    Role,
    Assignment,
    Allocation,
    ServiceStatus,
    ProjectStatus,
    ObjectiveStatus,
    FeatureStatus,
    InitiativeStatus,
    ActivityStatus,
    KPIDirection,
    RACIType,
    KPIWithMetric,
    AssignmentWithCapacity,
    ObjectiveTreeNode,
} from "@/types/project";

// ============================================================================
// Raw TOML Types (snake_case as stored in file)
// ============================================================================

interface RawService {
    id: string;
    name: string;
    description?: string;
    status?: string;
    is_product?: boolean;
    is_service?: boolean;
}

interface RawProject {
    id: string;
    name: string;
    description?: string;
    service_id: string;
    status?: string;
    start_date?: string;
    end_date?: string;
}

interface RawObjective {
    id: string;
    title: string;
    description?: string;
    project_id: string;
    parent_id?: string;
    status?: string;
}

interface RawFeature {
    id: string;
    name: string;
    description?: string;
    objective_id: string;
    status?: string;
}

interface RawMetric {
    id: string;
    name: string;
    description?: string;
    unit: string;
    current_value?: number;
    source?: string;
}

interface RawKPI {
    id: string;
    metric_id: string;
    objective_id?: string;
    target_value: number;
    direction: string;
    threshold_warning?: number;
    threshold_critical?: number;
}

interface RawInitiative {
    id: string;
    name: string;
    description?: string;
    kpi_id: string;
    status?: string;
    start_date?: string;
    end_date?: string;
}

interface RawActivity {
    id: string;
    name: string;
    description?: string;
    parent_id?: string;
    initiative_id?: string;
    blocked_by?: string[];
    status?: string;
}

interface RawRole {
    id: string;
    name: string;
    description?: string;
}

interface RawAssignment {
    id: string;
    activity_id: string;
    role_id: string;
    quantity: number;
    unit?: string;
    raci_type?: string;
}

interface RawAllocation {
    id: string;
    assignment_id: string;
    person_id: string;
    quantity_contributed: number;
    start_date?: string;
    end_date?: string;
}

interface RawProjectData {
    description?: {
        overview?: string;
    };
    services?: RawService[];
    projects?: RawProject[];
    objectives?: RawObjective[];
    features?: RawFeature[];
    metrics?: RawMetric[];
    kpis?: RawKPI[];
    initiatives?: RawInitiative[];
    activities?: RawActivity[];
    roles?: RawRole[];
    assignments?: RawAssignment[];
    allocations?: RawAllocation[];
}

// ============================================================================
// Data Loading & Caching
// ============================================================================

let cachedData: ProjectData | null = null;

/**
 * Load and parse project data from TOML file
 */
export function getProjectData(): ProjectData {
    if (cachedData) {
        return cachedData;
    }

    const dataPath = join(process.cwd(), "src/data/projects.toml");
    const content = readFileSync(dataPath, "utf-8");
    const raw = parse(content) as unknown as RawProjectData;

    // Transform to camelCase and proper types
    cachedData = {
        description: {
            overview: raw.description?.overview ?? "",
        },
        services: (raw.services ?? []).map((s): Service => ({
            id: s.id,
            name: s.name,
            description: s.description,
            status: (s.status ?? "catalog") as ServiceStatus,
            isProduct: s.is_product ?? false,
            isService: s.is_service ?? false,
        })),
        projects: (raw.projects ?? []).map((p): Project => ({
            id: p.id,
            name: p.name,
            description: p.description,
            serviceId: p.service_id,
            status: (p.status ?? "planning") as ProjectStatus,
            startDate: p.start_date,
            endDate: p.end_date,
        })),
        objectives: (raw.objectives ?? []).map((o): Objective => ({
            id: o.id,
            title: o.title,
            description: o.description,
            projectId: o.project_id,
            parentId: o.parent_id,
            status: (o.status ?? "draft") as ObjectiveStatus,
        })),
        features: (raw.features ?? []).map((f): Feature => ({
            id: f.id,
            name: f.name,
            description: f.description,
            objectiveId: f.objective_id,
            status: (f.status ?? "planned") as FeatureStatus,
        })),
        metrics: (raw.metrics ?? []).map((m): Metric => ({
            id: m.id,
            name: m.name,
            description: m.description,
            unit: m.unit,
            currentValue: m.current_value,
            source: m.source,
        })),
        kpis: (raw.kpis ?? []).map((k): KPI => ({
            id: k.id,
            metricId: k.metric_id,
            objectiveId: k.objective_id,
            targetValue: k.target_value,
            direction: k.direction as KPIDirection,
            thresholdWarning: k.threshold_warning,
            thresholdCritical: k.threshold_critical,
        })),
        initiatives: (raw.initiatives ?? []).map((i): Initiative => ({
            id: i.id,
            name: i.name,
            description: i.description,
            kpiId: i.kpi_id,
            status: (i.status ?? "planned") as InitiativeStatus,
            startDate: i.start_date,
            endDate: i.end_date,
        })),
        activities: (raw.activities ?? []).map((a): Activity => ({
            id: a.id,
            name: a.name,
            description: a.description,
            parentId: a.parent_id,
            initiativeId: a.initiative_id,
            blockedBy: a.blocked_by,
            status: (a.status ?? "backlog") as ActivityStatus,
        })),
        roles: (raw.roles ?? []).map((r): Role => ({
            id: r.id,
            name: r.name,
            description: r.description,
        })),
        assignments: (raw.assignments ?? []).map((a): Assignment => ({
            id: a.id,
            activityId: a.activity_id,
            roleId: a.role_id,
            quantity: a.quantity,
            unit: a.unit ?? "fte",
            raciType: (a.raci_type ?? "responsible") as RACIType,
        })),
        allocations: (raw.allocations ?? []).map((a): Allocation => ({
            id: a.id,
            assignmentId: a.assignment_id,
            personId: a.person_id,
            quantityContributed: a.quantity_contributed,
            startDate: a.start_date,
            endDate: a.end_date,
        })),
    };

    return cachedData;
}

// ============================================================================
// Basic Accessors
// ============================================================================

export function getAllServices(): Service[] {
    return getProjectData().services;
}

export function getServiceById(id: string): Service | undefined {
    return getAllServices().find((s) => s.id === id);
}

export function getAllProjects(): Project[] {
    return getProjectData().projects;
}

export function getProjectById(id: string): Project | undefined {
    return getAllProjects().find((p) => p.id === id);
}

export function getProjectsByService(serviceId: string): Project[] {
    return getAllProjects().filter((p) => p.serviceId === serviceId);
}

export function getAllObjectives(): Objective[] {
    return getProjectData().objectives;
}

export function getObjectiveById(id: string): Objective | undefined {
    return getAllObjectives().find((o) => o.id === id);
}

export function getObjectivesByProject(projectId: string): Objective[] {
    return getAllObjectives().filter((o) => o.projectId === projectId);
}

export function getAllFeatures(): Feature[] {
    return getProjectData().features;
}

export function getFeaturesByObjective(objectiveId: string): Feature[] {
    return getAllFeatures().filter((f) => f.objectiveId === objectiveId);
}

export function getAllMetrics(): Metric[] {
    return getProjectData().metrics;
}

export function getMetricById(id: string): Metric | undefined {
    return getAllMetrics().find((m) => m.id === id);
}

export function getAllKPIs(): KPI[] {
    return getProjectData().kpis;
}

export function getKPIsByObjective(objectiveId: string): KPI[] {
    return getAllKPIs().filter((k) => k.objectiveId === objectiveId);
}

export function getAllInitiatives(): Initiative[] {
    return getProjectData().initiatives;
}

export function getInitiativesByKPI(kpiId: string): Initiative[] {
    return getAllInitiatives().filter((i) => i.kpiId === kpiId);
}

export function getAllActivities(): Activity[] {
    return getProjectData().activities;
}

export function getActivitiesByInitiative(initiativeId: string): Activity[] {
    return getAllActivities().filter((a) => a.initiativeId === initiativeId);
}

export function getAllRoles(): Role[] {
    return getProjectData().roles;
}

export function getRoleById(id: string): Role | undefined {
    return getAllRoles().find((r) => r.id === id);
}

export function getAllAssignments(): Assignment[] {
    return getProjectData().assignments;
}

export function getAssignmentsByActivity(activityId: string): Assignment[] {
    return getAllAssignments().filter((a) => a.activityId === activityId);
}

export function getAllAllocations(): Allocation[] {
    return getProjectData().allocations;
}

export function getAllocationsByAssignment(assignmentId: string): Allocation[] {
    return getAllAllocations().filter((a) => a.assignmentId === assignmentId);
}

// ============================================================================
// Computed Data Helpers
// ============================================================================

/**
 * Get KPI with resolved Metric data and progress calculation
 */
export function getKPIWithMetric(kpi: KPI): KPIWithMetric {
    const metric = getMetricById(kpi.metricId);
    const objective = kpi.objectiveId ? getObjectiveById(kpi.objectiveId) : undefined;

    let percentComplete: number | undefined;
    if (metric?.currentValue !== undefined) {
        const current = metric.currentValue;
        const target = kpi.targetValue;

        if (kpi.direction === "increase") {
            // For increase: 0 → target = 0% → 100%
            percentComplete = Math.min(100, (current / target) * 100);
        } else if (kpi.direction === "decrease") {
            // For decrease: high → target = 0% → 100%
            // Assume starting point is 2x target if not specified
            const startValue = (kpi.thresholdCritical ?? target * 2);
            const progress = startValue - current;
            const totalNeeded = startValue - target;
            percentComplete = Math.min(100, Math.max(0, (progress / totalNeeded) * 100));
        } else {
            // For maintain: if at target, 100%
            percentComplete = current === target ? 100 : Math.max(0, 100 - Math.abs(current - target));
        }
    }

    return {
        ...kpi,
        metric: metric!,
        objective,
        currentValue: metric?.currentValue,
        percentComplete,
    };
}

/**
 * Get all KPIs with resolved Metric data
 */
export function getAllKPIsWithMetrics(): KPIWithMetric[] {
    return getAllKPIs().map(getKPIWithMetric);
}

/**
 * Get Assignment with capacity gap calculation
 */
export function getAssignmentWithCapacity(assignment: Assignment): AssignmentWithCapacity {
    const role = getRoleById(assignment.roleId);
    const activity = getAllActivities().find((a) => a.id === assignment.activityId);
    const allocations = getAllocationsByAssignment(assignment.id);

    const totalAllocated = allocations.reduce((sum, a) => sum + a.quantityContributed, 0);
    const capacityGap = assignment.quantity - totalAllocated;

    return {
        ...assignment,
        role: role!,
        activity: activity!,
        allocations,
        totalAllocated,
        capacityGap,
    };
}

/**
 * Get all assignments with capacity gaps
 */
export function getAllAssignmentsWithCapacity(): AssignmentWithCapacity[] {
    return getAllAssignments().map(getAssignmentWithCapacity);
}

/**
 * Get assignments that are under-resourced (capacity gap > 0)
 */
export function getUnderResourcedAssignments(): AssignmentWithCapacity[] {
    return getAllAssignmentsWithCapacity().filter((a) => a.capacityGap > 0);
}

/**
 * Build objective tree for hierarchical display
 */
export function getObjectiveTree(projectId: string): ObjectiveTreeNode[] {
    const objectives = getObjectivesByProject(projectId);
    const features = getAllFeatures();
    const kpis = getAllKPIs();

    // Build lookup maps
    const objectiveMap = new Map<string, Objective>(objectives.map((o) => [o.id, o]));

    // Find root objectives (no parent)
    const roots = objectives.filter((o) => !o.parentId);

    function buildNode(objective: Objective): ObjectiveTreeNode {
        const children = objectives
            .filter((o) => o.parentId === objective.id)
            .map(buildNode);

        const objectiveFeatures = features.filter((f) => f.objectiveId === objective.id);
        const objectiveKPIs = kpis
            .filter((k) => k.objectiveId === objective.id)
            .map(getKPIWithMetric);

        return {
            ...objective,
            children,
            features: objectiveFeatures,
            kpis: objectiveKPIs,
        };
    }

    return roots.map(buildNode);
}
