"use client";

/**
 * Security Context
 *
 * Provides security state derived from the current persona.
 * Exposes clearance level, compartment clearances, and roles.
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

/** Compartment clearance with its level */
export interface CompartmentClearance {
    compartment: string;
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
    /** Detailed compartment clearances with per-compartment control */
    compartmentClearances: CompartmentClearance[];
    /** Toggle a compartment on/off */
    toggleCompartment: (compartment: string) => void;
    /** Set a compartment's session level */
    setCompartmentLevel: (compartment: string, level: SensitivityLevel) => void;
    /** Unique compartments the user has access to (enabled ones at session level) */
    activeCompartments: string[];
    /** Map of active compartment -> its current session level (for filtering) */
    activeCompartmentLevels: Record<string, SensitivityLevel>;
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
    // Map of compartment -> { enabled, sessionLevel }
    const [compartmentOverrides, setCompartmentOverrides] = useState<Record<string, { enabled: boolean; sessionLevel: SensitivityLevel }>>({});

    // Parse compartment clearances from persona
    const parsedCompartments = useMemo(() => {
        if (!persona) return [];
        const subject = resolveSubjectFromPersona(persona);

        // Parse "level:compartment" format
        const compartmentMap = new Map<string, SensitivityLevel>();
        for (const cc of subject.compartmentClearances) {
            const [level, compartment] = cc.split(":");
            if (level && compartment) {
                const currentMax = compartmentMap.get(compartment);
                const levelIndex = SENSITIVITY_ORDER.indexOf(level as SensitivityLevel);
                const currentIndex = currentMax ? SENSITIVITY_ORDER.indexOf(currentMax) : -1;
                if (levelIndex > currentIndex) {
                    compartmentMap.set(compartment, level as SensitivityLevel);
                }
            }
        }

        return Array.from(compartmentMap.entries()).map(([compartment, maxLevel]) => ({
            compartment,
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
                compartmentClearances: [],
                toggleCompartment: () => { },
                setCompartmentLevel: () => { },
                activeCompartments: [],
                activeCompartmentLevels: {},
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

        // Build compartment clearances with overrides
        const compartmentClearances: CompartmentClearance[] = parsedCompartments.map(({ compartment, maxLevel }) => {
            const override = compartmentOverrides[compartment];
            const maxLevelIndex = SENSITIVITY_ORDER.indexOf(maxLevel);

            // Cap max level by session level
            const effectiveMaxLevel = maxLevelIndex <= sessionLevelIndex
                ? maxLevel
                : sessionLevel;
            const effectiveMaxIndex = SENSITIVITY_ORDER.indexOf(effectiveMaxLevel);

            // Default session level is the effective max
            let compartmentSessionLevel = effectiveMaxLevel;
            if (override?.sessionLevel) {
                const overrideIndex = SENSITIVITY_ORDER.indexOf(override.sessionLevel);
                if (overrideIndex <= effectiveMaxIndex) {
                    compartmentSessionLevel = override.sessionLevel;
                }
            }

            // Default enabled unless explicitly disabled, but disabled if above session level
            const isAboveSessionLevel = maxLevelIndex > sessionLevelIndex;
            const enabled = isAboveSessionLevel ? false : (override?.enabled ?? true);

            return {
                compartment,
                maxLevel,
                sessionLevel: compartmentSessionLevel,
                enabled,
            };
        });

        // Active compartments are enabled ones
        const activeCompartments = compartmentClearances
            .filter(cc => cc.enabled)
            .map(cc => cc.compartment);

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
            compartmentClearances,
            toggleCompartment: (compartment: string) => {
                // Lookup this compartment's effective max level for proper default
                const cc = compartmentClearances.find(c => c.compartment === compartment);
                const defaultLevel = cc?.sessionLevel ?? sessionLevel;

                setCompartmentOverrides(prev => {
                    const current = prev[compartment] ?? { enabled: false, sessionLevel: defaultLevel };
                    return { ...prev, [compartment]: { ...current, enabled: !current.enabled } };
                });
            },
            setCompartmentLevel: (compartment: string, level: SensitivityLevel) => {
                setCompartmentOverrides(prev => {
                    const current = prev[compartment] ?? { enabled: true, sessionLevel: level };
                    return { ...prev, [compartment]: { ...current, sessionLevel: level } };
                });
            },
            activeCompartments,
            // Map of active compartment -> its session level for filtering
            activeCompartmentLevels: compartmentClearances
                .filter(cc => cc.enabled)
                .reduce((acc, cc) => {
                    acc[cc.compartment] = cc.sessionLevel;
                    return acc;
                }, {} as Record<string, SensitivityLevel>),
            roles: subject.roles,
            isGlobalAdmin: subject.roles.includes("global_admin"),
        };
    }, [persona, sessionLevelOverride, compartmentOverrides, parsedCompartments]);

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
