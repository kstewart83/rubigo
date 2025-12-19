/**
 * Drizzle ORM Schema for Rubigo Requirements & Delivery Ontology
 * 
 * This schema implements the full ontology with four spaces:
 * - Solution Space: solutions, products, services, releases
 * - Requirements Space: objectives, features, rules, scenarios, specifications
 * - Verification Space: evidences, evaluations
 * - Activity Space: activities, roles, assignments, allocations
 * - Strategy Cascade: metrics, kpis, initiatives
 */

import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ============================================================================
// Personnel (System Users)
// ============================================================================

/**
 * Personnel - Users stored in database (including Global Administrator)
 * Note: Most personnel come from TOML, but admins are stored in DB
 */
export const personnel = sqliteTable("personnel", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    title: text("title"),
    department: text("department"),
    site: text("site"),
    building: text("building"),
    level: integer("level"),
    space: text("space"),
    manager: text("manager"),
    photo: text("photo"),
    deskPhone: text("desk_phone"),
    cellPhone: text("cell_phone"),
    bio: text("bio"),
    isGlobalAdmin: integer("is_global_admin", { mode: "boolean" }).default(false),
    // Access Control: Subject attributes
    clearanceLevel: text("clearance_level", {
        enum: ["public", "low", "moderate", "high"]
    }).default("low"),
    tenantClearances: text("tenant_clearances"), // JSON: ["moderate:🍎"]
    accessRoles: text("access_roles").default('["employee"]'), // JSON: ["employee"]
    // Access Control: Object attributes
    aco: text("aco").notNull().default('{"sensitivity":"low"}'),
    sco: text("sco"),
});

/**
 * PhotoBlobs - Database storage for personnel photos
 * Stores images as blobs with metadata for serving with cache headers
 */
export const photoBlobs = sqliteTable("photo_blobs", {
    id: text("id").primaryKey(), // Used as filename/identifier
    data: text("data").notNull(), // Base64 encoded image data
    mimeType: text("mime_type").notNull(), // e.g., "image/jpeg"
    size: integer("size").notNull(), // File size in bytes
    createdAt: text("created_at").notNull(), // ISO timestamp for caching
});

// ============================================================================
// Solution Space
// ============================================================================

/**
 * Solutions - Base entity for Products and Services
 */
export const solutions = sqliteTable("solutions", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    status: text("status", { enum: ["pipeline", "catalog", "retired"] }).default("catalog"),
    // Access Control
    aco: text("aco").notNull().default('{"sensitivity":"low"}'),
    sco: text("sco"),
});

/**
 * Products - Deliverables that can be acquired/deployed (extends Solution)
 */
export const products = sqliteTable("products", {
    id: text("id").primaryKey(),
    solutionId: text("solution_id").references(() => solutions.id).notNull(),
    version: text("version"),
    releaseDate: text("release_date"),
});

/**
 * Services - Ongoing provision of value (extends Solution)
 */
export const services = sqliteTable("services", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    solutionId: text("solution_id").references(() => solutions.id).notNull(),
    serviceLevel: text("service_level"),
});

/**
 * Releases - Versioned snapshots of Products
 */
export const releases = sqliteTable("releases", {
    id: text("id").primaryKey(),
    productId: text("product_id").references(() => products.id).notNull(),
    version: text("version").notNull(),
    releaseDate: text("release_date"),
    notes: text("notes"),
    status: text("status", { enum: ["planned", "released", "deprecated"] }).default("planned"),
});

// ============================================================================
// Project & Objectives
// ============================================================================

/**
 * Projects - Temporary efforts to create or modify solutions
 */
export const projects = sqliteTable("projects", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    solutionId: text("solution_id").references(() => solutions.id),
    status: text("status", { enum: ["planning", "active", "on_hold", "complete", "cancelled"] }).default("planning"),
    startDate: text("start_date"),
    endDate: text("end_date"),
    // Access Control
    aco: text("aco").notNull().default('{"sensitivity":"low"}'),
    sco: text("sco"),
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
    // Access Control
    aco: text("aco").notNull().default('{"sensitivity":"low"}'),
    sco: text("sco"),
});

// ============================================================================
// Requirements Space
// ============================================================================

/**
 * Features - Capabilities that realize objectives
 */
export const features = sqliteTable("features", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    objectiveId: text("objective_id").references(() => objectives.id),
    status: text("status", { enum: ["planned", "in_progress", "complete", "cancelled"] }).default("planned"),
    // Access Control
    aco: text("aco").notNull().default('{"sensitivity":"low"}'),
    sco: text("sco"),
});

/**
 * Rules - User stories using Three Rs format
 * "As a {role}, I want to {requirement}, so I can {reason}"
 */
export const rules = sqliteTable("rules", {
    id: text("id").primaryKey(),
    featureId: text("feature_id").references(() => features.id).notNull(),
    role: text("role").notNull(),
    requirement: text("requirement").notNull(),
    reason: text("reason").notNull(),
    status: text("status", { enum: ["draft", "active", "deprecated"] }).default("draft"),
});

/**
 * Scenarios - Testable acceptance criteria
 * Uses Given/When/Then inspired narrative (freeform)
 */
export const scenarios = sqliteTable("scenarios", {
    id: text("id").primaryKey(),
    ruleId: text("rule_id").references(() => rules.id).notNull(),
    name: text("name").notNull(),
    narrative: text("narrative").notNull(),
    status: text("status", { enum: ["draft", "active", "deprecated"] }).default("draft"),
});

/**
 * Specifications - Non-functional requirements using RFC 2119 language
 */
export const specifications = sqliteTable("specifications", {
    id: text("id").primaryKey(),
    featureId: text("feature_id").references(() => features.id).notNull(),
    name: text("name").notNull(),
    narrative: text("narrative").notNull(),
    category: text("category", { enum: ["performance", "security", "usability", "reliability", "accessibility", "maintainability"] }).notNull(),
    status: text("status", { enum: ["draft", "active", "deprecated"] }).default("draft"),
});

// ============================================================================
// Verification Space
// ============================================================================

/**
 * Evidences - Artifacts that validate Scenarios or Specifications
 */
export const evidences = sqliteTable("evidences", {
    id: text("id").primaryKey(),
    releaseId: text("release_id").references(() => releases.id).notNull(),
    scenarioId: text("scenario_id").references(() => scenarios.id),
    specificationId: text("specification_id").references(() => specifications.id),
    type: text("type", { enum: ["test_result", "screenshot", "recording", "document"] }).notNull(),
    artifactUrl: text("artifact_url"),
    capturedAt: text("captured_at").notNull(), // ISO 8601 datetime
});

/**
 * Evaluations - Pass/Fail verdicts on Evidence
 */
export const evaluations = sqliteTable("evaluations", {
    id: text("id").primaryKey(),
    evidenceId: text("evidence_id").references(() => evidences.id).notNull(),
    verdict: text("verdict", { enum: ["pass", "fail", "inconclusive"] }).notNull(),
    evaluatorId: text("evaluator_id"), // References personnel module
    evaluatedAt: text("evaluated_at").notNull(), // ISO 8601 datetime
    notes: text("notes"),
});

// ============================================================================
// Strategy Cascade: Metric → KPI → Initiative
// ============================================================================

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
    // Access Control
    aco: text("aco").notNull().default('{"sensitivity":"low"}'),
    sco: text("sco"),
});

// ============================================================================
// Activity Space
// ============================================================================

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
    // Access Control
    aco: text("aco").notNull().default('{"sensitivity":"low"}'),
    sco: text("sco"),
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
    source: text("source", { enum: ["ui", "api"] }), // Where the action originated
});

// ============================================================================
// Collaboration: Calendar
// ============================================================================

/**
 * Calendar Events - Scheduled events and meetings
 */
export const calendarEvents = sqliteTable("calendar_events", {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    startTime: text("start_time").notNull(), // ISO 8601 datetime
    endTime: text("end_time").notNull(), // ISO 8601 datetime
    allDay: integer("all_day", { mode: "boolean" }).default(false),
    eventType: text("event_type", {
        enum: ["meeting", "standup", "allHands", "oneOnOne", "training",
            "interview", "holiday", "conference", "review", "planning",
            "appointment", "reminder", "outOfOffice"]
    }).default("meeting"),
    recurrence: text("recurrence", {
        enum: ["none", "daily", "weekly", "monthly", "yearly"]
    }).default("none"),
    recurrenceInterval: integer("recurrence_interval").default(1), // e.g., 2 = every 2 weeks
    recurrenceDays: text("recurrence_days"), // JSON array ["Mon", "Wed", "Fri"]
    recurrenceUntil: text("recurrence_until"), // ISO date
    timezone: text("timezone").default("America/New_York"),
    location: text("location"),
    virtualUrl: text("virtual_url"), // Video conference link
    organizerId: text("organizer_id").references(() => personnel.id),
    deleted: integer("deleted", { mode: "boolean" }).default(false),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    // Access Control
    aco: text("aco").notNull().default('{"sensitivity":"low"}'),
    sco: text("sco"),
});

/**
 * Calendar Participants - Event attendees
 */
export const calendarParticipants = sqliteTable("calendar_participants", {
    id: text("id").primaryKey(),
    eventId: text("event_id").references(() => calendarEvents.id).notNull(),
    personnelId: text("personnel_id").references(() => personnel.id).notNull(),
    role: text("role", { enum: ["organizer", "participant"] }).default("participant"),
});

/**
 * Calendar Deviations - Exceptions for recurring events
 * 
 * Two types of deviations:
 * - Anchored: originalDate set, newDate null - modifies/cancels a recurrence instance
 * - Unanchored: originalDate null, newDate set - standalone event from a "moved" instance
 */
export const calendarDeviations = sqliteTable("calendar_deviations", {
    id: text("id").primaryKey(),
    eventId: text("event_id").references(() => calendarEvents.id).notNull(),
    // Anchored identity: the recurrence date being modified (null for unanchored)
    originalDate: text("original_date"),
    // Unanchored identity: independent date for "moved" instances (null for anchored)
    newDate: text("new_date"),
    cancelled: integer("cancelled", { mode: "boolean" }).default(false),
    overrideStartTime: text("override_start_time"),
    overrideEndTime: text("override_end_time"),
    overrideTitle: text("override_title"),
    overrideDescription: text("override_description"),
    overrideLocation: text("override_location"),
    overrideTimezone: text("override_timezone"),
});

// ============================================================================
// Collaboration: Email
// ============================================================================

/**
 * Emails - Internal messages
 */
export const emails = sqliteTable("emails", {
    id: text("id").primaryKey(),
    threadId: text("thread_id").notNull(), // Groups conversations
    fromId: text("from_id").references(() => personnel.id).notNull(),
    subject: text("subject").notNull(),
    body: text("body").notNull(), // HTML content
    sentAt: text("sent_at").notNull(), // ISO 8601
    folder: text("folder", {
        enum: ["inbox", "sent", "drafts", "trash"]
    }).default("inbox"),
    isDraft: integer("is_draft", { mode: "boolean" }).default(false),
    // Access Control
    aco: text("aco").notNull().default('{"sensitivity":"low"}'),
    sco: text("sco"),
});

/**
 * Email Recipients - To, CC, BCC
 */
export const emailRecipients = sqliteTable("email_recipients", {
    id: text("id").primaryKey(),
    emailId: text("email_id").references(() => emails.id).notNull(),
    personnelId: text("personnel_id").references(() => personnel.id).notNull(),
    type: text("type", { enum: ["to", "cc", "bcc"] }).default("to"),
    read: integer("read", { mode: "boolean" }).default(false),
});

// ============================================================================
// Collaboration: Chat
// ============================================================================

/**
 * Chat Channels - Group conversations or DMs
 */
export const chatChannels = sqliteTable("chat_channels", {
    id: text("id").primaryKey(),
    name: text("name"),
    description: text("description"),
    type: text("type", { enum: ["channel", "dm"] }).notNull(),
    createdBy: text("created_by").references(() => personnel.id),
    createdAt: text("created_at").notNull(),
    // Access Control
    aco: text("aco").notNull().default('{"sensitivity":"low"}'),
    sco: text("sco"),
});

/**
 * Chat Members - Channel/DM participants
 */
export const chatMembers = sqliteTable("chat_members", {
    id: text("id").primaryKey(),
    channelId: text("channel_id").references(() => chatChannels.id).notNull(),
    personnelId: text("personnel_id").references(() => personnel.id).notNull(),
    lastRead: text("last_read"), // ISO datetime for unread tracking
    joinedAt: text("joined_at").notNull(),
});

/**
 * Chat Messages - Individual messages
 */
export const chatMessages = sqliteTable("chat_messages", {
    id: text("id").primaryKey(),
    channelId: text("channel_id").references(() => chatChannels.id).notNull(),
    senderId: text("sender_id").references(() => personnel.id).notNull(),
    content: text("content").notNull(),
    threadId: text("thread_id"), // Parent message ID for threads
    sentAt: text("sent_at").notNull(),
    editedAt: text("edited_at"),
    deleted: integer("deleted", { mode: "boolean" }).default(false),
    // Access Control
    aco: text("aco").notNull().default('{"sensitivity":"low"}'),
    sco: text("sco"),
});

/**
 * Chat Reactions - Emoji reactions to messages
 */
export const chatReactions = sqliteTable("chat_reactions", {
    id: text("id").primaryKey(),
    messageId: text("message_id").references(() => chatMessages.id).notNull(),
    personnelId: text("personnel_id").references(() => personnel.id).notNull(),
    emoji: text("emoji").notNull(), // Unicode emoji
    createdAt: text("created_at").notNull(),
});

// ============================================================================
// Collaboration: Screen Share
// ============================================================================

/**
 * Screen Share Sessions
 */
export const screenShareSessions = sqliteTable("screen_share_sessions", {
    id: text("id").primaryKey(),
    hostId: text("host_id").references(() => personnel.id).notNull(),
    chatChannelId: text("chat_channel_id").references(() => chatChannels.id),
    startedAt: text("started_at").notNull(),
    endedAt: text("ended_at"), // Null if active
});

// ============================================================================
// Access Control: Classification Guides
// ============================================================================

/**
 * Classification Guides - English-level descriptions for data classification
 * Supports version history: draft -> active -> superseded
 */
export const classificationGuides = sqliteTable("classification_guides", {
    id: text("id").primaryKey(), // e.g., "CG-HR-001"
    version: integer("version").notNull().default(1),
    title: text("title").notNull(),
    sensitivityGuidance: text("sensitivity_guidance").notNull(), // JSON: {public, low, moderate, high}
    tenantGuidance: text("tenant_guidance"), // JSON: {tenant: description}
    roleGuidance: text("role_guidance"), // JSON: {role: description}
    effectiveDate: text("effective_date").notNull(), // ISO 8601
    status: text("status", {
        enum: ["draft", "active", "superseded"]
    }).default("draft"),
    supersededBy: text("superseded_by"), // ID of newer version
    createdAt: text("created_at").notNull(),
    createdBy: text("created_by").notNull(),
});

// ============================================================================
// Type Exports for Drizzle
// ============================================================================

// Solution Space
export type Solution = typeof solutions.$inferSelect;
export type NewSolution = typeof solutions.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;

export type Release = typeof releases.$inferSelect;
export type NewRelease = typeof releases.$inferInsert;

// Project & Objectives
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Objective = typeof objectives.$inferSelect;
export type NewObjective = typeof objectives.$inferInsert;

// Requirements Space
export type Feature = typeof features.$inferSelect;
export type NewFeature = typeof features.$inferInsert;

export type Rule = typeof rules.$inferSelect;
export type NewRule = typeof rules.$inferInsert;

export type Scenario = typeof scenarios.$inferSelect;
export type NewScenario = typeof scenarios.$inferInsert;

export type Specification = typeof specifications.$inferSelect;
export type NewSpecification = typeof specifications.$inferInsert;

// Verification Space
export type Evidence = typeof evidences.$inferSelect;
export type NewEvidence = typeof evidences.$inferInsert;

export type Evaluation = typeof evaluations.$inferSelect;
export type NewEvaluation = typeof evaluations.$inferInsert;

// Strategy Cascade
export type Metric = typeof metrics.$inferSelect;
export type NewMetric = typeof metrics.$inferInsert;

export type KPI = typeof kpis.$inferSelect;
export type NewKPI = typeof kpis.$inferInsert;

export type Initiative = typeof initiatives.$inferSelect;
export type NewInitiative = typeof initiatives.$inferInsert;

// Activity Space
export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;

export type Assignment = typeof assignments.$inferSelect;
export type NewAssignment = typeof assignments.$inferInsert;

export type Allocation = typeof allocations.$inferSelect;
export type NewAllocation = typeof allocations.$inferInsert;

// Audit Trail
export type ActionLog = typeof actionLogs.$inferSelect;
export type NewActionLog = typeof actionLogs.$inferInsert;

// Collaboration: Calendar
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type NewCalendarEvent = typeof calendarEvents.$inferInsert;

export type CalendarParticipant = typeof calendarParticipants.$inferSelect;
export type NewCalendarParticipant = typeof calendarParticipants.$inferInsert;

export type CalendarDeviation = typeof calendarDeviations.$inferSelect;
export type NewCalendarDeviation = typeof calendarDeviations.$inferInsert;

// Collaboration: Email
export type Email = typeof emails.$inferSelect;
export type NewEmail = typeof emails.$inferInsert;

export type EmailRecipient = typeof emailRecipients.$inferSelect;
export type NewEmailRecipient = typeof emailRecipients.$inferInsert;

// Collaboration: Chat
export type ChatChannel = typeof chatChannels.$inferSelect;
export type NewChatChannel = typeof chatChannels.$inferInsert;

export type ChatMember = typeof chatMembers.$inferSelect;
export type NewChatMember = typeof chatMembers.$inferInsert;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;

export type ChatReaction = typeof chatReactions.$inferSelect;
export type NewChatReaction = typeof chatReactions.$inferInsert;

// Collaboration: Screen Share
export type ScreenShareSession = typeof screenShareSessions.$inferSelect;
export type NewScreenShareSession = typeof screenShareSessions.$inferInsert;

// Access Control
export type ClassificationGuide = typeof classificationGuides.$inferSelect;
export type NewClassificationGuide = typeof classificationGuides.$inferInsert;
