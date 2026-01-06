"use client";

/**
 * Secure Panel Wrapper
 *
 * Wraps a panel (form, card, etc.) with classification headers and footers
 * showing the sensitivity level of the data.
 */

import { Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import type { SensitivityLevel } from "@/lib/access-control/types";

// ============================================================================
// Color Configuration (matches SecurityBanner)
// ============================================================================

// Config for when level is null (unclassified)
const NONE_CONFIG = {
    label: "NONE",
    shortLabel: "NONE",
    bgClass: "bg-zinc-500/10 border-zinc-500/50",
    textClass: "text-zinc-400",
    icon: Shield,
};

const LEVEL_CONFIG: Record<SensitivityLevel, {
    label: string;
    shortLabel: string;
    bgClass: string;
    textClass: string;
    icon: typeof Shield;
}> = {
    public: {
        label: "PUBLIC",
        shortLabel: "PUB",
        bgClass: "bg-emerald-500/10 border-emerald-500/50",
        textClass: "text-emerald-400",
        icon: Shield,
    },
    low: {
        label: "LOW",
        shortLabel: "LOW",
        bgClass: "bg-sky-500/10 border-sky-500/50",
        textClass: "text-sky-400",
        icon: Shield,
    },
    moderate: {
        label: "MODERATE",
        shortLabel: "MOD",
        bgClass: "bg-amber-500/10 border-amber-500/50",
        textClass: "text-amber-400",
        icon: ShieldCheck,
    },
    high: {
        label: "HIGH",
        shortLabel: "HIGH",
        bgClass: "bg-red-500/10 border-red-500/50",
        textClass: "text-red-400",
        icon: ShieldAlert,
    },
};

// ============================================================================
// Classification Banner Component
// ============================================================================

interface ClassificationBannerProps {
    level: SensitivityLevel | null;
    compartments?: string[];
    /** Optional map of tenant -> level when tenant has different level than base */
    compartmentLevels?: Record<string, SensitivityLevel>;
    position: "header" | "footer";
}

function ClassificationBanner({ level, compartments = [], compartmentLevels = {}, position }: ClassificationBannerProps) {
    const config = level === null ? NONE_CONFIG : LEVEL_CONFIG[level];
    const Icon = config.icon;

    // Separate compartments into those at base level and those with different levels
    const compartmentsAtBase: string[] = [];
    const compartmentsWithDifferentLevel: { tenant: string; level: SensitivityLevel }[] = [];

    for (const tenant of compartments) {
        const tenantLevel = compartmentLevels[tenant];
        if (tenantLevel && tenantLevel !== level) {
            compartmentsWithDifferentLevel.push({ tenant, level: tenantLevel });
        } else {
            compartmentsAtBase.push(tenant);
        }
    }

    return (
        <div
            className={`
                flex items-center justify-center gap-2 px-4 h-7
                ${config.bgClass}
                ${position === "header" ? "border-b rounded-t-lg" : "border-t rounded-b-lg"}
                text-xs font-medium tracking-wide
            `}
        >
            <Icon className={`size-3.5 ${config.textClass}`} />
            <span className={config.textClass}>
                {config.label}
            </span>
            {/* Show compartments at base level normally */}
            {compartmentsAtBase.length > 0 && (
                <>
                    <span className="text-zinc-600">|</span>
                    <span className="text-sm">
                        {compartmentsAtBase.join(" ")}
                    </span>
                </>
            )}
            {/* Show compartments with different levels in parentheses */}
            {compartmentsWithDifferentLevel.map(({ tenant, level: tenantLevel }) => {
                const tenantConfig = LEVEL_CONFIG[tenantLevel];
                return (
                    <span key={tenant} className={`text-sm ${tenantConfig.textClass}`}>
                        ({tenantConfig.shortLabel} {tenant})
                    </span>
                );
            })}
        </div>
    );
}

// ============================================================================
// SecurePanelWrapper Component
// ============================================================================

interface SecurePanelWrapperProps {
    /** The content to wrap */
    children: React.ReactNode;
    /** The sensitivity level of the data in this panel (null = unclassified/NONE) */
    level: SensitivityLevel | null;
    /** Optional compartments associated with this data */
    compartments?: string[];
    /** Optional map of tenant -> level when tenant has different level than base */
    compartmentLevels?: Record<string, SensitivityLevel>;
    /** Additional className for the container */
    className?: string;
}

export function SecurePanelWrapper({
    children,
    level,
    compartments = [],
    compartmentLevels = {},
    className,
}: SecurePanelWrapperProps) {
    return (
        <div className={className}>
            <ClassificationBanner
                level={level}
                compartments={compartments}
                compartmentLevels={compartmentLevels}
                position="header"
            />
            {children}
            <ClassificationBanner
                level={level}
                compartments={compartments}
                compartmentLevels={compartmentLevels}
                position="footer"
            />
        </div>
    );
}
