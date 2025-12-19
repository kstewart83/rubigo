/**
 * Session Resolver
 *
 * Resolves the current Subject from authentication context.
 * For now, this maps from the persona context to a Subject.
 * Real authentication will be added in a future phase.
 */

import type { Person } from "@/types/personnel";
import type { SensitivityLevel, Subject } from "./types";

/**
 * Resolve a Subject from a persona (for UI context).
 *
 * Maps the persona's access control fields to a Subject.
 * Falls back to defaults if fields are not set.
 */
export function resolveSubjectFromPersona(persona: Person): Subject {
    // Parse clearance level with fallback
    const clearanceLevel = parseCleananceLevel(persona.clearanceLevel) ?? "low";

    // Parse tenant clearances from JSON
    const tenantClearances = parseTenantClearances(persona.tenantClearances);

    // Parse roles from JSON
    const roles = parseRoles(persona.accessRoles, persona.isGlobalAdmin);

    return {
        id: persona.id,
        name: persona.name,
        email: persona.email,
        clearanceLevel,
        tenantClearances,
        roles,
    };
}

/**
 * Create a default Subject for development/testing.
 * Has global_admin role to bypass all checks.
 */
export function createDevSubject(): Subject {
    return {
        id: "dev-admin",
        name: "Development Admin",
        email: "dev@rubigo.local",
        clearanceLevel: "high",
        tenantClearances: [],
        roles: ["global_admin", "employee"],
    };
}

/**
 * Create a Subject with specific clearance for testing.
 */
export function createTestSubject(overrides: Partial<Subject> = {}): Subject {
    return {
        id: "test-user",
        name: "Test User",
        email: "test@rubigo.local",
        clearanceLevel: "low",
        tenantClearances: [],
        roles: ["employee"],
        ...overrides,
    };
}

// ============================================================================
// Helper Functions
// ============================================================================

const VALID_LEVELS: SensitivityLevel[] = ["public", "low", "moderate", "high"];

function parseCleananceLevel(value: unknown): SensitivityLevel | null {
    if (typeof value === "string" && VALID_LEVELS.includes(value as SensitivityLevel)) {
        return value as SensitivityLevel;
    }
    return null;
}

function parseTenantClearances(value: unknown): string[] {
    if (!value) return [];

    // If it's already an array, return it
    if (Array.isArray(value)) {
        return value.filter((v) => typeof v === "string");
    }

    // If it's a JSON string, parse it
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                return parsed.filter((v) => typeof v === "string");
            }
        } catch {
            // Not valid JSON
        }
    }

    return [];
}

function parseRoles(accessRoles: unknown, isGlobalAdmin?: boolean): string[] {
    const roles: string[] = [];

    // Parse access roles
    if (accessRoles) {
        if (Array.isArray(accessRoles)) {
            roles.push(...accessRoles.filter((v) => typeof v === "string"));
        } else if (typeof accessRoles === "string") {
            try {
                const parsed = JSON.parse(accessRoles);
                if (Array.isArray(parsed)) {
                    roles.push(...parsed.filter((v) => typeof v === "string"));
                }
            } catch {
                // Not valid JSON
            }
        }
    }

    // Add global_admin role if isGlobalAdmin flag is set
    if (isGlobalAdmin && !roles.includes("global_admin")) {
        roles.push("global_admin");
    }

    // Ensure at least employee role
    if (roles.length === 0) {
        roles.push("employee");
    }

    return roles;
}
