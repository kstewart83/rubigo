"use client";

/**
 * Security Banner
 *
 * Displays the current session's security clearance level and tenant access
 * as a banner at the top of the application.
 * 
 * Users can click to change their session level and per-tenant settings.
 */

import { useState } from "react";
import { Shield, ShieldCheck, ShieldAlert, ChevronDown, Check } from "lucide-react";
import { useSecurity } from "@/contexts/security-context";
import type { SensitivityLevel } from "@/lib/access-control/types";
import { SENSITIVITY_ORDER } from "@/lib/access-control/types";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// ============================================================================
// Color Configuration
// ============================================================================

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
// Component
// ============================================================================

export function SecurityBanner() {
    const {
        sessionLevel,
        maxClearanceLevel,
        setSessionLevel,
        activeTenants,
        tenantClearances,
        toggleTenant,
        setTenantLevel,
        isGlobalAdmin,
        availableLevels
    } = useSecurity();
    const [open, setOpen] = useState(false);

    const config = LEVEL_CONFIG[sessionLevel];
    const Icon = config.icon;

    // Check if we're operating at a reduced level
    const isReduced = sessionLevel !== maxClearanceLevel;
    const sessionLevelIndex = SENSITIVITY_ORDER.indexOf(sessionLevel);

    return (
        <div
            className={`
                flex items-center px-4 h-8
                border-b ${config.bgClass}
                text-xs font-medium tracking-wide
                shrink-0 relative z-20
            `}
        >
            {/* Left: Clickable Session Level Picker */}
            <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger asChild>
                    <button
                        className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors text-[10px] cursor-pointer"
                    >
                        <span>Session Level</span>
                        <ChevronDown className="size-3" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[280px]">
                    {/* Sensitivity Level Section */}
                    <DropdownMenuLabel className="text-[10px] text-zinc-500 font-normal">
                        Session Sensitivity
                    </DropdownMenuLabel>
                    {availableLevels.map((level) => {
                        const levelConfig = LEVEL_CONFIG[level];
                        const LevelIcon = levelConfig.icon;
                        const isSelected = level === sessionLevel;
                        const isMax = level === maxClearanceLevel;
                        return (
                            <DropdownMenuItem
                                key={level}
                                onClick={() => setSessionLevel(level)}
                                className={`flex items-center gap-2 ${isSelected ? "bg-zinc-800" : ""}`}
                            >
                                <LevelIcon className={`size-4 ${levelConfig.textClass}`} />
                                <span className={levelConfig.textClass}>
                                    {levelConfig.label}
                                </span>
                                {isMax && (
                                    <span className="text-[10px] text-zinc-500 ml-1">(max)</span>
                                )}
                                {isSelected && (
                                    <Check className="ml-auto size-4 text-zinc-400" />
                                )}
                            </DropdownMenuItem>
                        );
                    })}

                    {/* Tenant Section */}
                    {tenantClearances.length > 0 && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-[10px] text-zinc-500 font-normal">
                                Tenant Access
                            </DropdownMenuLabel>
                            <div className="px-2 py-3 space-y-4">
                                {tenantClearances.map((tc) => {
                                    const maxLevelIndex = SENSITIVITY_ORDER.indexOf(tc.maxLevel);
                                    const isAboveSession = maxLevelIndex > sessionLevelIndex;
                                    const effectiveMaxLevel = isAboveSession ? sessionLevel : tc.maxLevel;
                                    const effectiveMaxIndex = SENSITIVITY_ORDER.indexOf(effectiveMaxLevel);

                                    // Available levels for this tenant (up to its effective max)
                                    const tenantLevels = SENSITIVITY_ORDER.slice(0, effectiveMaxIndex + 1);

                                    return (
                                        <div
                                            key={tc.tenant}
                                            className={`flex items-center gap-2 h-6 ${isAboveSession ? "opacity-40" : ""}`}
                                        >
                                            <Checkbox
                                                checked={tc.enabled}
                                                onCheckedChange={() => toggleTenant(tc.tenant)}
                                                disabled={isAboveSession}
                                                className="size-4"
                                            />
                                            <span className="text-lg">{tc.tenant}</span>

                                            {tc.enabled && !isAboveSession ? (
                                                <Select
                                                    value={tc.sessionLevel}
                                                    onValueChange={(v) => setTenantLevel(tc.tenant, v as SensitivityLevel)}
                                                >
                                                    <SelectTrigger className="h-6 w-[110px] text-[10px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {tenantLevels.map((level) => (
                                                            <SelectItem
                                                                key={level}
                                                                value={level}
                                                                className="text-[10px]"
                                                            >
                                                                <span className={LEVEL_CONFIG[level].textClass}>
                                                                    {LEVEL_CONFIG[level].label}
                                                                </span>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <span className="text-[10px] text-zinc-500 h-6 flex items-center">
                                                    {isAboveSession
                                                        ? `(requires ${LEVEL_CONFIG[tc.maxLevel].label})`
                                                        : "disabled"
                                                    }
                                                </span>
                                            )}

                                            {tc.sessionLevel !== tc.maxLevel && tc.enabled && !isAboveSession && (
                                                <span className="text-[10px] text-zinc-500">
                                                    (max: {LEVEL_CONFIG[tc.maxLevel].shortLabel})
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Center: Icon + Level + Active Tenants */}
            <div className="flex-1 flex items-center justify-center gap-3">
                <div className={`flex items-center gap-2 ${config.textClass}`}>
                    <Icon className="size-4" />
                    <span>
                        {isGlobalAdmin ? "ADMIN" : config.label}
                        {isReduced && (
                            <span className="ml-1 text-zinc-500 text-[10px]">
                                (max: {LEVEL_CONFIG[maxClearanceLevel].label})
                            </span>
                        )}
                    </span>
                </div>

                {activeTenants.length > 0 && (
                    <>
                        <span className="text-zinc-600">|</span>
                        <div className="flex items-center gap-1">
                            {activeTenants.map((tenant) => {
                                const tc = tenantClearances.find(t => t.tenant === tenant);
                                // Check if tenant session level differs from base session level
                                const tenantLevel = tc?.sessionLevel ?? sessionLevel;
                                const isDifferentLevel = tenantLevel !== sessionLevel;
                                const levelConfig = LEVEL_CONFIG[tenantLevel];

                                if (isDifferentLevel) {
                                    // Show in parentheses format with level color
                                    return (
                                        <span
                                            key={tenant}
                                            className={`text-sm ${levelConfig.textClass}`}
                                            title={`${tenant} at ${levelConfig.label}`}
                                        >
                                            ({levelConfig.shortLabel} {tenant})
                                        </span>
                                    );
                                }

                                // Same as base - show just the tenant
                                return (
                                    <span
                                        key={tenant}
                                        className="text-base"
                                        title={`${tenant} at ${levelConfig.label}`}
                                    >
                                        {tenant}
                                    </span>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Right: Empty for balance */}
            <div className="w-[80px]" />
        </div>
    );
}
