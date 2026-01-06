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
import { cn } from "@/lib/utils";

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

// Fallback config for unknown levels
const UNKNOWN_CONFIG = {
    label: "UNKNOWN",
    bgClass: "bg-zinc-500/10 border-zinc-500/50",
    textClass: "text-zinc-400",
    icon: Shield,
};

// ============================================================================
// Classification Banner Component
// ============================================================================

interface ClassificationBannerProps {
    level: SensitivityLevel | null;
    compartments?: string[];
    position: "header" | "footer";
}

function ClassificationBanner({ level, compartments = [], position }: ClassificationBannerProps) {
    // Handle null level (no classification)
    if (level === null) {
        return (
            <div
                className={`
                    flex items-center justify-center gap-2 px-4 h-7
                    bg-zinc-500/10 border-zinc-500/50
                    ${position === "header" ? "border-b rounded-t-lg" : "border-t rounded-b-lg"}
                    text-xs font-medium tracking-wide
                `}
            >
                <Shield className="size-3.5 text-zinc-400" />
                <span className="text-zinc-400">NONE</span>
            </div>
        );
    }

    const config = LEVEL_CONFIG[level];
    const Icon = config.icon;

    // Parse compartments - format is "LEVEL:TENANT" or just "TENANT"
    const compartmentsAtBase: string[] = [];
    const compartmentsWithDifferentLevel: { tenant: string; tenantLevel: SensitivityLevel }[] = [];

    for (const t of compartments) {
        if (typeof t === "string" && t.includes(":")) {
            const [levelPart, name] = t.split(":");
            const tenantLevel = levelPart.toLowerCase() as SensitivityLevel;
            const isValid = ["public", "low", "moderate", "high"].includes(tenantLevel);
            if (isValid && tenantLevel !== level) {
                compartmentsWithDifferentLevel.push({ tenant: name || t, tenantLevel });
            } else {
                compartmentsAtBase.push(name || t);
            }
        } else {
            compartmentsAtBase.push(t);
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
            {/* Show compartments with different levels in parentheses with color */}
            {compartmentsWithDifferentLevel.map(({ tenant, tenantLevel }) => {
                const tenantConfig = LEVEL_CONFIG[tenantLevel];
                return (
                    <span key={tenant} className={`text-sm ${tenantConfig.textClass}`}>
                        ({tenantConfig.label.slice(0, 3)} {tenant})
                    </span>
                );
            })}
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
    /** Optional function to extract compartments from each item */
    getTenants?: (item: T) => string[];
    /** Default level if no items (null = show 'NONE', defaults to null) */
    defaultLevel?: SensitivityLevel | null;
    /** Additional className for the container */
    className?: string;
}

export function SecureTableWrapper<T>({
    children,
    items,
    getSensitivity,
    getTenants,
    defaultLevel = null,
    className,
}: SecureTableWrapperProps<T>) {
    // Calculate highest sensitivity level from visible items
    const { highestLevel, allTenants } = useMemo(() => {
        if (items.length === 0) {
            return { highestLevel: defaultLevel, allTenants: [] as string[] };
        }

        let maxIndex = -1;
        let highestLevel: SensitivityLevel | null = defaultLevel;
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
        <div className={cn("min-w-0", className)}>
            <ClassificationBanner
                level={highestLevel}
                compartments={allTenants}
                position="header"
            />
            {children}
            <ClassificationBanner
                level={highestLevel}
                compartments={allTenants}
                position="footer"
            />
        </div>
    );
}

// ============================================================================
// Classification Cell Component (for row-level classification display)
// ============================================================================

import { Layers } from "lucide-react";
import type { AccessControlObject } from "@/lib/access-control/types";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface ClassificationCellProps {
    /** Full ACO object (preferred) */
    aco?: AccessControlObject;
    /** Just the sensitivity level (if no full ACO) */
    level?: SensitivityLevel;
    /** Show compact version (just colored bar, no label) */
    compact?: boolean;
}

/**
 * A table cell that displays the classification of an individual row.
 * Styled to match the header/footer banners.
 * Supports compartments: single shown inline, multiple with Layers icon + tooltip.
 */
export function ClassificationCell({ aco, level: directLevel, compact = false }: ClassificationCellProps) {
    const level = aco?.sensitivity ?? directLevel ?? "low";
    const config = LEVEL_CONFIG[level] ?? UNKNOWN_CONFIG;
    const Icon = config.icon;
    const rawTenants = aco?.compartments ?? [];

    // Parse tenant names and levels from "LEVEL:TENANT" format
    const parsedTenants: Array<{ name: string; level: SensitivityLevel; isDifferent: boolean }> = rawTenants.map(t => {
        if (typeof t === "string" && t.includes(":")) {
            const [levelPart, name] = t.split(":");
            const tenantLevel = levelPart.toLowerCase() as SensitivityLevel;
            const isValid = ["public", "low", "moderate", "high"].includes(tenantLevel);
            return {
                name: name || t,
                level: isValid ? tenantLevel : level,
                isDifferent: isValid && tenantLevel !== level
            };
        }
        return { name: t, level: level, isDifferent: false };
    });

    if (compact) {
        // Just a colored bar indicator
        return (
            <div
                className={cn(
                    "w-1.5 h-full min-h-[24px] rounded-sm",
                    config.bgClass.replace('/10', '/40')
                )}
                title={config.label}
            />
        );
    }

    // Determine tenant indicator
    let tenantIndicator: React.ReactNode = null;
    if (parsedTenants.length === 1) {
        const t = parsedTenants[0];
        if (t.isDifferent) {
            // Different level - show "(MOD 🍎)" style with color
            const tenantConfig = LEVEL_CONFIG[t.level] ?? UNKNOWN_CONFIG;
            tenantIndicator = (
                <span className={cn("text-[8px] leading-none", tenantConfig.textClass)}>
                    ({tenantConfig.label.slice(0, 3)} {t.name})
                </span>
            );
        } else {
            // Same level - just show emoji
            tenantIndicator = <span className="text-[10px] leading-none">{t.name}</span>;
        }
    } else if (parsedTenants.length > 1) {
        // Multiple compartments - show stacked icon (details in tooltip)
        tenantIndicator = <Layers className="size-2.5" />;
    }

    // Full badge with icon and label
    const badge = (
        <div
            className={cn(
                "inline-flex flex-col items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide border",
                config.bgClass
            )}
        >
            <span className="flex items-center gap-1">
                <Icon className={cn("size-3", config.textClass)} />
                <span className={config.textClass}>{config.label}</span>
            </span>
            {tenantIndicator}
        </div>
    );

    // Only show tooltip if there are MULTIPLE compartments
    if (parsedTenants.length <= 1) {
        return badge;
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>{badge}</TooltipTrigger>
                <TooltipContent
                    side="right"
                    showArrow={false}
                    className="text-xs bg-zinc-900 border border-zinc-700 text-zinc-200"
                >
                    <div className="space-y-1">
                        <div>
                            <span className="text-zinc-500">Sensitivity:</span>{" "}
                            <span className="font-medium">{config.label}</span>
                        </div>
                        {parsedTenants.length > 0 && (
                            <div>
                                <span className="text-zinc-500">Tenants:</span>{" "}
                                <span className="flex flex-wrap items-center gap-1">
                                    {parsedTenants.map((t, i) => {
                                        const tConfig = LEVEL_CONFIG[t.level] ?? UNKNOWN_CONFIG;
                                        return t.isDifferent ? (
                                            <span key={i} className={tConfig.textClass}>
                                                ({tConfig.label.slice(0, 3)} {t.name})
                                            </span>
                                        ) : (
                                            <span key={i}>{t.name}</span>
                                        );
                                    })}
                                </span>
                            </div>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
