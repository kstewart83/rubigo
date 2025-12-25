/**
 * ABAC Session Filtering
 *
 * Server-side filtering of objects based on session security context.
 * Implements sensitivity level and tenant compartment access control.
 */

import { type SensitivityLevel, SENSITIVITY_ORDER } from "./types";

// ============================================================================
// Types
// ============================================================================

/**
 * Session context for access control decisions.
 * Represents the active security session of the requesting user.
 */
export interface SessionContext {
    /** Current session sensitivity level (may be lower than user's max) */
    sessionLevel: SensitivityLevel;
    /** Currently enabled tenant compartments */
    activeTenants: string[];
}

/**
 * Parsed ACO structure from JSON string.
 */
interface ParsedAco {
    sensitivity: SensitivityLevel;
    tenants: string[];
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Parse ACO JSON string into structured object.
 * Returns default LOW sensitivity if parsing fails.
 */
export function parseAco(acoJson: string | null | undefined): ParsedAco {
    if (!acoJson) {
        return { sensitivity: "low", tenants: [] };
    }
    try {
        const parsed = JSON.parse(acoJson);
        return {
            sensitivity: (parsed.sensitivity as SensitivityLevel) || "low",
            tenants: Array.isArray(parsed.tenants) ? parsed.tenants : [],
        };
    } catch {
        return { sensitivity: "low", tenants: [] };
    }
}

/**
 * Check if a session can access an object based on its ACO.
 *
 * Access is granted if:
 * 1. Session level >= object sensitivity level
 * 2. Session has ALL tenants required by the object (if any)
 *
 * @param session - The active session context
 * @param aco - The parsed ACO of the object
 * @returns true if access is permitted
 */
export function canAccessObject(session: SessionContext, aco: ParsedAco): boolean {
    // Check sensitivity level
    const sessionLevelIndex = SENSITIVITY_ORDER.indexOf(session.sessionLevel);
    const objectLevelIndex = SENSITIVITY_ORDER.indexOf(aco.sensitivity);

    if (sessionLevelIndex < objectLevelIndex) {
        // Session level is lower than object sensitivity - DENY
        return false;
    }

    // Check tenant compartments (if object has any)
    if (aco.tenants.length > 0) {
        // User must have ALL tenants in their active session
        const hasAllTenants = aco.tenants.every(tenant =>
            session.activeTenants.includes(tenant)
        );
        if (!hasAllTenants) {
            return false;
        }
    }

    return true;
}

/**
 * Filter a list of objects by session context.
 * Only returns objects the session is permitted to access.
 *
 * @param items - Array of objects with `aco` property (JSON string)
 * @param session - The active session context
 * @returns Filtered array containing only accessible objects
 */
export function filterBySession<T extends { aco?: string | null }>(
    items: T[],
    session: SessionContext
): T[] {
    return items.filter(item => {
        const aco = parseAco(item.aco);
        return canAccessObject(session, aco);
    });
}
