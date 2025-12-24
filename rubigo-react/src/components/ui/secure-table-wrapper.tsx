"use client";

/**
 * Secure Table Wrapper
 *
 * Wraps a table with classification headers and footers showing the highest
 * sensitivity level of the visible data.
 */

import { useMemo } from "react";
import { Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import type { SensitivityLevel } from "@/lib/access-control/types";
import { SENSITIVITY_ORDER } from "@/lib/access-control/types";

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
// SecureTableWrapper Component
// ============================================================================

interface SecureTableWrapperProps<T> {
    /** The table to wrap */
    children: React.ReactNode;
    /** Array of items displayed in the table */
    items: T[];
    /** Function to extract sensitivity level from each item */
    getSensitivity: (item: T) => SensitivityLevel;
    /** Optional function to extract tenants from each item */
    getTenants?: (item: T) => string[];
    /** Default level if no items (defaults to "public") */
    defaultLevel?: SensitivityLevel;
    /** Additional className for the container */
    className?: string;
}

export function SecureTableWrapper<T>({
    children,
    items,
    getSensitivity,
    getTenants,
    defaultLevel = "public",
    className,
}: SecureTableWrapperProps<T>) {
    // Calculate highest sensitivity level from visible items
    const { highestLevel, allTenants } = useMemo(() => {
        if (items.length === 0) {
            return { highestLevel: defaultLevel, allTenants: [] as string[] };
        }

        let maxIndex = -1;
        let highestLevel: SensitivityLevel = defaultLevel;
        const tenantSet = new Set<string>();

        for (const item of items) {
            const level = getSensitivity(item);
            const index = SENSITIVITY_ORDER.indexOf(level);
            if (index > maxIndex) {
                maxIndex = index;
                highestLevel = level;
            }

            if (getTenants) {
                const itemTenants = getTenants(item);
                for (const t of itemTenants) {
                    tenantSet.add(t);
                }
            }
        }

        return {
            highestLevel,
            allTenants: Array.from(tenantSet),
        };
    }, [items, getSensitivity, getTenants, defaultLevel]);

    return (
        <div className={className}>
            <ClassificationBanner
                level={highestLevel}
                tenants={allTenants}
                position="header"
            />
            {children}
            <ClassificationBanner
                level={highestLevel}
                tenants={allTenants}
                position="footer"
            />
        </div>
    );
}
