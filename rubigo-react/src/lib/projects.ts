/**
 * Project Data Library
 * 
 * Server-side data access for the project management module.
 * Reads from SQLite database (seeded from TOML).
 * Updated for the full Requirements & Delivery Ontology.
 */

import { db } from "@/db";
import * as schema from "@/db/schema";
import type {
    ProjectData,
    Solution,
    Product,
    Service,
    Release,
    SolutionView,
    Project,
    Objective,
    Feature,
    Rule,
    Scenario,
    Specification,
    Evidence,
    Evaluation,
    Metric,
    KPI,
    Initiative,
    Activity,
    Role,
    Assignment,
    Allocation,
    KPIWithMetric,
    AssignmentWithCapacity,
    ObjectiveTreeNode,
    FeatureWithRequirements,
} from "@/types/project";

// ============================================================================
// Data Loading from SQLite
// ============================================================================

/**
 * Load all project data from SQLite database
 */
export function getProjectData(): ProjectData {
    // Load all entities from SQLite
    const solutionsRaw = db.select().from(schema.solutions).all();
    const productsRaw = db.select().from(schema.products).all();
    const servicesRaw = db.select().from(schema.services).all();
    const releasesRaw = db.select().from(schema.releases).all();
    const projectsRaw = db.select().from(schema.projects).all();
    const objectivesRaw = db.select().from(schema.objectives).all();
    const featuresRaw = db.select().from(schema.features).all();
    const rulesRaw = db.select().from(schema.rules).all();
    const scenariosRaw = db.select().from(schema.scenarios).all();
    const specificationsRaw = db.select().from(schema.specifications).all();
    const evidencesRaw = db.select().from(schema.evidences).all();
    const evaluationsRaw = db.select().from(schema.evaluations).all();
    const metricsRaw = db.select().from(schema.metrics).all();
    const kpisRaw = db.select().from(schema.kpis).all();
    const initiativesRaw = db.select().from(schema.initiatives).all();
    const activitiesRaw = db.select().from(schema.activities).all();
    const rolesRaw = db.select().from(schema.roles).all();
    const assignmentsRaw = db.select().from(schema.assignments).all();
    const allocationsRaw = db.select().from(schema.allocations).all();

    // Build SolutionViews for UI compatibility
    const productBySolution = new Map(productsRaw.map(p => [p.solutionId, p]));
    const serviceBySolution = new Map(servicesRaw.map(s => [s.solutionId, s]));

    const solutionViews: SolutionView[] = solutionsRaw.map(solution => {
        const product = productBySolution.get(solution.id);
        const service = serviceBySolution.get(solution.id);

        return {
            id: solution.id,
            name: solution.name,
            description: solution.description ?? undefined,
            status: (solution.status ?? "catalog") as SolutionView["status"],
            isProduct: !!product,
            isService: !!service,
            productId: product?.id,
            version: product?.version ?? undefined,
            productReleaseDate: product?.releaseDate ?? undefined,
            serviceId: service?.id,
            serviceLevel: service?.serviceLevel ?? undefined,
        };
    });

    // Transform to expected types
    return {
        description: { overview: "Loaded from SQLite database" },
        // Solution Space
        solutions: solutionsRaw.map((s): Solution => ({
            id: s.id,
            name: s.name,
            description: s.description ?? undefined,
            status: (s.status ?? "catalog") as Solution["status"],
        })),
        products: productsRaw.map((p): Product => ({
            id: p.id,
            solutionId: p.solutionId,
            version: p.version ?? undefined,
            releaseDate: p.releaseDate ?? undefined,
        })),
        services: servicesRaw.map((s): Service => ({
            id: s.id,
            solutionId: s.solutionId,
            serviceLevel: s.serviceLevel ?? undefined,
        })),
        releases: releasesRaw.map((r): Release => ({
            id: r.id,
            productId: r.productId,
            version: r.version,
            releaseDate: r.releaseDate ?? undefined,
            notes: r.notes ?? undefined,
            status: (r.status ?? "planned") as Release["status"],
        })),
        // UI Compatibility
        solutionViews,
        // Projects & Objectives
        projects: projectsRaw.map((p): Project => ({
            id: p.id,
            name: p.name,
            description: p.description ?? undefined,
            solutionId: p.solutionId ?? "",
            status: (p.status ?? "planning") as Project["status"],
            startDate: p.startDate ?? undefined,
            endDate: p.endDate ?? undefined,
        })),
        objectives: objectivesRaw.map((o): Objective => ({
            id: o.id,
            title: o.title,
            description: o.description ?? undefined,
            projectId: o.projectId ?? "",
            parentId: o.parentId ?? undefined,
            status: (o.status ?? "draft") as Objective["status"],
        })),
        // Requirements Space
        features: featuresRaw.map((f): Feature => ({
            id: f.id,
            name: f.name,
            description: f.description ?? undefined,
            objectiveId: f.objectiveId ?? "",
            status: (f.status ?? "planned") as Feature["status"],
        })),
        rules: rulesRaw.map((r): Rule => ({
            id: r.id,
            featureId: r.featureId,
            role: r.role,
            requirement: r.requirement,
            reason: r.reason,
            status: (r.status ?? "draft") as Rule["status"],
        })),
        scenarios: scenariosRaw.map((s): Scenario => ({
            id: s.id,
            ruleId: s.ruleId,
            name: s.name,
            narrative: s.narrative,
            status: (s.status ?? "draft") as Scenario["status"],
        })),
        specifications: specificationsRaw.map((s): Specification => ({
            id: s.id,
            featureId: s.featureId,
            name: s.name,
            narrative: s.narrative,
            category: s.category as Specification["category"],
            status: (s.status ?? "draft") as Specification["status"],
        })),
        // Verification Space
        evidences: evidencesRaw.map((e): Evidence => ({
            id: e.id,
            releaseId: e.releaseId,
            scenarioId: e.scenarioId ?? undefined,
            specificationId: e.specificationId ?? undefined,
            type: e.type as Evidence["type"],
            artifactUrl: e.artifactUrl ?? undefined,
            capturedAt: e.capturedAt,
        })),
        evaluations: evaluationsRaw.map((e): Evaluation => ({
            id: e.id,
            evidenceId: e.evidenceId,
            verdict: e.verdict as Evaluation["verdict"],
            evaluatorId: e.evaluatorId ?? undefined,
            evaluatedAt: e.evaluatedAt,
            notes: e.notes ?? undefined,
        })),
        // Strategy Cascade
        metrics: metricsRaw.map((m): Metric => ({
            id: m.id,
            name: m.name,
            description: m.description ?? undefined,
            unit: m.unit,
            currentValue: m.currentValue ?? undefined,
            source: m.source ?? undefined,
        })),
        kpis: kpisRaw.map((k): KPI => ({
            id: k.id,
            metricId: k.metricId,
            objectiveId: k.objectiveId ?? undefined,
            targetValue: k.targetValue,
            direction: k.direction as KPI["direction"],
            thresholdWarning: k.thresholdWarning ?? undefined,
            thresholdCritical: k.thresholdCritical ?? undefined,
        })),
        initiatives: initiativesRaw.map((i): Initiative => ({
            id: i.id,
            name: i.name,
            description: i.description ?? undefined,
            kpiId: i.kpiId ?? "",
            status: (i.status ?? "planned") as Initiative["status"],
            startDate: i.startDate ?? undefined,
            endDate: i.endDate ?? undefined,
        })),
        // Activity Space
        activities: activitiesRaw.map((a): Activity => ({
            id: a.id,
            name: a.name,
            description: a.description ?? undefined,
            parentId: a.parentId ?? undefined,
            initiativeId: a.initiativeId ?? undefined,
            blockedBy: a.blockedBy ? JSON.parse(a.blockedBy) : undefined,
            status: (a.status ?? "backlog") as Activity["status"],
        })),
        roles: rolesRaw.map((r): Role => ({
            id: r.id,
            name: r.name,
            description: r.description ?? undefined,
        })),
        assignments: assignmentsRaw.map((a): Assignment => ({
            id: a.id,
            activityId: a.activityId,
            roleId: a.roleId,
            quantity: a.quantity,
            unit: a.unit ?? "fte",
            raciType: (a.raciType ?? "responsible") as Assignment["raciType"],
        })),
        allocations: allocationsRaw.map((a): Allocation => ({
            id: a.id,
            assignmentId: a.assignmentId,
            personId: a.personId,
            quantityContributed: a.quantityContributed,
            startDate: a.startDate ?? undefined,
            endDate: a.endDate ?? undefined,
        })),
    };
}

// ============================================================================
// Basic Accessors
// ============================================================================

export function getAllSolutionViews(): SolutionView[] {
    return getProjectData().solutionViews;
}

export function getSolutionViewById(id: string): SolutionView | undefined {
    return getAllSolutionViews().find((s) => s.id === id);
}

export function getAllProjects(): Project[] {
    return getProjectData().projects;
}

export function getProjectById(id: string): Project | undefined {
    return getAllProjects().find((p) => p.id === id);
}

export function getProjectsBySolution(solutionId: string): Project[] {
    return getAllProjects().filter((p) => p.solutionId === solutionId);
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

export function getFeatureById(id: string): Feature | undefined {
    return getAllFeatures().find((f) => f.id === id);
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

export function getKPIById(id: string): KPI | undefined {
    return getAllKPIs().find((k) => k.id === id);
}

export function getKPIsByObjective(objectiveId: string): KPI[] {
    return getAllKPIs().filter((k) => k.objectiveId === objectiveId);
}

export function getAllInitiatives(): Initiative[] {
    return getProjectData().initiatives;
}

export function getInitiativeById(id: string): Initiative | undefined {
    return getAllInitiatives().find((i) => i.id === id);
}

export function getInitiativesByKPI(kpiId: string): Initiative[] {
    return getAllInitiatives().filter((i) => i.kpiId === kpiId);
}

export function getAllActivities(): Activity[] {
    return getProjectData().activities;
}

export function getActivityById(id: string): Activity | undefined {
    return getAllActivities().find((a) => a.id === id);
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

export function getAssignmentById(id: string): Assignment | undefined {
    return getAllAssignments().find((a) => a.id === id);
}

export function getAllAllocations(): Allocation[] {
    return getProjectData().allocations;
}

export function getAllocationById(id: string): Allocation | undefined {
    return getAllAllocations().find((a) => a.id === id);
}

// ============================================================================
// Derived/Computed Data
// ============================================================================

export function getKPIWithMetric(kpi: KPI): KPIWithMetric {
    const metric = getMetricById(kpi.metricId);
    if (!metric) {
        throw new Error(`Metric ${kpi.metricId} not found for KPI ${kpi.id}`);
    }

    const currentValue = metric.currentValue ?? 0;
    const percentComplete =
        kpi.direction === "maintain"
            ? 100
            : kpi.direction === "decrease"
                ? currentValue <= kpi.targetValue
                    ? 100
                    : Math.max(0, 100 - ((currentValue - kpi.targetValue) / kpi.targetValue) * 100)
                : currentValue >= kpi.targetValue
                    ? 100
                    : (currentValue / kpi.targetValue) * 100;

    return {
        ...kpi,
        metric,
        objective: kpi.objectiveId ? getObjectiveById(kpi.objectiveId) : undefined,
        currentValue,
        percentComplete,
    };
}

export function getAllKPIsWithMetrics(): KPIWithMetric[] {
    return getAllKPIs().map(getKPIWithMetric);
}

export function getAssignmentWithCapacity(assignment: Assignment): AssignmentWithCapacity {
    const role = getRoleById(assignment.roleId);
    const activity = getActivityById(assignment.activityId);

    if (!role) throw new Error(`Role ${assignment.roleId} not found`);
    if (!activity) throw new Error(`Activity ${assignment.activityId} not found`);

    const allocations = getAllAllocations().filter(
        (a) => a.assignmentId === assignment.id
    );
    const totalAllocated = allocations.reduce(
        (sum, a) => sum + a.quantityContributed,
        0
    );
    const capacityGap = Math.max(0, assignment.quantity - totalAllocated);

    return {
        ...assignment,
        role,
        activity,
        allocations,
        totalAllocated,
        capacityGap,
    };
}

export function getAllAssignmentsWithCapacity(): AssignmentWithCapacity[] {
    return getAllAssignments().map(getAssignmentWithCapacity);
}

export function getUnderResourcedAssignments(): AssignmentWithCapacity[] {
    return getAllAssignmentsWithCapacity().filter((a) => a.capacityGap > 0);
}

export function getObjectiveTree(projectId: string): ObjectiveTreeNode[] {
    const data = getProjectData();
    const objectives = data.objectives.filter((o) => o.projectId === projectId);
    const features = data.features;
    const rules = data.rules;
    const scenarios = data.scenarios;
    const specifications = data.specifications;
    const kpis = data.kpis;

    const roots = objectives.filter((o) => !o.parentId);

    function buildNode(objective: Objective): ObjectiveTreeNode {
        const children = objectives
            .filter((o) => o.parentId === objective.id)
            .map(buildNode);

        const objectiveFeatures: FeatureWithRequirements[] = features
            .filter((f) => f.objectiveId === objective.id)
            .map((f) => {
                const featureRules = rules.filter((r) => r.featureId === f.id);
                const featureSpecs = specifications.filter((s) => s.featureId === f.id);

                return {
                    ...f,
                    rules: featureRules.map((r) => ({
                        ...r,
                        scenarios: scenarios.filter((s) => s.ruleId === r.id),
                        narrative: `As a ${r.role}, I want to ${r.requirement}, so I can ${r.reason}`,
                    })),
                    specifications: featureSpecs,
                };
            });

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
