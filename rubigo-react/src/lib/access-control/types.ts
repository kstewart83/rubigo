/**
 * Access Control Types
 *
 * Core type definitions for Attribute-Based Access Control (ABAC).
 * These types are used throughout the platform for authorization decisions.
 */

// ============================================================================
// Sensitivity Levels
// ============================================================================

/**
 * Sensitivity levels ordered from least to most sensitive.
 * Subject clearance must be >= object sensitivity to access.
 */
export type SensitivityLevel = "public" | "low" | "moderate" | "high";

/**
 * Sensitivity level ordering for comparison.
 * Higher index = more sensitive.
 */
export const SENSITIVITY_ORDER: readonly SensitivityLevel[] = [
    "public",
    "low",
    "moderate",
    "high",
] as const;

/**
 * Get numeric index for sensitivity comparison.
 */
export function sensitivityIndex(level: SensitivityLevel): number {
    return SENSITIVITY_ORDER.indexOf(level);
}

// ============================================================================
// Access Control Object (ACO)
// ============================================================================

/**
 * Access Control Object - stored in each record's `aco` column.
 * Determines WHO can access the record based on their attributes.
 *
 * Stored as indexed JSON for pre-query filtering.
 */
export interface AccessControlObject {
    /**
     * Sensitivity level (REQUIRED, never null).
     * Subject must have clearance >= this level.
     */
    sensitivity: SensitivityLevel;

    /**
     * Tenant compartments (optional).
     * If specified, subject must have access to ALL listed tenants
     * at or above the object's sensitivity level.
     * Uses fruit emojis: 🍎, 🍌, 🍊, 🍇, 🍓
     */
    tenants?: string[];

    /**
     * Required roles (optional).
     * If specified, subject must have ALL listed roles.
     */
    roles?: string[];
}

/**
 * Default ACO for new records.
 */
export const DEFAULT_ACO: AccessControlObject = {
    sensitivity: "low",
};

// ============================================================================
// Security Context Object (SCO)
// ============================================================================

/**
 * Security Context Object - stored in each record's `sco` column.
 * Provides audit and context metadata (not used for access decisions).
 *
 * Stored as non-indexed JSON.
 */
export interface SecurityContextObject {
    /** ID of user who created/owns this record */
    ownerId?: string;

    /** Department that owns this data */
    ownerDepartment?: string;

    /** References to classification guide IDs */
    classificationGuideRefs?: string[];

    /** Natural language summary and citations for classification */
    classificationReason?: string;

    /** When security classification was last reviewed (ISO 8601) */
    lastReviewedAt?: string;

    /** Who last modified the security settings */
    lastModifiedBy?: string;

    /** Expiration date for sensitivity - auto-declassify (ISO 8601) */
    expiresAt?: string;
}

// ============================================================================
// Subject (Authenticated User)
// ============================================================================

/**
 * Subject - represents the authenticated user making a request.
 * Resolved from the current session/persona.
 */
export interface Subject {
    /** Unique identifier */
    id: string;

    /** Display name */
    name: string;

    /** Email address */
    email: string;

    /**
     * Clearance level (REQUIRED, never null).
     * Maximum sensitivity level the subject can access.
     */
    clearanceLevel: SensitivityLevel;

    /**
     * Tenant clearances in format "level:tenant".
     * Examples: ["moderate:🍎", "high:🍌"]
     */
    tenantClearances: string[];

    /**
     * Roles the subject possesses.
     * "global_admin" role bypasses all access checks.
     */
    roles: string[];

    /** Session ID for request correlation */
    sessionId?: string;

    /** IP address for audit logging */
    ipAddress?: string;
}

// ============================================================================
// Classification Guide
// ============================================================================

/**
 * Classification guide status lifecycle.
 */
export type ClassificationGuideStatus = "draft" | "active" | "superseded";

/**
 * Sensitivity guidance - descriptions for each level.
 */
export interface SensitivityGuidance {
    public: string;
    low: string;
    moderate: string;
    high: string;
}

/**
 * Classification Guide - provides English-level descriptions
 * of how to classify data by sensitivity, tenant, and role.
 */
export interface ClassificationGuide {
    /** Unique identifier (e.g., "CG-HR-001") */
    id: string;

    /** Version number for tracking changes */
    version: number;

    /** Human-readable title */
    title: string;

    /** Guidance for each sensitivity level */
    sensitivityGuidance: SensitivityGuidance;

    /** Per-tenant guidance (optional) */
    tenantGuidance?: Record<string, string>;

    /** Per-role guidance (optional) */
    roleGuidance?: Record<string, string>;

    /** When this guide became effective (ISO 8601) */
    effectiveDate: string;

    /** Current status */
    status: ClassificationGuideStatus;

    /** ID of guide that supersedes this one (if superseded) */
    supersededBy?: string;

    /** When created (ISO 8601) */
    createdAt: string;

    /** Who created this guide */
    createdBy: string;
}

// ============================================================================
// Access Decision
// ============================================================================

/**
 * Result of an access decision.
 */
export interface AccessDecision {
    /** Whether access is permitted */
    permitted: boolean;

    /** Reason for denial (if not permitted) */
    reason?: string;

    /** Which check failed (for debugging) */
    failedCheck?: "sensitivity" | "tenant" | "role";
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Parse tenant clearance string to level and tenant.
 * @example parseTenantClearance("moderate:🍎") => { level: "moderate", tenant: "🍎" }
 */
export function parseTenantClearance(
    clearance: string
): { level: SensitivityLevel; tenant: string } | null {
    const [level, tenant] = clearance.split(":");
    if (!level || !tenant) return null;
    if (!SENSITIVITY_ORDER.includes(level as SensitivityLevel)) return null;
    return { level: level as SensitivityLevel, tenant };
}

/**
 * Format tenant clearance from level and tenant.
 */
export function formatTenantClearance(
    level: SensitivityLevel,
    tenant: string
): string {
    return `${level}:${tenant}`;
}
