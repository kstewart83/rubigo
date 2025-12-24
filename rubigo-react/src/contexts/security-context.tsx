"use client";

/**
 * Security Context
 *
 * Provides security state derived from the current persona.
 * Exposes clearance level, tenant clearances, and roles.
 * Supports session-level overrides for testing at lower clearance levels.
 */

import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from "react";
import type { Person } from "@/types/personnel";
import type { Subject, SensitivityLevel } from "@/lib/access-control/types";
import { SENSITIVITY_ORDER } from "@/lib/access-control/types";
import { resolveSubjectFromPersona } from "@/lib/access-control/session-resolver";

// ============================================================================
// Types
// ============================================================================

/** Tenant clearance with its level */
export interface TenantClearance {
    tenant: string;
    maxLevel: SensitivityLevel;
    sessionLevel: SensitivityLevel;
    enabled: boolean;
}

interface SecurityContextType {
    /** Current subject (derived from persona) */
    subject: Subject | null;
    /** Maximum clearance level from persona */
    maxClearanceLevel: SensitivityLevel;
    /** Active session clearance level (can be lowered by user) */
    sessionLevel: SensitivityLevel;
    /** Set the session level (can only be <= maxClearanceLevel) */
    setSessionLevel: (level: SensitivityLevel) => void;
    /** Available levels user can choose for session (up to their max) */
    availableLevels: SensitivityLevel[];
    /** Detailed tenant clearances with per-tenant control */
    tenantClearances: TenantClearance[];
    /** Toggle a tenant on/off */
    toggleTenant: (tenant: string) => void;
    /** Set a tenant's session level */
    setTenantLevel: (tenant: string, level: SensitivityLevel) => void;
    /** Unique tenants the user has access to (enabled ones at session level) */
    activeTenants: string[];
    /** User roles */
    roles: string[];
    /** Whether user is a global admin */
    isGlobalAdmin: boolean;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

interface SecurityProviderProps {
    children: ReactNode;
    persona: Person | null;
}

export function SecurityProvider({ children, persona }: SecurityProviderProps) {
    const [sessionLevelOverride, setSessionLevelOverride] = useState<SensitivityLevel | null>(null);
    // Map of tenant -> { enabled, sessionLevel }
    const [tenantOverrides, setTenantOverrides] = useState<Record<string, { enabled: boolean; sessionLevel: SensitivityLevel }>>({});

    // Parse tenant clearances from persona
    const parsedTenants = useMemo(() => {
        if (!persona) return [];
        const subject = resolveSubjectFromPersona(persona);

        // Parse "level:tenant" format
        const tenantMap = new Map<string, SensitivityLevel>();
        for (const tc of subject.tenantClearances) {
            const [level, tenant] = tc.split(":");
            if (level && tenant) {
                const currentMax = tenantMap.get(tenant);
                const levelIndex = SENSITIVITY_ORDER.indexOf(level as SensitivityLevel);
                const currentIndex = currentMax ? SENSITIVITY_ORDER.indexOf(currentMax) : -1;
                if (levelIndex > currentIndex) {
                    tenantMap.set(tenant, level as SensitivityLevel);
                }
            }
        }

        return Array.from(tenantMap.entries()).map(([tenant, maxLevel]) => ({
            tenant,
            maxLevel,
        }));
    }, [persona]);

    const value = useMemo<SecurityContextType>(() => {
        if (!persona) {
            return {
                subject: null,
                maxClearanceLevel: "public",
                sessionLevel: "public",
                setSessionLevel: () => { },
                availableLevels: ["public"],
                tenantClearances: [],
                toggleTenant: () => { },
                setTenantLevel: () => { },
                activeTenants: [],
                roles: [],
                isGlobalAdmin: false,
            };
        }

        const subject = resolveSubjectFromPersona(persona);
        const maxClearanceLevel = subject.clearanceLevel;
        const maxIndex = SENSITIVITY_ORDER.indexOf(maxClearanceLevel);

        // Available levels are all levels up to and including the user's max
        const availableLevels = SENSITIVITY_ORDER.slice(0, maxIndex + 1) as SensitivityLevel[];

        // Session level is the override if valid, otherwise max
        let sessionLevel = maxClearanceLevel;
        if (sessionLevelOverride) {
            const overrideIndex = SENSITIVITY_ORDER.indexOf(sessionLevelOverride);
            if (overrideIndex <= maxIndex) {
                sessionLevel = sessionLevelOverride;
            }
        }
        const sessionLevelIndex = SENSITIVITY_ORDER.indexOf(sessionLevel);

        // Build tenant clearances with overrides
        const tenantClearances: TenantClearance[] = parsedTenants.map(({ tenant, maxLevel }) => {
            const override = tenantOverrides[tenant];
            const maxLevelIndex = SENSITIVITY_ORDER.indexOf(maxLevel);

            // Cap max level by session level
            const effectiveMaxLevel = maxLevelIndex <= sessionLevelIndex
                ? maxLevel
                : sessionLevel;
            const effectiveMaxIndex = SENSITIVITY_ORDER.indexOf(effectiveMaxLevel);

            // Default session level is the effective max
            let tenantSessionLevel = effectiveMaxLevel;
            if (override?.sessionLevel) {
                const overrideIndex = SENSITIVITY_ORDER.indexOf(override.sessionLevel);
                if (overrideIndex <= effectiveMaxIndex) {
                    tenantSessionLevel = override.sessionLevel;
                }
            }

            // Default enabled unless explicitly disabled, but disabled if above session level
            const isAboveSessionLevel = maxLevelIndex > sessionLevelIndex;
            const enabled = isAboveSessionLevel ? false : (override?.enabled ?? true);

            return {
                tenant,
                maxLevel,
                sessionLevel: tenantSessionLevel,
                enabled,
            };
        });

        // Active tenants are enabled ones
        const activeTenants = tenantClearances
            .filter(tc => tc.enabled)
            .map(tc => tc.tenant);

        return {
            subject,
            maxClearanceLevel,
            sessionLevel,
            setSessionLevel: (level: SensitivityLevel) => {
                const levelIndex = SENSITIVITY_ORDER.indexOf(level);
                if (levelIndex <= maxIndex) {
                    setSessionLevelOverride(level);
                }
            },
            availableLevels,
            tenantClearances,
            toggleTenant: (tenant: string) => {
                setTenantOverrides(prev => {
                    const current = prev[tenant] ?? { enabled: true, sessionLevel: "public" };
                    return { ...prev, [tenant]: { ...current, enabled: !current.enabled } };
                });
            },
            setTenantLevel: (tenant: string, level: SensitivityLevel) => {
                setTenantOverrides(prev => {
                    const current = prev[tenant] ?? { enabled: true, sessionLevel: level };
                    return { ...prev, [tenant]: { ...current, sessionLevel: level } };
                });
            },
            activeTenants,
            roles: subject.roles,
            isGlobalAdmin: subject.roles.includes("global_admin"),
        };
    }, [persona, sessionLevelOverride, tenantOverrides, parsedTenants]);

    return (
        <SecurityContext.Provider value={value}>
            {children}
        </SecurityContext.Provider>
    );
}

// ============================================================================
// Hook
// ============================================================================

export function useSecurity() {
    const context = useContext(SecurityContext);
    if (context === undefined) {
        throw new Error("useSecurity must be used within a SecurityProvider");
    }
    return context;
}
