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
    const tenants = aco?.tenants ?? [];
    const roles = aco?.roles ?? [];


    const label = LEVEL_LABELS[sensitivity];

    // Determine tenant indicator: single tenant emoji, or multi-tenant icon
    let tenantIndicator: React.ReactNode = null;
    if (tenants.length === 1) {
        tenantIndicator = <span className="text-[10px] leading-none">{tenants[0]}</span>;
    } else if (tenants.length > 1) {
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
    if (tenants.length <= 1 && roles.length === 0) {
        return badge;
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>{badge}</TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                    <div className="space-y-1">
                        <div>
                            <span className="text-zinc-500">Sensitivity:</span>{" "}
                            <span className="font-medium">{sensitivity}</span>
                        </div>
                        {tenants.length > 0 && (
                            <div>
                                <span className="text-zinc-500">Tenants:</span>{" "}
                                <span>{tenants.join(" ")}</span>
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
