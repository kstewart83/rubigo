/**
 * Access Decision Algorithm
 *
 * Implements the core ABAC decision logic for determining whether
 * a subject can access an object based on their attributes.
 */

import type {
    AccessControlObject,
    AccessDecision,
    Subject,
} from "./types";
import {
    parseCompartmentClearance,
    sensitivityIndex,
} from "./types";

/**
 * Determine if a subject can access an object with the given ACO.
 *
 * Access is granted if ALL of the following are true:
 * 1. Subject has global_admin role (bypasses all checks), OR
 * 2. Subject clearance >= object sensitivity AND
 * 3. Subject has access to ALL required compartments at >= object sensitivity AND
 * 4. Subject has ALL required roles
 */
export function canAccess(subject: Subject, aco: AccessControlObject): AccessDecision {
    // Global admins bypass all checks
    if (subject.roles.includes("global_admin")) {
        return { permitted: true };
    }

    // 1. Sensitivity Check (REQUIRED)
    const subjectLevel = sensitivityIndex(subject.clearanceLevel);
    const objectLevel = sensitivityIndex(aco.sensitivity);

    if (subjectLevel < objectLevel) {
        return {
            permitted: false,
            reason: `Insufficient clearance: requires '${aco.sensitivity}', have '${subject.clearanceLevel}'`,
            failedCheck: "sensitivity",
        };
    }

    // 2. Compartment Check (if compartments specified)
    if (aco.compartments && aco.compartments.length > 0) {
        for (const compartment of aco.compartments) {
            const compartmentAccess = getSubjectCompartmentLevel(subject, compartment);

            if (!compartmentAccess) {
                return {
                    permitted: false,
                    reason: `No access to compartment '${compartment}'`,
                    failedCheck: "compartment",
                };
            }

            // Subject must have compartment access at or above object sensitivity
            const compartmentLevelIdx = sensitivityIndex(compartmentAccess as import("./types").SensitivityLevel);
            if (compartmentLevelIdx < objectLevel) {
                return {
                    permitted: false,
                    reason: `Insufficient compartment clearance for '${compartment}': requires '${aco.sensitivity}', have '${compartmentAccess}'`,
                    failedCheck: "compartment",
                };
            }
        }
    }

    // 3. Role Check (if roles specified)
    if (aco.roles && aco.roles.length > 0) {
        for (const role of aco.roles) {
            if (!subject.roles.includes(role)) {
                return {
                    permitted: false,
                    reason: `Missing required role: '${role}'`,
                    failedCheck: "role",
                };
            }
        }
    }

    return { permitted: true };
}

/**
 * Get a subject's clearance level for a specific compartment.
 * Returns null if the subject has no access to that compartment.
 */
function getSubjectCompartmentLevel(
    subject: Subject,
    compartment: string
): string | null {
    for (const clearance of subject.compartmentClearances) {
        const parsed = parseCompartmentClearance(clearance);
        if (parsed && parsed.compartment === compartment) {
            return parsed.level;
        }
    }
    return null;
}

/**
 * Determine if a subject can modify an ACO from one value to another.
 *
 * A subject can modify an ACO if:
 * 1. They can access records with the current ACO (they can see it)
 * 2. They can access records with the new ACO (they could see the result)
 *
 * This prevents escalation beyond one's own clearance level.
 */
export function canModifyACO(
    subject: Subject,
    currentACO: AccessControlObject,
    newACO: AccessControlObject
): AccessDecision {
    // Must be able to see the record (current ACO)
    const currentAccess = canAccess(subject, currentACO);
    if (!currentAccess.permitted) {
        return {
            permitted: false,
            reason: `Cannot modify: no access to current record`,
        };
    }

    // Must be able to see records with the new ACO
    const newAccess = canAccess(subject, newACO);
    if (!newAccess.permitted) {
        return {
            permitted: false,
            reason: `Cannot classify beyond your clearance: ${newAccess.reason}`,
        };
    }

    return { permitted: true };
}

/**
 * Filter an array of records to only those the subject can access.
 * Assumes each record has an `aco` property.
 */
export function filterByAccess<T extends { aco: string }>(
    records: T[],
    subject: Subject
): T[] {
    return records.filter((record) => {
        try {
            const aco: AccessControlObject = JSON.parse(record.aco);
            return canAccess(subject, aco).permitted;
        } catch {
            // If ACO is invalid, deny access
            return false;
        }
    });
}
