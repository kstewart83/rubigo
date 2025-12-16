"use server";

/**
 * Server Actions for Project Management CRUD
 * 
 * These actions persist changes to the SQLite database.
 */

import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Generate a simple 6-char hex ID
function generateId(): string {
    return Math.random().toString(16).substring(2, 8);
}

// ============================================================================
// Services
// ============================================================================

export async function createServiceAction(
    service: Omit<schema.NewService, "id">
): Promise<schema.Service> {
    const id = generateId();
    const newService = { ...service, id };
    await db.insert(schema.services).values(newService);
    revalidatePath("/projects");
    return newService as schema.Service;
}

export async function updateServiceAction(
    id: string,
    updates: Partial<schema.NewService>
): Promise<schema.Service | null> {
    await db.update(schema.services).set(updates).where(eq(schema.services.id, id));
    const [updated] = await db.select().from(schema.services).where(eq(schema.services.id, id));
    revalidatePath("/projects");
    return updated ?? null;
}

export async function deleteServiceAction(id: string): Promise<void> {
    await db.delete(schema.services).where(eq(schema.services.id, id));
    revalidatePath("/projects");
}

export async function getAllServicesAction(): Promise<schema.Service[]> {
    return db.select().from(schema.services);
}

// ============================================================================
// Projects
// ============================================================================

export async function createProjectAction(
    project: Omit<schema.NewProject, "id">
): Promise<schema.Project> {
    const id = generateId();
    const newProject = { ...project, id };
    await db.insert(schema.projects).values(newProject);
    revalidatePath("/projects");
    return newProject as schema.Project;
}

export async function updateProjectAction(
    id: string,
    updates: Partial<schema.NewProject>
): Promise<schema.Project | null> {
    await db.update(schema.projects).set(updates).where(eq(schema.projects.id, id));
    const [updated] = await db.select().from(schema.projects).where(eq(schema.projects.id, id));
    revalidatePath("/projects");
    return updated ?? null;
}

export async function deleteProjectAction(id: string): Promise<void> {
    await db.delete(schema.projects).where(eq(schema.projects.id, id));
    revalidatePath("/projects");
}

export async function getAllProjectsAction(): Promise<schema.Project[]> {
    return db.select().from(schema.projects);
}

// ============================================================================
// Objectives
// ============================================================================

export async function createObjectiveAction(
    objective: Omit<schema.NewObjective, "id">
): Promise<schema.Objective> {
    const id = generateId();
    const newObjective = { ...objective, id };
    await db.insert(schema.objectives).values(newObjective);
    revalidatePath("/projects");
    return newObjective as schema.Objective;
}

export async function updateObjectiveAction(
    id: string,
    updates: Partial<schema.NewObjective>
): Promise<schema.Objective | null> {
    await db.update(schema.objectives).set(updates).where(eq(schema.objectives.id, id));
    const [updated] = await db.select().from(schema.objectives).where(eq(schema.objectives.id, id));
    revalidatePath("/projects");
    return updated ?? null;
}

export async function deleteObjectiveAction(id: string): Promise<void> {
    await db.delete(schema.objectives).where(eq(schema.objectives.id, id));
    revalidatePath("/projects");
}

export async function getAllObjectivesAction(): Promise<schema.Objective[]> {
    return db.select().from(schema.objectives);
}

// ============================================================================
// Features
// ============================================================================

export async function createFeatureAction(
    feature: Omit<schema.NewFeature, "id">
): Promise<schema.Feature> {
    const id = generateId();
    const newFeature = { ...feature, id };
    await db.insert(schema.features).values(newFeature);
    revalidatePath("/projects");
    return newFeature as schema.Feature;
}

export async function updateFeatureAction(
    id: string,
    updates: Partial<schema.NewFeature>
): Promise<schema.Feature | null> {
    await db.update(schema.features).set(updates).where(eq(schema.features.id, id));
    const [updated] = await db.select().from(schema.features).where(eq(schema.features.id, id));
    revalidatePath("/projects");
    return updated ?? null;
}

export async function deleteFeatureAction(id: string): Promise<void> {
    await db.delete(schema.features).where(eq(schema.features.id, id));
    revalidatePath("/projects");
}

export async function getAllFeaturesAction(): Promise<schema.Feature[]> {
    return db.select().from(schema.features);
}

// ============================================================================
// Metrics
// ============================================================================

export async function createMetricAction(
    metric: Omit<schema.NewMetric, "id">
): Promise<schema.Metric> {
    const id = generateId();
    const newMetric = { ...metric, id };
    await db.insert(schema.metrics).values(newMetric);
    revalidatePath("/projects");
    return newMetric as schema.Metric;
}

export async function updateMetricAction(
    id: string,
    updates: Partial<schema.NewMetric>
): Promise<schema.Metric | null> {
    await db.update(schema.metrics).set(updates).where(eq(schema.metrics.id, id));
    const [updated] = await db.select().from(schema.metrics).where(eq(schema.metrics.id, id));
    revalidatePath("/projects");
    return updated ?? null;
}

export async function deleteMetricAction(id: string): Promise<void> {
    await db.delete(schema.metrics).where(eq(schema.metrics.id, id));
    revalidatePath("/projects");
}

export async function getAllMetricsAction(): Promise<schema.Metric[]> {
    return db.select().from(schema.metrics);
}

// ============================================================================
// KPIs
// ============================================================================

export async function createKPIAction(
    kpi: Omit<schema.NewKPI, "id">
): Promise<schema.KPI> {
    const id = generateId();
    const newKPI = { ...kpi, id };
    await db.insert(schema.kpis).values(newKPI);
    revalidatePath("/projects");
    return newKPI as schema.KPI;
}

export async function updateKPIAction(
    id: string,
    updates: Partial<schema.NewKPI>
): Promise<schema.KPI | null> {
    await db.update(schema.kpis).set(updates).where(eq(schema.kpis.id, id));
    const [updated] = await db.select().from(schema.kpis).where(eq(schema.kpis.id, id));
    revalidatePath("/projects");
    return updated ?? null;
}

export async function deleteKPIAction(id: string): Promise<void> {
    await db.delete(schema.kpis).where(eq(schema.kpis.id, id));
    revalidatePath("/projects");
}

export async function getAllKPIsAction(): Promise<schema.KPI[]> {
    return db.select().from(schema.kpis);
}

// ============================================================================
// Initiatives
// ============================================================================

export async function createInitiativeAction(
    initiative: Omit<schema.NewInitiative, "id">
): Promise<schema.Initiative> {
    const id = generateId();
    const newInitiative = { ...initiative, id };
    await db.insert(schema.initiatives).values(newInitiative);
    revalidatePath("/projects");
    return newInitiative as schema.Initiative;
}

export async function updateInitiativeAction(
    id: string,
    updates: Partial<schema.NewInitiative>
): Promise<schema.Initiative | null> {
    await db.update(schema.initiatives).set(updates).where(eq(schema.initiatives.id, id));
    const [updated] = await db.select().from(schema.initiatives).where(eq(schema.initiatives.id, id));
    revalidatePath("/projects");
    return updated ?? null;
}

export async function deleteInitiativeAction(id: string): Promise<void> {
    await db.delete(schema.initiatives).where(eq(schema.initiatives.id, id));
    revalidatePath("/projects");
}

export async function getAllInitiativesAction(): Promise<schema.Initiative[]> {
    return db.select().from(schema.initiatives);
}

// ============================================================================
// Activities
// ============================================================================

export async function createActivityAction(
    activity: Omit<schema.NewActivity, "id">
): Promise<schema.Activity> {
    const id = generateId();
    const newActivity = { ...activity, id };
    await db.insert(schema.activities).values(newActivity);
    revalidatePath("/projects");
    return newActivity as schema.Activity;
}

export async function updateActivityAction(
    id: string,
    updates: Partial<schema.NewActivity>
): Promise<schema.Activity | null> {
    await db.update(schema.activities).set(updates).where(eq(schema.activities.id, id));
    const [updated] = await db.select().from(schema.activities).where(eq(schema.activities.id, id));
    revalidatePath("/projects");
    return updated ?? null;
}

export async function deleteActivityAction(id: string): Promise<void> {
    await db.delete(schema.activities).where(eq(schema.activities.id, id));
    revalidatePath("/projects");
}

export async function getAllActivitiesAction(): Promise<schema.Activity[]> {
    return db.select().from(schema.activities);
}

// ============================================================================
// Roles
// ============================================================================

export async function createRoleAction(
    role: Omit<schema.NewRole, "id">
): Promise<schema.Role> {
    const id = generateId();
    const newRole = { ...role, id };
    await db.insert(schema.roles).values(newRole);
    revalidatePath("/projects");
    return newRole as schema.Role;
}

export async function updateRoleAction(
    id: string,
    updates: Partial<schema.NewRole>
): Promise<schema.Role | null> {
    await db.update(schema.roles).set(updates).where(eq(schema.roles.id, id));
    const [updated] = await db.select().from(schema.roles).where(eq(schema.roles.id, id));
    revalidatePath("/projects");
    return updated ?? null;
}

export async function deleteRoleAction(id: string): Promise<void> {
    await db.delete(schema.roles).where(eq(schema.roles.id, id));
    revalidatePath("/projects");
}

export async function getAllRolesAction(): Promise<schema.Role[]> {
    return db.select().from(schema.roles);
}

// ============================================================================
// Assignments
// ============================================================================

export async function createAssignmentAction(
    assignment: Omit<schema.NewAssignment, "id">
): Promise<schema.Assignment> {
    const id = generateId();
    const newAssignment = { ...assignment, id };
    await db.insert(schema.assignments).values(newAssignment);
    revalidatePath("/projects");
    return newAssignment as schema.Assignment;
}

export async function updateAssignmentAction(
    id: string,
    updates: Partial<schema.NewAssignment>
): Promise<schema.Assignment | null> {
    await db.update(schema.assignments).set(updates).where(eq(schema.assignments.id, id));
    const [updated] = await db.select().from(schema.assignments).where(eq(schema.assignments.id, id));
    revalidatePath("/projects");
    return updated ?? null;
}

export async function deleteAssignmentAction(id: string): Promise<void> {
    await db.delete(schema.assignments).where(eq(schema.assignments.id, id));
    revalidatePath("/projects");
}

export async function getAllAssignmentsAction(): Promise<schema.Assignment[]> {
    return db.select().from(schema.assignments);
}

// ============================================================================
// Allocations
// ============================================================================

export async function createAllocationAction(
    allocation: Omit<schema.NewAllocation, "id">
): Promise<schema.Allocation> {
    const id = generateId();
    const newAllocation = { ...allocation, id };
    await db.insert(schema.allocations).values(newAllocation);
    revalidatePath("/projects");
    return newAllocation as schema.Allocation;
}

export async function updateAllocationAction(
    id: string,
    updates: Partial<schema.NewAllocation>
): Promise<schema.Allocation | null> {
    await db.update(schema.allocations).set(updates).where(eq(schema.allocations.id, id));
    const [updated] = await db.select().from(schema.allocations).where(eq(schema.allocations.id, id));
    revalidatePath("/projects");
    return updated ?? null;
}

export async function deleteAllocationAction(id: string): Promise<void> {
    await db.delete(schema.allocations).where(eq(schema.allocations.id, id));
    revalidatePath("/projects");
}

export async function getAllAllocationsAction(): Promise<schema.Allocation[]> {
    return db.select().from(schema.allocations);
}

// ============================================================================
// Action Logs (Audit Trail)
// ============================================================================

export async function createActionLogAction(
    log: Omit<schema.NewActionLog, "id">
): Promise<schema.ActionLog> {
    const id = generateId();
    const newLog = { ...log, id };
    await db.insert(schema.actionLogs).values(newLog);
    return newLog as schema.ActionLog;
}

export async function getAllActionLogsAction(): Promise<schema.ActionLog[]> {
    return db.select().from(schema.actionLogs).orderBy(schema.actionLogs.timestamp);
}

// ============================================================================
// Bulk Load (for initial page load)
// ============================================================================

export async function getAllProjectDataAction() {
    const [
        services,
        projects,
        objectives,
        features,
        metrics,
        kpis,
        initiatives,
        activities,
        roles,
        assignments,
        allocations,
    ] = await Promise.all([
        db.select().from(schema.services),
        db.select().from(schema.projects),
        db.select().from(schema.objectives),
        db.select().from(schema.features),
        db.select().from(schema.metrics),
        db.select().from(schema.kpis),
        db.select().from(schema.initiatives),
        db.select().from(schema.activities),
        db.select().from(schema.roles),
        db.select().from(schema.assignments),
        db.select().from(schema.allocations),
    ]);

    return {
        description: { overview: "Loaded from SQLite database" },
        services,
        projects,
        objectives,
        features,
        metrics,
        kpis,
        initiatives,
        activities,
        roles,
        assignments,
        allocations,
    };
}
