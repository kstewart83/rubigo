/**
 * Project Management type definitions based on common/schemas/project.schema.json
 * 
 * This implements the Requirements & Delivery Ontology with the Strategy Cascade:
 * Objective → KPI (references Metric) → Initiative → Activity
 */

// ============================================================================
// Status Enums
// ============================================================================

export type ServiceStatus = "pipeline" | "catalog" | "retired";
export type ProjectStatus = "planning" | "active" | "on_hold" | "complete" | "cancelled";
export type ObjectiveStatus = "draft" | "active" | "achieved" | "deferred";
export type FeatureStatus = "planned" | "in_progress" | "complete" | "cancelled";
export type InitiativeStatus = "planned" | "active" | "complete" | "cancelled";
export type ActivityStatus = "backlog" | "ready" | "in_progress" | "blocked" | "complete";
export type KPIDirection = "increase" | "decrease" | "maintain";
export type RACIType = "responsible" | "accountable" | "consulted" | "informed";

// ============================================================================
// Core Entities
// ============================================================================

/**
 * Service - Persistent business product or service offering
 * Lives beyond projects; part of the Product/Service Portfolio
 * 
 * Note: isProduct and isService are not mutually exclusive.
 * - isProduct: Can be acquired/deployed by customers (e.g., HVAC equipment)
 * - isService: Ongoing provision of value (e.g., maintenance contracts, internal IT services)
 */
export interface Service {
    id: string;
    name: string;
    description?: string;
    status: ServiceStatus;
    isProduct?: boolean;
    isService?: boolean;
}

/**
 * Project - Temporary effort to create or modify a service
 */
export interface Project {
    id: string;
    name: string;
    description?: string;
    serviceId: string;
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

// ============================================================================
// Strategy Cascade: Metric → KPI → Initiative
// ============================================================================

/**
 * Metric - Raw measurement gathered from operations
 * Metrics exist independently; they may or may not be useful for management
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
 * A Metric that management has chosen to align to an Objective
 * References a Metric (not extends); objectiveId is optional
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
 * Decomposes into Activities
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
 * Can form hierarchies via parentId, can be blocked by other activities
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
 * Assignment - Planned slot for a role needed to complete work (The Plan)
 * Represents demand: "We need X amount of Role Y for Activity Z"
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
 * Represents supply: "Person P contributes X to Assignment A"
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
    services: Service[];
    projects: Project[];
    objectives: Objective[];
    features: Feature[];
    metrics: Metric[];
    kpis: KPI[];
    initiatives: Initiative[];
    activities: Activity[];
    roles: Role[];
    assignments: Assignment[];
    allocations: Allocation[];
}

// ============================================================================
// Computed/Derived Types (for UI)
// ============================================================================

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
    capacityGap: number; // positive = under-resourced, negative = over-resourced
}

/**
 * Objective tree node for hierarchical display
 */
export interface ObjectiveTreeNode extends Objective {
    children: ObjectiveTreeNode[];
    features: Feature[];
    kpis: KPIWithMetric[];
}
