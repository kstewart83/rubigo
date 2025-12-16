/**
 * Requirements & Delivery Ontology type definitions
 * 
 * This implements the full ontology with four spaces:
 * - Requirements Space: Objective → Feature → Rule → Scenario
 * - Solution Space: Solution → Product/Service → Release → Evidence → Evaluation
 * - Activity Space: Activity → Assignment → Allocation
 * - Resource Space: (to be added)
 */

// ============================================================================
// Status Enums
// ============================================================================

export type SolutionStatus = "pipeline" | "catalog" | "retired";
export type ReleaseStatus = "planned" | "released" | "deprecated";
export type ProjectStatus = "planning" | "active" | "on_hold" | "complete" | "cancelled";
export type ObjectiveStatus = "draft" | "active" | "achieved" | "deferred";
export type FeatureStatus = "planned" | "in_progress" | "complete" | "cancelled";
export type RuleStatus = "draft" | "active" | "deprecated";
export type ScenarioStatus = "draft" | "active" | "deprecated";
export type SpecificationStatus = "draft" | "active" | "deprecated";
export type SpecificationCategory = "performance" | "security" | "usability" | "reliability" | "accessibility" | "maintainability";
export type EvidenceType = "test_result" | "screenshot" | "recording" | "document";
export type Verdict = "pass" | "fail" | "inconclusive";
export type InitiativeStatus = "planned" | "active" | "complete" | "cancelled";
export type ActivityStatus = "backlog" | "ready" | "in_progress" | "blocked" | "complete";
export type KPIDirection = "increase" | "decrease" | "maintain";
export type RACIType = "responsible" | "accountable" | "consulted" | "informed";

// ============================================================================
// Solution Space
// ============================================================================

/**
 * Solution - Base entity for Products and Services
 * Common fields shared by both specializations
 */
export interface Solution {
    id: string;
    name: string;
    description?: string;
    status: SolutionStatus;
}

/**
 * Product - Deliverable that can be acquired/deployed by customers
 * Extends Solution via solutionId reference
 */
export interface Product {
    id: string;
    solutionId: string;
    version?: string;
    releaseDate?: string;
}

/**
 * Service - Ongoing provision of value
 * Extends Solution via solutionId reference
 */
export interface Service {
    id: string;
    solutionId: string;
    serviceLevel?: string;
}

/**
 * Release - Versioned snapshot of a Product
 */
export interface Release {
    id: string;
    productId: string;
    version: string;
    releaseDate?: string;
    notes?: string;
    status: ReleaseStatus;
}

// ============================================================================
// UI Compatibility Layer
// ============================================================================

/**
 * SolutionView - Flattened view for UI backward compatibility
 * Combines Solution + Product/Service into a single view that mirrors
 * the old Service entity structure the UI was built around.
 * 
 * Use this for UI display; use normalized entities for database operations.
 */
export interface SolutionView {
    // From Solution (base)
    id: string;
    name: string;
    description?: string;
    status: SolutionStatus;

    // Computed flags (like old Service.isProduct/isService)
    isProduct: boolean;
    isService: boolean;

    // From Product (if isProduct)
    productId?: string;
    version?: string;
    productReleaseDate?: string;

    // From Service (if isService)
    serviceId?: string;
    serviceLevel?: string;
}

/**
 * Helper to create SolutionView from normalized entities
 */
export function createSolutionView(
    solution: Solution,
    product?: Product,
    service?: Service
): SolutionView {
    return {
        id: solution.id,
        name: solution.name,
        description: solution.description,
        status: solution.status,
        isProduct: !!product,
        isService: !!service,
        productId: product?.id,
        version: product?.version,
        productReleaseDate: product?.releaseDate,
        serviceId: service?.id,
        serviceLevel: service?.serviceLevel,
    };
}

// ============================================================================
// Project & Objectives
// ============================================================================

/**
 * Project - Temporary effort to create or modify a solution
 */
export interface Project {
    id: string;
    name: string;
    description?: string;
    solutionId: string;
    status: ProjectStatus;
    startDate?: string;
    endDate?: string;
}

/**
 * Objective - High-level strategic goal
 * Can form hierarchies via parentId
 */
export interface Objective {
    id: string;
    title: string;
    description?: string;
    projectId: string;
    parentId?: string;
    status: ObjectiveStatus;
}

// ============================================================================
// Requirements Space
// ============================================================================

/**
 * Feature - Distinct capability that helps satisfy an objective
 */
export interface Feature {
    id: string;
    name: string;
    description?: string;
    objectiveId: string;
    status: FeatureStatus;
}

/**
 * Rule - User story using Three Rs format
 * "As a {role}, I want to {requirement}, so I can {reason}"
 */
export interface Rule {
    id: string;
    featureId: string;
    role: string;
    requirement: string;
    reason: string;
    status: RuleStatus;
}

/**
 * Scenario - Testable acceptance criterion
 * Uses Given/When/Then inspired narrative (freeform, not strict Gherkin)
 */
export interface Scenario {
    id: string;
    ruleId: string;
    name: string;
    narrative: string;
    status: ScenarioStatus;
}

/**
 * Specification - Non-functional requirement using RFC 2119 language
 */
export interface Specification {
    id: string;
    featureId: string;
    name: string;
    narrative: string;
    category: SpecificationCategory;
    status: SpecificationStatus;
}

// ============================================================================
// Verification Space
// ============================================================================

/**
 * Evidence - Artifact that validates a Scenario or Specification
 */
export interface Evidence {
    id: string;
    releaseId: string;
    scenarioId?: string;
    specificationId?: string;
    type: EvidenceType;
    artifactUrl?: string;
    capturedAt: string;
}

/**
 * Evaluation - Pass/Fail verdict on Evidence
 */
export interface Evaluation {
    id: string;
    evidenceId: string;
    verdict: Verdict;
    evaluatorId?: string;
    evaluatedAt: string;
    notes?: string;
}

// ============================================================================
// Strategy Cascade: Metric → KPI → Initiative
// ============================================================================

/**
 * Metric - Raw measurement gathered from operations
 */
export interface Metric {
    id: string;
    name: string;
    description?: string;
    unit: string;
    currentValue?: number;
    source?: string;
}

/**
 * KPI - Key Performance Indicator
 * A Metric aligned to an Objective with target and thresholds
 */
export interface KPI {
    id: string;
    metricId: string;
    objectiveId?: string;
    targetValue: number;
    direction: KPIDirection;
    thresholdWarning?: number;
    thresholdCritical?: number;
}

/**
 * Initiative - Short-term focused effort to move a KPI
 */
export interface Initiative {
    id: string;
    name: string;
    description?: string;
    kpiId: string;
    status: InitiativeStatus;
    startDate?: string;
    endDate?: string;
}

// ============================================================================
// Activity Space
// ============================================================================

/**
 * Activity - Discrete unit of work
 */
export interface Activity {
    id: string;
    name: string;
    description?: string;
    parentId?: string;
    initiativeId?: string;
    blockedBy?: string[];
    status: ActivityStatus;
}

/**
 * Role - Abstract function or job title
 */
export interface Role {
    id: string;
    name: string;
    description?: string;
}

/**
 * Assignment - Planned slot for a role (The Plan)
 */
export interface Assignment {
    id: string;
    activityId: string;
    roleId: string;
    quantity: number;
    unit: string;
    raciType: RACIType;
}

/**
 * Allocation - Concrete contribution from a resource (The Fulfillment)
 */
export interface Allocation {
    id: string;
    assignmentId: string;
    personId: string;
    quantityContributed: number;
    startDate?: string;
    endDate?: string;
}

// ============================================================================
// Aggregate Data Structure
// ============================================================================

/**
 * Complete project management data structure
 */
export interface ProjectData {
    description: {
        overview: string;
    };
    // Solution Space (normalized)
    solutions: Solution[];
    products: Product[];
    services: Service[];
    releases: Release[];
    // UI Compatibility (denormalized view)
    solutionViews: SolutionView[];
    // Project & Objectives
    projects: Project[];
    objectives: Objective[];
    // Requirements Space
    features: Feature[];
    rules: Rule[];
    scenarios: Scenario[];
    specifications: Specification[];
    // Verification Space
    evidences: Evidence[];
    evaluations: Evaluation[];
    // Strategy Cascade
    metrics: Metric[];
    kpis: KPI[];
    initiatives: Initiative[];
    // Activity Space
    activities: Activity[];
    roles: Role[];
    assignments: Assignment[];
    allocations: Allocation[];
}

// ============================================================================
// Computed/Derived Types (for UI)
// ============================================================================

/**
 * Solution with its Product/Service specialization
 */
export interface SolutionWithType extends Solution {
    product?: Product;
    service?: Service;
    releases?: Release[];
}

/**
 * KPI with resolved Metric data for display
 */
export interface KPIWithMetric extends KPI {
    metric: Metric;
    objective?: Objective;
    currentValue?: number;
    percentComplete?: number;
}

/**
 * Assignment with capacity gap information
 */
export interface AssignmentWithCapacity extends Assignment {
    role: Role;
    activity: Activity;
    allocations: Allocation[];
    totalAllocated: number;
    capacityGap: number;
}

/**
 * Feature with its Rules and Scenarios
 */
export interface FeatureWithRequirements extends Feature {
    rules: RuleWithScenarios[];
    specifications: Specification[];
}

/**
 * Rule with its Scenarios
 */
export interface RuleWithScenarios extends Rule {
    scenarios: Scenario[];
    /** Computed narrative: "As a {role}, I want to {requirement}, so I can {reason}" */
    narrative: string;
}

/**
 * Objective tree node for hierarchical display
 */
export interface ObjectiveTreeNode extends Objective {
    children: ObjectiveTreeNode[];
    features: FeatureWithRequirements[];
    kpis: KPIWithMetric[];
}

/**
 * Helper to generate Rule narrative from Three Rs
 */
export function formatRuleNarrative(rule: Rule): string {
    return `As a ${rule.role}, I want to ${rule.requirement}, so I can ${rule.reason}`;
}
