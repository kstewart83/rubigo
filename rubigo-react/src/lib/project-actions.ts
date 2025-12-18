"use server";

/**
 * Server Actions for Project Management CRUD
 * 
 * These actions persist changes to the SQLite database.
 * Updated for the full Requirements & Delivery Ontology.
 */

import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { SolutionView } from "@/types/project";

// Generate a simple 6-char hex ID
function generateId(): string {
    return Math.random().toString(16).substring(2, 8);
}

// ============================================================================
// Solutions
// ============================================================================

export async function createSolutionAction(
    solution: Omit<schema.NewSolution, "id">
): Promise<schema.Solution> {
    const id = generateId();
    const newSolution = { ...solution, id };
    await db.insert(schema.solutions).values(newSolution);
    revalidatePath("/projects");
    return newSolution as schema.Solution;
}

export async function updateSolutionAction(
    id: string,
    updates: Partial<schema.NewSolution>
): Promise<schema.Solution | null> {
    await db.update(schema.solutions).set(updates).where(eq(schema.solutions.id, id));
    const [updated] = await db.select().from(schema.solutions).where(eq(schema.solutions.id, id));
    revalidatePath("/projects");
    return updated ?? null;
}

export async function deleteSolutionAction(id: string): Promise<void> {
    // Delete related products and services first
    await db.delete(schema.products).where(eq(schema.products.solutionId, id));
    await db.delete(schema.services).where(eq(schema.services.solutionId, id));
    await db.delete(schema.solutions).where(eq(schema.solutions.id, id));
    revalidatePath("/projects");
}

export async function getAllSolutionsAction(): Promise<schema.Solution[]> {
    return db.select().from(schema.solutions);
}

// ============================================================================
// Products
// ============================================================================

export async function createProductAction(
    product: Omit<schema.NewProduct, "id">
): Promise<schema.Product> {
    const id = generateId();
    const newProduct = { ...product, id };
    await db.insert(schema.products).values(newProduct);
    revalidatePath("/projects");
    return newProduct as schema.Product;
}

export async function updateProductAction(
    id: string,
    updates: Partial<schema.NewProduct>
): Promise<schema.Product | null> {
    await db.update(schema.products).set(updates).where(eq(schema.products.id, id));
    const [updated] = await db.select().from(schema.products).where(eq(schema.products.id, id));
    revalidatePath("/projects");
    return updated ?? null;
}

export async function deleteProductAction(id: string): Promise<void> {
    await db.delete(schema.products).where(eq(schema.products.id, id));
    revalidatePath("/projects");
}

export async function getAllProductsAction(): Promise<schema.Product[]> {
    return db.select().from(schema.products);
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
// Releases
// ============================================================================

export async function createReleaseAction(
    release: Omit<schema.NewRelease, "id">
): Promise<schema.Release> {
    const id = generateId();
    const newRelease = { ...release, id };
    await db.insert(schema.releases).values(newRelease);
    revalidatePath("/projects");
    return newRelease as schema.Release;
}

export async function updateReleaseAction(
    id: string,
    updates: Partial<schema.NewRelease>
): Promise<schema.Release | null> {
    await db.update(schema.releases).set(updates).where(eq(schema.releases.id, id));
    const [updated] = await db.select().from(schema.releases).where(eq(schema.releases.id, id));
    revalidatePath("/projects");
    return updated ?? null;
}

export async function deleteReleaseAction(id: string): Promise<void> {
    await db.delete(schema.releases).where(eq(schema.releases.id, id));
    revalidatePath("/projects");
}

export async function getAllReleasesAction(): Promise<schema.Release[]> {
    return db.select().from(schema.releases);
}

// ============================================================================
// SolutionView - UI Compatibility Layer
// ============================================================================

/**
 * Create a SolutionView (creates Solution + optional Product/Service)
 * This provides backward compatibility with the old "Service" entity UI.
 */
export async function createSolutionViewAction(
    view: Omit<SolutionView, "id" | "productId" | "serviceId">
): Promise<SolutionView> {
    const solutionId = generateId();

    // Create the base Solution
    await db.insert(schema.solutions).values({
        id: solutionId,
        name: view.name,
        description: view.description,
        status: view.status,
    });

    let productId: string | undefined;
    let serviceId: string | undefined;

    // Create Product if isProduct
    if (view.isProduct) {
        productId = generateId();
        await db.insert(schema.products).values({
            id: productId,
            solutionId,
            version: view.version,
            releaseDate: view.productReleaseDate,
        });
    }

    // Create Service if isService
    if (view.isService) {
        serviceId = generateId();
        await db.insert(schema.services).values({
            id: serviceId,
            name: `${view.name} Service`,
            solutionId,
            serviceLevel: view.serviceLevel,
        });
    }

    revalidatePath("/projects");

    return {
        id: solutionId,
        name: view.name,
        description: view.description,
        status: view.status,
        isProduct: view.isProduct,
        isService: view.isService,
        productId,
        version: view.version,
        productReleaseDate: view.productReleaseDate,
        serviceId,
        serviceLevel: view.serviceLevel,
    };
}

/**
 * Update a SolutionView (updates Solution and manages Product/Service)
 */
export async function updateSolutionViewAction(
    id: string,
    updates: Partial<SolutionView>
): Promise<SolutionView | null> {
    // Get current state
    const [solution] = await db.select().from(schema.solutions).where(eq(schema.solutions.id, id));
    if (!solution) return null;

    const products = await db.select().from(schema.products).where(eq(schema.products.solutionId, id));
    const services = await db.select().from(schema.services).where(eq(schema.services.solutionId, id));
    const currentProduct = products[0];
    const currentService = services[0];

    // Update Solution fields
    if (updates.name !== undefined || updates.description !== undefined || updates.status !== undefined) {
        await db.update(schema.solutions).set({
            name: updates.name ?? solution.name,
            description: updates.description ?? solution.description,
            status: updates.status ?? solution.status,
        }).where(eq(schema.solutions.id, id));
    }

    // Handle Product changes
    if (updates.isProduct !== undefined) {
        if (updates.isProduct && !currentProduct) {
            // Create new Product
            const productId = generateId();
            await db.insert(schema.products).values({
                id: productId,
                solutionId: id,
                version: updates.version,
                releaseDate: updates.productReleaseDate,
            });
        } else if (!updates.isProduct && currentProduct) {
            // Delete Product
            await db.delete(schema.products).where(eq(schema.products.id, currentProduct.id));
        } else if (updates.isProduct && currentProduct) {
            // Update Product
            await db.update(schema.products).set({
                version: updates.version ?? currentProduct.version,
                releaseDate: updates.productReleaseDate ?? currentProduct.releaseDate,
            }).where(eq(schema.products.id, currentProduct.id));
        }
    }

    // Handle Service changes
    if (updates.isService !== undefined) {
        if (updates.isService && !currentService) {
            // Create new Service
            const serviceId = generateId();
            const serviceName = updates.name ?? solution.name;
            await db.insert(schema.services).values({
                id: serviceId,
                name: `${serviceName} Service`,
                solutionId: id,
                serviceLevel: updates.serviceLevel,
            });
        } else if (!updates.isService && currentService) {
            // Delete Service
            await db.delete(schema.services).where(eq(schema.services.id, currentService.id));
        } else if (updates.isService && currentService) {
            // Update Service
            await db.update(schema.services).set({
                serviceLevel: updates.serviceLevel ?? currentService.serviceLevel,
            }).where(eq(schema.services.id, currentService.id));
        }
    }

    revalidatePath("/projects");

    // Return updated view
    return getSolutionViewAction(id);
}

/**
 * Get a single SolutionView by ID
 */
export async function getSolutionViewAction(id: string): Promise<SolutionView | null> {
    const [solution] = await db.select().from(schema.solutions).where(eq(schema.solutions.id, id));
    if (!solution) return null;

    const products = await db.select().from(schema.products).where(eq(schema.products.solutionId, id));
    const services = await db.select().from(schema.services).where(eq(schema.services.solutionId, id));
    const product = products[0];
    const service = services[0];

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
}

/**
 * Get all SolutionViews
 */
export async function getAllSolutionViewsAction(): Promise<SolutionView[]> {
    const solutions = await db.select().from(schema.solutions);
    const products = await db.select().from(schema.products);
    const services = await db.select().from(schema.services);

    // Create lookup maps
    const productBySolution = new Map(products.map(p => [p.solutionId, p]));
    const serviceBySolution = new Map(services.map(s => [s.solutionId, s]));

    return solutions.map(solution => {
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
}

/**
 * Delete a SolutionView (deletes Solution and related Product/Service)
 */
export async function deleteSolutionViewAction(id: string): Promise<void> {
    await deleteSolutionAction(id);
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
// Rules
// ============================================================================

export async function createRuleAction(
    rule: Omit<schema.NewRule, "id">
): Promise<schema.Rule> {
    const id = generateId();
    const newRule = { ...rule, id };
    await db.insert(schema.rules).values(newRule);
    revalidatePath("/projects");
    return newRule as schema.Rule;
}

export async function updateRuleAction(
    id: string,
    updates: Partial<schema.NewRule>
): Promise<schema.Rule | null> {
    await db.update(schema.rules).set(updates).where(eq(schema.rules.id, id));
    const [updated] = await db.select().from(schema.rules).where(eq(schema.rules.id, id));
    revalidatePath("/projects");
    return updated ?? null;
}

export async function deleteRuleAction(id: string): Promise<void> {
    await db.delete(schema.rules).where(eq(schema.rules.id, id));
    revalidatePath("/projects");
}

export async function getAllRulesAction(): Promise<schema.Rule[]> {
    return db.select().from(schema.rules);
}

// ============================================================================
// Scenarios
// ============================================================================

export async function createScenarioAction(
    scenario: Omit<schema.NewScenario, "id">
): Promise<schema.Scenario> {
    const id = generateId();
    const newScenario = { ...scenario, id };
    await db.insert(schema.scenarios).values(newScenario);
    revalidatePath("/projects");
    return newScenario as schema.Scenario;
}

export async function updateScenarioAction(
    id: string,
    updates: Partial<schema.NewScenario>
): Promise<schema.Scenario | null> {
    await db.update(schema.scenarios).set(updates).where(eq(schema.scenarios.id, id));
    const [updated] = await db.select().from(schema.scenarios).where(eq(schema.scenarios.id, id));
    revalidatePath("/projects");
    return updated ?? null;
}

export async function deleteScenarioAction(id: string): Promise<void> {
    await db.delete(schema.scenarios).where(eq(schema.scenarios.id, id));
    revalidatePath("/projects");
}

export async function getAllScenariosAction(): Promise<schema.Scenario[]> {
    return db.select().from(schema.scenarios);
}

// ============================================================================
// Specifications
// ============================================================================

export async function createSpecificationAction(
    specification: Omit<schema.NewSpecification, "id">
): Promise<schema.Specification> {
    const id = generateId();
    const newSpecification = { ...specification, id };
    await db.insert(schema.specifications).values(newSpecification);
    revalidatePath("/projects");
    return newSpecification as schema.Specification;
}

export async function updateSpecificationAction(
    id: string,
    updates: Partial<schema.NewSpecification>
): Promise<schema.Specification | null> {
    await db.update(schema.specifications).set(updates).where(eq(schema.specifications.id, id));
    const [updated] = await db.select().from(schema.specifications).where(eq(schema.specifications.id, id));
    revalidatePath("/projects");
    return updated ?? null;
}

export async function deleteSpecificationAction(id: string): Promise<void> {
    await db.delete(schema.specifications).where(eq(schema.specifications.id, id));
    revalidatePath("/projects");
}

export async function getAllSpecificationsAction(): Promise<schema.Specification[]> {
    return db.select().from(schema.specifications);
}

// ============================================================================
// Evidences
// ============================================================================

export async function createEvidenceAction(
    evidence: Omit<schema.NewEvidence, "id">
): Promise<schema.Evidence> {
    const id = generateId();
    const newEvidence = { ...evidence, id };
    await db.insert(schema.evidences).values(newEvidence);
    revalidatePath("/projects");
    return newEvidence as schema.Evidence;
}

export async function updateEvidenceAction(
    id: string,
    updates: Partial<schema.NewEvidence>
): Promise<schema.Evidence | null> {
    await db.update(schema.evidences).set(updates).where(eq(schema.evidences.id, id));
    const [updated] = await db.select().from(schema.evidences).where(eq(schema.evidences.id, id));
    revalidatePath("/projects");
    return updated ?? null;
}

export async function deleteEvidenceAction(id: string): Promise<void> {
    await db.delete(schema.evidences).where(eq(schema.evidences.id, id));
    revalidatePath("/projects");
}

export async function getAllEvidencesAction(): Promise<schema.Evidence[]> {
    return db.select().from(schema.evidences);
}

// ============================================================================
// Evaluations
// ============================================================================

export async function createEvaluationAction(
    evaluation: Omit<schema.NewEvaluation, "id">
): Promise<schema.Evaluation> {
    const id = generateId();
    const newEvaluation = { ...evaluation, id };
    await db.insert(schema.evaluations).values(newEvaluation);
    revalidatePath("/projects");
    return newEvaluation as schema.Evaluation;
}

export async function updateEvaluationAction(
    id: string,
    updates: Partial<schema.NewEvaluation>
): Promise<schema.Evaluation | null> {
    await db.update(schema.evaluations).set(updates).where(eq(schema.evaluations.id, id));
    const [updated] = await db.select().from(schema.evaluations).where(eq(schema.evaluations.id, id));
    revalidatePath("/projects");
    return updated ?? null;
}

export async function deleteEvaluationAction(id: string): Promise<void> {
    await db.delete(schema.evaluations).where(eq(schema.evaluations.id, id));
    revalidatePath("/projects");
}

export async function getAllEvaluationsAction(): Promise<schema.Evaluation[]> {
    return db.select().from(schema.evaluations);
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
        solutions,
        products,
        services,
        releases,
        projects,
        objectives,
        features,
        rules,
        scenarios,
        specifications,
        evidences,
        evaluations,
        metrics,
        kpis,
        initiatives,
        activities,
        roles,
        assignments,
        allocations,
    ] = await Promise.all([
        db.select().from(schema.solutions),
        db.select().from(schema.products),
        db.select().from(schema.services),
        db.select().from(schema.releases),
        db.select().from(schema.projects),
        db.select().from(schema.objectives),
        db.select().from(schema.features),
        db.select().from(schema.rules),
        db.select().from(schema.scenarios),
        db.select().from(schema.specifications),
        db.select().from(schema.evidences),
        db.select().from(schema.evaluations),
        db.select().from(schema.metrics),
        db.select().from(schema.kpis),
        db.select().from(schema.initiatives),
        db.select().from(schema.activities),
        db.select().from(schema.roles),
        db.select().from(schema.assignments),
        db.select().from(schema.allocations),
    ]);

    // Build SolutionViews for UI compatibility
    const productBySolution = new Map(products.map(p => [p.solutionId, p]));
    const serviceBySolution = new Map(services.map(s => [s.solutionId, s]));

    const solutionViews: SolutionView[] = solutions.map(solution => {
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

    return {
        description: { overview: "Loaded from SQLite database" },
        // Solution Space (normalized)
        solutions,
        products,
        services,
        releases,
        // UI Compatibility
        solutionViews,
        // Projects & Objectives
        projects,
        objectives,
        // Requirements Space
        features,
        rules,
        scenarios,
        specifications,
        // Verification Space
        evidences,
        evaluations,
        // Strategy Cascade
        metrics,
        kpis,
        initiatives,
        // Activity Space
        activities,
        roles,
        assignments,
        allocations,
    };
}
