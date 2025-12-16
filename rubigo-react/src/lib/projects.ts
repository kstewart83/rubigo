/**
 * Project Data Library
 * 
 * Server-side data access for the project management module.
 * Reads from SQLite database (seeded from TOML).
 */

import { db } from "@/db";
import * as schema from "@/db/schema";
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
    KPIWithMetric,
    AssignmentWithCapacity,
    ObjectiveTreeNode,
} from "@/types/project";

// ============================================================================
// Data Loading from SQLite
// ============================================================================

/**
 * Load all project data from SQLite database
 */
export function getProjectData(): ProjectData {
    // Load all entities from SQLite
    const servicesRaw = db.select().from(schema.services).all();
    const projectsRaw = db.select().from(schema.projects).all();
    const objectivesRaw = db.select().from(schema.objectives).all();
    const featuresRaw = db.select().from(schema.features).all();
    const metricsRaw = db.select().from(schema.metrics).all();
    const kpisRaw = db.select().from(schema.kpis).all();
    const initiativesRaw = db.select().from(schema.initiatives).all();
    const activitiesRaw = db.select().from(schema.activities).all();
    const rolesRaw = db.select().from(schema.roles).all();
    const assignmentsRaw = db.select().from(schema.assignments).all();
    const allocationsRaw = db.select().from(schema.allocations).all();

    // Transform to expected types (handle any column name differences)
    return {
        description: { overview: "Loaded from SQLite database" },
        services: servicesRaw.map((s): Service => ({
            id: s.id,
            name: s.name,
            description: s.description ?? undefined,
            status: s.status as Service["status"],
            isProduct: s.isProduct ?? false,
            isService: s.isService ?? false,
        })),
        projects: projectsRaw.map((p): Project => ({
            id: p.id,
            name: p.name,
            description: p.description ?? undefined,
            serviceId: p.serviceId ?? "",
            status: p.status as Project["status"],
            startDate: p.startDate ?? undefined,
            endDate: p.endDate ?? undefined,
        })),
        objectives: objectivesRaw.map((o): Objective => ({
            id: o.id,
            title: o.title,
            description: o.description ?? undefined,
            projectId: o.projectId ?? "",
            parentId: o.parentId ?? undefined,
            status: o.status as Objective["status"],
        })),
        features: featuresRaw.map((f): Feature => ({
            id: f.id,
            name: f.name,
            description: f.description ?? undefined,
            objectiveId: f.objectiveId ?? "",
            status: f.status as Feature["status"],
        })),
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
            status: i.status as Initiative["status"],
            startDate: i.startDate ?? undefined,
            endDate: i.endDate ?? undefined,
        })),
        activities: activitiesRaw.map((a): Activity => ({
            id: a.id,
            name: a.name,
            description: a.description ?? undefined,
            parentId: a.parentId ?? undefined,
            initiativeId: a.initiativeId ?? undefined,
            blockedBy: a.blockedBy ? JSON.parse(a.blockedBy) : undefined,
            status: a.status as Activity["status"],
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
            raciType: a.raciType as Assignment["raciType"],
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

export function getKPIWithMetric(kpi: KPI): KPIWithMetric {
    const metric = getMetricById(kpi.metricId);
    const objective = kpi.objectiveId ? getObjectiveById(kpi.objectiveId) : undefined;

    let percentComplete: number | undefined;
    if (metric?.currentValue !== undefined) {
        const current = metric.currentValue;
        const target = kpi.targetValue;

        if (kpi.direction === "increase") {
            percentComplete = Math.min(100, (current / target) * 100);
        } else if (kpi.direction === "decrease") {
            const startValue = (kpi.thresholdCritical ?? target * 2);
            const progress = startValue - current;
            const totalNeeded = startValue - target;
            percentComplete = Math.min(100, Math.max(0, (progress / totalNeeded) * 100));
        } else {
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

export function getAllKPIsWithMetrics(): KPIWithMetric[] {
    return getAllKPIs().map(getKPIWithMetric);
}

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

export function getAllAssignmentsWithCapacity(): AssignmentWithCapacity[] {
    return getAllAssignments().map(getAssignmentWithCapacity);
}

export function getUnderResourcedAssignments(): AssignmentWithCapacity[] {
    return getAllAssignmentsWithCapacity().filter((a) => a.capacityGap > 0);
}

export function getObjectiveTree(projectId: string): ObjectiveTreeNode[] {
    const objectives = getObjectivesByProject(projectId);
    const features = getAllFeatures();
    const kpis = getAllKPIs();

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
