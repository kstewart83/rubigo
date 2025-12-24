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

const LEVEL_CONFIG: Record<SensitivityLevel, {
    label: string;
    bgClass: string;
    textClass: string;
    icon: typeof Shield;
}> = {
    public: {
        label: "PUBLIC",
        bgClass: "bg-emerald-500/10 border-emerald-500/50",
        textClass: "text-emerald-400",
        icon: Shield,
    },
    low: {
        label: "LOW",
        bgClass: "bg-sky-500/10 border-sky-500/50",
        textClass: "text-sky-400",
        icon: Shield,
    },
    moderate: {
        label: "MODERATE",
        bgClass: "bg-amber-500/10 border-amber-500/50",
        textClass: "text-amber-400",
        icon: ShieldCheck,
    },
    high: {
        label: "HIGH",
        bgClass: "bg-red-500/10 border-red-500/50",
        textClass: "text-red-400",
        icon: ShieldAlert,
    },
};

// ============================================================================
// Classification Banner Component
// ============================================================================

interface ClassificationBannerProps {
    level: SensitivityLevel;
    tenants?: string[];
    position: "header" | "footer";
}

function ClassificationBanner({ level, tenants = [], position }: ClassificationBannerProps) {
    const config = LEVEL_CONFIG[level];
    const Icon = config.icon;

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
            {tenants.length > 0 && (
                <>
                    <span className="text-zinc-600">|</span>
                    <span className="text-sm">
                        {tenants.join(" ")}
                    </span>
                </>
            )}
        </div>
    );
}

// ============================================================================
// SecurePanelWrapper Component
// ============================================================================

interface SecurePanelWrapperProps {
    /** The content to wrap */
    children: React.ReactNode;
    /** The sensitivity level of the data in this panel */
    level: SensitivityLevel;
    /** Optional tenants associated with this data */
    tenants?: string[];
    /** Additional className for the container */
    className?: string;
}

export function SecurePanelWrapper({
    children,
    level,
    tenants = [],
    className,
}: SecurePanelWrapperProps) {
    return (
        <div className={className}>
            <ClassificationBanner
                level={level}
                tenants={tenants}
                position="header"
            />
            {children}
            <ClassificationBanner
                level={level}
                tenants={tenants}
                position="footer"
            />
        </div>
    );
}
