/**
 * Access Control Decision Algorithm Tests
 *
 * Tests for canAccess() and canModifyACO() functions.
 * Test cases correspond to scenarios in access-control.toml.
 */

import { describe, expect, it } from "bun:test";
import {
    canAccess,
    canModifyACO,
    filterByAccess,
} from "@/lib/access-control/decision";
import type { AccessControlObject, Subject } from "@/lib/access-control/types";
import { createTestSubject } from "@/lib/access-control/session-resolver";

// ============================================================================
// Test Helpers
// ============================================================================

function makeSubject(overrides: Partial<Subject> = {}): Subject {
    return createTestSubject(overrides);
}

function makeACO(overrides: Partial<AccessControlObject> = {}): AccessControlObject {
    return {
        sensitivity: "low",
        ...overrides,
    };
}

// ============================================================================
// Global Admin Bypass
// ============================================================================

describe("Global Admin Bypass", () => {
    it("scen-role-global-admin-bypass: bypasses all checks", () => {
        const subject = makeSubject({
            roles: ["global_admin"],
            clearanceLevel: "public", // Even with lowest clearance
        });

        const aco = makeACO({
            sensitivity: "high",
            tenants: ["🍎"],
            roles: ["secret_committee"],
        });

        const result = canAccess(subject, aco);
        expect(result.permitted).toBe(true);
    });
});

// ============================================================================
// Sensitivity Level Tests
// ============================================================================

describe("Sensitivity Level", () => {
    it("scen-sensitivity-filter-list: can access at or below clearance", () => {
        const subject = makeSubject({ clearanceLevel: "moderate" });

        expect(canAccess(subject, makeACO({ sensitivity: "public" })).permitted).toBe(true);
        expect(canAccess(subject, makeACO({ sensitivity: "low" })).permitted).toBe(true);
        expect(canAccess(subject, makeACO({ sensitivity: "moderate" })).permitted).toBe(true);
    });

    it("scen-sensitivity-block-detail: cannot access above clearance", () => {
        const subject = makeSubject({ clearanceLevel: "moderate" });
        const aco = makeACO({ sensitivity: "high" });

        const result = canAccess(subject, aco);
        expect(result.permitted).toBe(false);
        expect(result.failedCheck).toBe("sensitivity");
        expect(result.reason).toContain("requires 'high'");
    });

    it("scen-sensitivity-create-blocked: test sensitivity ordering", () => {
        const subject = makeSubject({ clearanceLevel: "low" });

        expect(canAccess(subject, makeACO({ sensitivity: "public" })).permitted).toBe(true);
        expect(canAccess(subject, makeACO({ sensitivity: "low" })).permitted).toBe(true);
        expect(canAccess(subject, makeACO({ sensitivity: "moderate" })).permitted).toBe(false);
        expect(canAccess(subject, makeACO({ sensitivity: "high" })).permitted).toBe(false);
    });
});

// ============================================================================
// Tenant Access Tests
// ============================================================================

describe("Tenant Access", () => {
    it("scen-tenant-single-access: can access with tenant clearance", () => {
        const subject = makeSubject({
            clearanceLevel: "moderate",
            tenantClearances: ["moderate:🍎"],
        });

        const aco = makeACO({
            sensitivity: "low",
            tenants: ["🍎"],
        });

        expect(canAccess(subject, aco).permitted).toBe(true);
    });

    it("scen-tenant-single-blocked: blocked without tenant access", () => {
        const subject = makeSubject({
            clearanceLevel: "moderate",
            tenantClearances: [], // No tenant access
        });

        const aco = makeACO({
            sensitivity: "low",
            tenants: ["🍎"],
        });

        const result = canAccess(subject, aco);
        expect(result.permitted).toBe(false);
        expect(result.failedCheck).toBe("tenant");
        expect(result.reason).toContain("No access to tenant '🍎'");
    });

    it("scen-tenant-insufficient-level: blocked with insufficient tenant level", () => {
        const subject = makeSubject({
            clearanceLevel: "moderate",
            tenantClearances: ["low:🍎"], // Only low clearance for 🍎
        });

        const aco = makeACO({
            sensitivity: "moderate", // Requires moderate
            tenants: ["🍎"],
        });

        const result = canAccess(subject, aco);
        expect(result.permitted).toBe(false);
        expect(result.failedCheck).toBe("tenant");
        expect(result.reason).toContain("Insufficient tenant clearance");
    });

    it("scen-tenant-multi-all: access requires ALL tenants", () => {
        const subject = makeSubject({
            clearanceLevel: "moderate",
            tenantClearances: ["moderate:🍎"], // Only 🍎, not 🍌
        });

        const aco = makeACO({
            sensitivity: "low",
            tenants: ["🍎", "🍌"], // Requires both
        });

        const result = canAccess(subject, aco);
        expect(result.permitted).toBe(false);
        expect(result.failedCheck).toBe("tenant");
    });

    it("can access with all required tenants", () => {
        const subject = makeSubject({
            clearanceLevel: "high",
            tenantClearances: ["high:🍎", "high:🍌"],
        });

        const aco = makeACO({
            sensitivity: "moderate",
            tenants: ["🍎", "🍌"],
        });

        expect(canAccess(subject, aco).permitted).toBe(true);
    });

    it("null tenants means no tenant restriction", () => {
        const subject = makeSubject({
            clearanceLevel: "moderate",
            tenantClearances: [], // No tenant access
        });

        const aco = makeACO({
            sensitivity: "low",
            // No tenants field - should be accessible
        });

        expect(canAccess(subject, aco).permitted).toBe(true);
    });
});

// ============================================================================
// Role Requirement Tests
// ============================================================================

describe("Role Requirements", () => {
    it("scen-role-single-access: can access with required role", () => {
        const subject = makeSubject({
            roles: ["employee", "hr_viewer"],
        });

        const aco = makeACO({
            roles: ["hr_viewer"],
        });

        expect(canAccess(subject, aco).permitted).toBe(true);
    });

    it("scen-role-single-blocked: blocked without required role", () => {
        const subject = makeSubject({
            roles: ["employee"], // No hr_viewer
        });

        const aco = makeACO({
            roles: ["hr_viewer"],
        });

        const result = canAccess(subject, aco);
        expect(result.permitted).toBe(false);
        expect(result.failedCheck).toBe("role");
        expect(result.reason).toContain("Missing required role: 'hr_viewer'");
    });

    it("scen-role-multi-partial: partial roles insufficient", () => {
        const subject = makeSubject({
            roles: ["manager"], // Has manager, but not hr_viewer
        });

        const aco = makeACO({
            roles: ["manager", "hr_viewer"], // Requires both
        });

        const result = canAccess(subject, aco);
        expect(result.permitted).toBe(false);
        expect(result.failedCheck).toBe("role");
    });

    it("can access with all required roles", () => {
        const subject = makeSubject({
            roles: ["manager", "hr_viewer", "employee"],
        });

        const aco = makeACO({
            roles: ["manager", "hr_viewer"],
        });

        expect(canAccess(subject, aco).permitted).toBe(true);
    });

    it("null roles means no role restriction", () => {
        const subject = makeSubject({
            roles: ["employee"],
        });

        const aco = makeACO({
            // No roles field - should be accessible
        });

        expect(canAccess(subject, aco).permitted).toBe(true);
    });
});

// ============================================================================
// Combined Checks
// ============================================================================

describe("Combined Access Checks", () => {
    it("passes all three dimensions", () => {
        const subject = makeSubject({
            clearanceLevel: "high",
            tenantClearances: ["high:🍎"],
            roles: ["hr_viewer", "manager"],
        });

        const aco = makeACO({
            sensitivity: "moderate",
            tenants: ["🍎"],
            roles: ["hr_viewer"],
        });

        expect(canAccess(subject, aco).permitted).toBe(true);
    });

    it("fails on sensitivity even with valid tenants and roles", () => {
        const subject = makeSubject({
            clearanceLevel: "low", // Too low
            tenantClearances: ["high:🍎"],
            roles: ["hr_viewer"],
        });

        const aco = makeACO({
            sensitivity: "high",
            tenants: ["🍎"],
            roles: ["hr_viewer"],
        });

        const result = canAccess(subject, aco);
        expect(result.permitted).toBe(false);
        expect(result.failedCheck).toBe("sensitivity");
    });

    it("fails on tenant even with valid sensitivity and roles", () => {
        const subject = makeSubject({
            clearanceLevel: "high",
            tenantClearances: [], // Missing tenant
            roles: ["hr_viewer"],
        });

        const aco = makeACO({
            sensitivity: "low",
            tenants: ["🍎"],
            roles: ["hr_viewer"],
        });

        const result = canAccess(subject, aco);
        expect(result.permitted).toBe(false);
        expect(result.failedCheck).toBe("tenant");
    });

    it("fails on role even with valid sensitivity and tenants", () => {
        const subject = makeSubject({
            clearanceLevel: "high",
            tenantClearances: ["high:🍎"],
            roles: ["employee"], // Missing hr_viewer
        });

        const aco = makeACO({
            sensitivity: "low",
            tenants: ["🍎"],
            roles: ["hr_viewer"],
        });

        const result = canAccess(subject, aco);
        expect(result.permitted).toBe(false);
        expect(result.failedCheck).toBe("role");
    });
});

// ============================================================================
// ACO Modification Tests
// ============================================================================

describe("ACO Modification", () => {
    it("scen-aco-modify-within-clearance: can modify within clearance", () => {
        const subject = makeSubject({ clearanceLevel: "moderate" });
        const currentACO = makeACO({ sensitivity: "low" });
        const newACO = makeACO({ sensitivity: "moderate" });

        const result = canModifyACO(subject, currentACO, newACO);
        expect(result.permitted).toBe(true);
    });

    it("scen-aco-modify-blocked: cannot modify beyond clearance", () => {
        const subject = makeSubject({ clearanceLevel: "moderate" });
        const currentACO = makeACO({ sensitivity: "low" });
        const newACO = makeACO({ sensitivity: "high" }); // Beyond clearance

        const result = canModifyACO(subject, currentACO, newACO);
        expect(result.permitted).toBe(false);
        expect(result.reason).toContain("Cannot classify beyond your clearance");
    });

    it("cannot modify record you cannot access", () => {
        const subject = makeSubject({ clearanceLevel: "low" });
        const currentACO = makeACO({ sensitivity: "high" }); // Can't access this
        const newACO = makeACO({ sensitivity: "low" });

        const result = canModifyACO(subject, currentACO, newACO);
        expect(result.permitted).toBe(false);
        expect(result.reason).toContain("no access to current record");
    });
});

// ============================================================================
// Filter By Access Tests
// ============================================================================

describe("Filter By Access", () => {
    it("filters array to accessible records", () => {
        const subject = makeSubject({ clearanceLevel: "moderate" });

        const records = [
            { id: "1", aco: '{"sensitivity":"public"}' },
            { id: "2", aco: '{"sensitivity":"low"}' },
            { id: "3", aco: '{"sensitivity":"moderate"}' },
            { id: "4", aco: '{"sensitivity":"high"}' },
        ];

        const filtered = filterByAccess(records, subject);
        expect(filtered.map((r) => r.id)).toEqual(["1", "2", "3"]);
    });

    it("handles invalid ACO JSON gracefully", () => {
        const subject = makeSubject({ clearanceLevel: "high" });

        const records = [
            { id: "1", aco: '{"sensitivity":"low"}' },
            { id: "2", aco: "invalid json" },
            { id: "3", aco: '{"sensitivity":"moderate"}' },
        ];

        const filtered = filterByAccess(records, subject);
        expect(filtered.map((r) => r.id)).toEqual(["1", "3"]);
    });
});
