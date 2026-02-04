"use client";

/**
 * Security Badge
 *
 * Inline badge showing item classification with color coding.
 */

import { cva, type VariantProps } from "class-variance-authority";
import { Shield, Layers } from "lucide-react";
import type { SensitivityLevel, AccessControlObject } from "@/lib/access-control/types";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// ============================================================================
// Style Variants
// ============================================================================

const badgeVariants = cva(
    "inline-flex items-center gap-1 font-medium rounded-md border transition-colors",
    {
        variants: {
            sensitivity: {
                public: "bg-emerald-900 border-emerald-500/50 text-emerald-300",
                low: "bg-sky-900 border-sky-500/50 text-sky-300",
                moderate: "bg-amber-900 border-amber-500/50 text-amber-300",
                high: "bg-red-900 border-red-500/50 text-red-300",
            },
            size: {
                sm: "text-[10px] px-1.5 py-0.5",
                default: "text-xs px-2 py-0.5",
                lg: "text-sm px-2.5 py-1",
            },
        },
        defaultVariants: {
            sensitivity: "low",
            size: "default",
        },
    }
);

const LEVEL_LABELS: Record<SensitivityLevel, string> = {
    public: "PUBLIC",
    low: "LOW",
    moderate: "MOD",
    high: "HIGH",
};



// ============================================================================
// Component
// ============================================================================

interface SecurityBadgeProps extends VariantProps<typeof badgeVariants> {
    /** Full ACO object */
    aco?: AccessControlObject;
    /** Just the sensitivity level (if no full ACO) */
    sensitivity?: SensitivityLevel;
    /** Show icon */
    showIcon?: boolean;
    /** Show tenants */
    showTenants?: boolean;
    /** Additional className */
    className?: string;
}

export function SecurityBadge({
    aco,
    sensitivity: directSensitivity,
    size,
    showIcon = false,
    showTenants = true,
    className,
}: SecurityBadgeProps) {
    const sensitivity = aco?.sensitivity ?? directSensitivity ?? "low";
    const rawTenants = aco?.compartments ?? [];
    const roles = aco?.roles ?? [];

    // Parse tenant names and levels from "LEVEL:TENANT" format
    const parsedTenants: Array<{ name: string; level: SensitivityLevel; isDifferent: boolean }> = rawTenants.map(t => {
        if (typeof t === "string" && t.includes(":")) {
            const [levelPart, name] = t.split(":");
            const level = levelPart.toLowerCase() as SensitivityLevel;
            const isValid = ["public", "low", "moderate", "high"].includes(level);
            return {
                name: name || t,
                level: isValid ? level : sensitivity,
                isDifferent: isValid && level !== sensitivity
            };
        }
        return { name: t, level: sensitivity, isDifferent: false };
    });

    const compartmentNames = parsedTenants.map(t => t.name);

    const label = LEVEL_LABELS[sensitivity];

    // Color classes for tenant level indicators
    const LEVEL_TEXT_CLASS: Record<SensitivityLevel, string> = {
        public: "text-emerald-300",
        low: "text-sky-300",
        moderate: "text-amber-300",
        high: "text-red-300",
    };

    // Determine tenant indicator
    let tenantIndicator: React.ReactNode = null;
    if (parsedTenants.length === 1) {
        const t = parsedTenants[0];
        if (t.isDifferent) {
            // Different level - show "(MOD 🍎)" style with color
            tenantIndicator = (
                <span className={`text-[10px] leading-none ${LEVEL_TEXT_CLASS[t.level]}`}>
                    ({LEVEL_LABELS[t.level]} {t.name})
                </span>
            );
        } else {
            // Same level - just show emoji
            tenantIndicator = <span className="text-[10px] leading-none">{t.name}</span>;
        }
    } else if (parsedTenants.length > 1) {
        // Multiple tenants - always show stacked icon (details in tooltip)
        tenantIndicator = <Layers className="size-3" />;
    }

    const badge = (
        <span className={cn(badgeVariants({ sensitivity, size }), "flex-col", className)}>
            <span className="flex items-center gap-1">
                {showIcon && <Shield className="size-3" />}
                <span>{label}</span>
            </span>
            {tenantIndicator}
        </span>
    );

    // Only show tooltip if there are MULTIPLE tenants (single tenant shown inline)
    if (compartmentNames.length <= 1 && roles.length === 0) {
        return badge;
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>{badge}</TooltipTrigger>
                <TooltipContent
                    side="top"
                    showArrow={false}
                    className="text-xs bg-zinc-900 border border-zinc-700 text-zinc-200"
                >
                    <div className="space-y-1">
                        <div>
                            <span className="text-zinc-500">Sensitivity:</span>{" "}
                            <span className="font-medium">{LEVEL_LABELS[sensitivity]}</span>
                        </div>
                        {parsedTenants.length > 0 && (
                            <div>
                                <span className="text-zinc-500">Tenants:</span>{" "}
                                <span className="flex flex-wrap items-center gap-1">
                                    {parsedTenants.map((t, i) => (
                                        t.isDifferent ? (
                                            <span key={i} className={LEVEL_TEXT_CLASS[t.level]}>
                                                ({LEVEL_LABELS[t.level]} {t.name})
                                            </span>
                                        ) : (
                                            <span key={i}>{t.name}</span>
                                        )
                                    ))}
                                </span>
                            </div>
                        )}
                        {roles.length > 0 && (
                            <div>
                                <span className="text-zinc-500">Roles:</span>{" "}
                                <span>{roles.join(", ")}</span>
                            </div>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
