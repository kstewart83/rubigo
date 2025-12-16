/**
 * Drizzle ORM Schema for Rubigo Project Management
 * 
 * This schema defines all 11 entity types from the project management module
 * plus the action_logs table for audit trail.
 */

import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ============================================================================
// Core Entity Tables
// ============================================================================

/**
 * Services - Products and services in the portfolio
 */
export const services = sqliteTable("services", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    status: text("status", { enum: ["pipeline", "catalog", "retired"] }).default("catalog"),
    isProduct: integer("is_product", { mode: "boolean" }).default(false),
    isService: integer("is_service", { mode: "boolean" }).default(false),
});

/**
 * Projects - Temporary efforts to create or modify services
 */
export const projects = sqliteTable("projects", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    serviceId: text("service_id").references(() => services.id),
    status: text("status", { enum: ["planning", "active", "on_hold", "complete", "cancelled"] }).default("planning"),
    startDate: text("start_date"),
    endDate: text("end_date"),
});

/**
 * Objectives - High-level strategic goals (hierarchical)
 */
export const objectives = sqliteTable("objectives", {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    projectId: text("project_id").references(() => projects.id),
    parentId: text("parent_id"), // Self-referencing for hierarchy
    status: text("status", { enum: ["draft", "active", "achieved", "deferred"] }).default("draft"),
});

/**
 * Features - Capabilities that realize objectives
 */
export const features = sqliteTable("features", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    objectiveId: text("objective_id").references(() => objectives.id),
    status: text("status", { enum: ["planned", "in_progress", "complete", "cancelled"] }).default("planned"),
});

/**
 * Metrics - Raw operational measurements
 */
export const metrics = sqliteTable("metrics", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    unit: text("unit").notNull(),
    currentValue: real("current_value"),
    source: text("source"),
});

/**
 * KPIs - Key Performance Indicators aligned to objectives
 */
export const kpis = sqliteTable("kpis", {
    id: text("id").primaryKey(),
    metricId: text("metric_id").references(() => metrics.id).notNull(),
    objectiveId: text("objective_id").references(() => objectives.id),
    targetValue: real("target_value").notNull(),
    direction: text("direction", { enum: ["increase", "decrease", "maintain"] }).notNull(),
    thresholdWarning: real("threshold_warning"),
    thresholdCritical: real("threshold_critical"),
});

/**
 * Initiatives - Short-term focused efforts to move KPIs
 */
export const initiatives = sqliteTable("initiatives", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    kpiId: text("kpi_id").references(() => kpis.id),
    status: text("status", { enum: ["planned", "active", "complete", "cancelled"] }).default("planned"),
    startDate: text("start_date"),
    endDate: text("end_date"),
});

/**
 * Activities - Discrete units of work
 */
export const activities = sqliteTable("activities", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    parentId: text("parent_id"), // Self-referencing for decomposition
    initiativeId: text("initiative_id").references(() => initiatives.id),
    blockedBy: text("blocked_by"), // JSON array of IDs stored as text
    status: text("status", { enum: ["backlog", "ready", "in_progress", "blocked", "complete"] }).default("backlog"),
});

/**
 * Roles - Abstract job functions
 */
export const roles = sqliteTable("roles", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
});

/**
 * Assignments - Planned resource slots (The Plan)
 */
export const assignments = sqliteTable("assignments", {
    id: text("id").primaryKey(),
    activityId: text("activity_id").references(() => activities.id).notNull(),
    roleId: text("role_id").references(() => roles.id).notNull(),
    quantity: real("quantity").notNull(),
    unit: text("unit").default("fte"),
    raciType: text("raci_type", { enum: ["responsible", "accountable", "consulted", "informed"] }).default("responsible"),
});

/**
 * Allocations - Concrete resource contributions (The Fulfillment)
 */
export const allocations = sqliteTable("allocations", {
    id: text("id").primaryKey(),
    assignmentId: text("assignment_id").references(() => assignments.id).notNull(),
    personId: text("person_id").notNull(), // References personnel module
    quantityContributed: real("quantity_contributed").notNull(),
    startDate: text("start_date"),
    endDate: text("end_date"),
});

// ============================================================================
// Audit Trail
// ============================================================================

/**
 * Action Logs - Audit trail for all CRUD operations
 */
export const actionLogs = sqliteTable("action_logs", {
    id: text("id").primaryKey(),
    timestamp: text("timestamp").notNull(), // ISO 8601
    operationId: text("operation_id").notNull(), // e.g., "createObjective"
    entityType: text("entity_type").notNull(), // e.g., "objective"
    entityId: text("entity_id").notNull(),
    action: text("action", { enum: ["create", "read", "update", "delete"] }).notNull(),
    actorId: text("actor_id").notNull(),
    actorName: text("actor_name").notNull(),
    requestId: text("request_id"),
    changes: text("changes"), // JSON array of { field, oldValue, newValue }
    metadata: text("metadata"), // JSON object
});

// ============================================================================
// Type Exports for Drizzle
// ============================================================================

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Objective = typeof objectives.$inferSelect;
export type NewObjective = typeof objectives.$inferInsert;

export type Feature = typeof features.$inferSelect;
export type NewFeature = typeof features.$inferInsert;

export type Metric = typeof metrics.$inferSelect;
export type NewMetric = typeof metrics.$inferInsert;

export type KPI = typeof kpis.$inferSelect;
export type NewKPI = typeof kpis.$inferInsert;

export type Initiative = typeof initiatives.$inferSelect;
export type NewInitiative = typeof initiatives.$inferInsert;

export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;

export type Assignment = typeof assignments.$inferSelect;
export type NewAssignment = typeof assignments.$inferInsert;

export type Allocation = typeof allocations.$inferSelect;
export type NewAllocation = typeof allocations.$inferInsert;

export type ActionLog = typeof actionLogs.$inferSelect;
export type NewActionLog = typeof actionLogs.$inferInsert;
