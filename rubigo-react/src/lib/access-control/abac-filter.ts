/**
 * ABAC Session Filtering
 *
 * Server-side filtering of objects based on session security context.
 * Implements sensitivity level and compartment access control.
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
    /** Currently enabled compartments */
    activeCompartments: string[];
    /** Map of active compartment -> its current session level for tiered filtering */
    activeCompartmentLevels?: Record<string, SensitivityLevel>;
}

/**
 * Parsed ACO structure from JSON string.
 */
interface ParsedAco {
    sensitivity: SensitivityLevel;
    /** Raw compartment strings (may include LEVEL:COMPARTMENT format) */
    compartments: string[];
    /** Extracted compartment names (emoji/short name only) */
    compartmentNames: string[];
    /** Map of compartment name -> level (extracted from LEVEL:COMPARTMENT format) */
    compartmentLevels: Record<string, SensitivityLevel>;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Parse ACO JSON string into structured object.
 * Returns default LOW sensitivity if parsing fails.
 * Extracts compartment levels from "LEVEL:COMPARTMENT" format.
 */
export function parseAco(acoJson: string | null | undefined): ParsedAco {
    if (!acoJson) {
        return { sensitivity: "low", compartments: [], compartmentNames: [], compartmentLevels: {} };
    }
    try {
        const parsed = JSON.parse(acoJson);
        const sensitivity = (parsed.sensitivity as SensitivityLevel) || "low";
        const rawCompartments = Array.isArray(parsed.compartments) ? parsed.compartments : [];

        // Extract compartment names and levels from "LEVEL:COMPARTMENT" format
        const compartmentNames: string[] = [];
        const compartmentLevels: Record<string, SensitivityLevel> = {};

        for (const c of rawCompartments) {
            if (typeof c === "string" && c.includes(":")) {
                const [level, name] = c.split(":");
                if (level && name) {
                    const normalizedLevel = level.toLowerCase() as SensitivityLevel;
                    if (SENSITIVITY_ORDER.includes(normalizedLevel)) {
                        compartmentNames.push(name);
                        compartmentLevels[name] = normalizedLevel;
                    } else {
                        // Invalid level, treat as compartment name with base sensitivity
                        compartmentNames.push(c);
                        compartmentLevels[c] = sensitivity;
                    }
                }
            } else if (typeof c === "string") {
                // Plain compartment name without level - use base sensitivity
                compartmentNames.push(c);
                compartmentLevels[c] = sensitivity;
            }
        }

        return {
            sensitivity,
            compartments: rawCompartments,
            compartmentNames,
            compartmentLevels,
        };
    } catch {
        return { sensitivity: "low", compartments: [], compartmentNames: [], compartmentLevels: {} };
    }
}

/**
 * Check if a session can access an object based on its ACO.
 *
 * Access is granted if:
 * 1. Session level >= object sensitivity level (for uncompartmented data)
 * 2. For each compartment the object requires:
 *    - Session has that compartment enabled
 *    - Session's level for that compartment >= object's level for that compartment
 *
 * @param session - The active session context
 * @param aco - The parsed ACO of the object
 * @returns true if access is permitted
 */
export function canAccessObject(session: SessionContext, aco: ParsedAco): boolean {
    const activeCompartmentLevels = session.activeCompartmentLevels ?? {};

    // If object has no compartments, check base level only
    if (aco.compartmentNames.length === 0) {
        const sessionLevelIndex = SENSITIVITY_ORDER.indexOf(session.sessionLevel);
        const objectLevelIndex = SENSITIVITY_ORDER.indexOf(aco.sensitivity);
        return sessionLevelIndex >= objectLevelIndex;
    }

    // Object requires compartments - check each one
    for (const compartmentName of aco.compartmentNames) {
        // User must have this compartment in their active session
        if (!session.activeCompartments.includes(compartmentName)) {
            return false;
        }

        // Get the required level for this compartment from the ACO
        const requiredLevel = aco.compartmentLevels[compartmentName] ?? aco.sensitivity;
        const requiredLevelIndex = SENSITIVITY_ORDER.indexOf(requiredLevel);

        // Get user's session level for this compartment
        const userCompartmentLevel = activeCompartmentLevels[compartmentName] ?? session.sessionLevel;
        const userCompartmentLevelIndex = SENSITIVITY_ORDER.indexOf(userCompartmentLevel);

        // User's compartment level must be >= required level
        if (userCompartmentLevelIndex < requiredLevelIndex) {
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
