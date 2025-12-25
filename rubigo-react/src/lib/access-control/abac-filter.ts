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
    /** Map of active tenant -> its current session level for tiered filtering */
    activeTenantLevels?: Record<string, SensitivityLevel>;
}

/**
 * Parsed ACO structure from JSON string.
 */
interface ParsedAco {
    sensitivity: SensitivityLevel;
    /** Raw tenant strings (may include LEVEL:TENANT format) */
    tenants: string[];
    /** Extracted tenant names (emoji/short name only) */
    tenantNames: string[];
    /** Map of tenant name -> level (extracted from LEVEL:TENANT format) */
    tenantLevels: Record<string, SensitivityLevel>;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Parse ACO JSON string into structured object.
 * Returns default LOW sensitivity if parsing fails.
 * Extracts tenant levels from "LEVEL:TENANT" format.
 */
export function parseAco(acoJson: string | null | undefined): ParsedAco {
    if (!acoJson) {
        return { sensitivity: "low", tenants: [], tenantNames: [], tenantLevels: {} };
    }
    try {
        const parsed = JSON.parse(acoJson);
        const sensitivity = (parsed.sensitivity as SensitivityLevel) || "low";
        const rawTenants = Array.isArray(parsed.tenants) ? parsed.tenants : [];

        // Extract tenant names and levels from "LEVEL:TENANT" format
        const tenantNames: string[] = [];
        const tenantLevels: Record<string, SensitivityLevel> = {};

        for (const t of rawTenants) {
            if (typeof t === "string" && t.includes(":")) {
                const [level, name] = t.split(":");
                if (level && name) {
                    const normalizedLevel = level.toLowerCase() as SensitivityLevel;
                    if (SENSITIVITY_ORDER.includes(normalizedLevel)) {
                        tenantNames.push(name);
                        tenantLevels[name] = normalizedLevel;
                    } else {
                        // Invalid level, treat as tenant name with base sensitivity
                        tenantNames.push(t);
                        tenantLevels[t] = sensitivity;
                    }
                }
            } else if (typeof t === "string") {
                // Plain tenant name without level - use base sensitivity
                tenantNames.push(t);
                tenantLevels[t] = sensitivity;
            }
        }

        return {
            sensitivity,
            tenants: rawTenants,
            tenantNames,
            tenantLevels,
        };
    } catch {
        return { sensitivity: "low", tenants: [], tenantNames: [], tenantLevels: {} };
    }
}

/**
 * Check if a session can access an object based on its ACO.
 *
 * Access is granted if:
 * 1. Session level >= object sensitivity level (for untenanted data)
 * 2. For each tenant the object requires:
 *    - Session has that tenant enabled
 *    - Session's level for that tenant >= object's level for that tenant
 *
 * @param session - The active session context
 * @param aco - The parsed ACO of the object
 * @returns true if access is permitted
 */
export function canAccessObject(session: SessionContext, aco: ParsedAco): boolean {
    const activeTenantLevels = session.activeTenantLevels ?? {};

    // If object has no tenants, check base level only
    if (aco.tenantNames.length === 0) {
        const sessionLevelIndex = SENSITIVITY_ORDER.indexOf(session.sessionLevel);
        const objectLevelIndex = SENSITIVITY_ORDER.indexOf(aco.sensitivity);
        return sessionLevelIndex >= objectLevelIndex;
    }

    // Object requires tenants - check each one
    for (const tenantName of aco.tenantNames) {
        // User must have this tenant in their active session
        if (!session.activeTenants.includes(tenantName)) {
            return false;
        }

        // Get the required level for this tenant from the ACO
        const requiredLevel = aco.tenantLevels[tenantName] ?? aco.sensitivity;
        const requiredLevelIndex = SENSITIVITY_ORDER.indexOf(requiredLevel);

        // Get user's session level for this tenant
        const userTenantLevel = activeTenantLevels[tenantName] ?? session.sessionLevel;
        const userTenantLevelIndex = SENSITIVITY_ORDER.indexOf(userTenantLevel);

        // User's tenant level must be >= required level
        if (userTenantLevelIndex < requiredLevelIndex) {
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
