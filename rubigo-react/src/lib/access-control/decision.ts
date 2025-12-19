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
    parseTenantClearance,
    sensitivityIndex,
} from "./types";

/**
 * Determine if a subject can access an object with the given ACO.
 *
 * Access is granted if ALL of the following are true:
 * 1. Subject has global_admin role (bypasses all checks), OR
 * 2. Subject clearance >= object sensitivity AND
 * 3. Subject has access to ALL required tenants at >= object sensitivity AND
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

    // 2. Tenant Check (if tenants specified)
    if (aco.tenants && aco.tenants.length > 0) {
        for (const tenant of aco.tenants) {
            const tenantAccess = getSubjectTenantLevel(subject, tenant);

            if (!tenantAccess) {
                return {
                    permitted: false,
                    reason: `No access to tenant '${tenant}'`,
                    failedCheck: "tenant",
                };
            }

            // Subject must have tenant access at or above object sensitivity
            const tenantLevelIdx = sensitivityIndex(tenantAccess as import("./types").SensitivityLevel);
            if (tenantLevelIdx < objectLevel) {
                return {
                    permitted: false,
                    reason: `Insufficient tenant clearance for '${tenant}': requires '${aco.sensitivity}', have '${tenantAccess}'`,
                    failedCheck: "tenant",
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
 * Get a subject's clearance level for a specific tenant.
 * Returns null if the subject has no access to that tenant.
 */
function getSubjectTenantLevel(
    subject: Subject,
    tenant: string
): string | null {
    for (const clearance of subject.tenantClearances) {
        const parsed = parseTenantClearance(clearance);
        if (parsed && parsed.tenant === tenant) {
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
