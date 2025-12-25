"use client";

/**
 * Security Label Picker
 *
 * Dropdown picker for assigning classification to data.
 * Allows selecting sensitivity level and tenant compartments.
 */

import { useState, useCallback } from "react";
import { Shield, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { SensitivityLevel, AccessControlObject } from "@/lib/access-control/types";
import { SENSITIVITY_ORDER } from "@/lib/access-control/types";
import { useSecurity } from "@/contexts/security-context";

// ============================================================================
// Configuration
// ============================================================================

const LEVEL_CONFIG: Record<SensitivityLevel, {
    label: string;
    description: string;
    colorClass: string;
}> = {
    public: {
        label: "Public",
        description: "No restrictions",
        colorClass: "text-emerald-400 bg-emerald-500/10",
    },
    low: {
        label: "Low",
        description: "Internal use",
        colorClass: "text-sky-400 bg-sky-500/10",
    },
    moderate: {
        label: "Moderate",
        description: "Limited distribution",
        colorClass: "text-amber-400 bg-amber-500/10",
    },
    high: {
        label: "High",
        description: "Restricted access",
        colorClass: "text-red-400 bg-red-500/10",
    },
};

const TENANT_OPTIONS = ["🍎", "🍌", "🍊", "🍇", "🍓"];

// ============================================================================
// Component
// ============================================================================

interface SecurityLabelPickerProps {
    /** Current ACO value */
    value: AccessControlObject;
    /** Callback when ACO changes */
    onChange: (aco: AccessControlObject) => void;
    /** Whether the picker is disabled */
    disabled?: boolean;
    /** Max sensitivity the user can assign (defaults to their clearance) */
    maxSensitivity?: SensitivityLevel;
    /** Additional className */
    className?: string;
}

export function SecurityLabelPicker({
    value,
    onChange,
    disabled = false,
    maxSensitivity,
    className,
}: SecurityLabelPickerProps) {
    const [open, setOpen] = useState(false);
    const { maxClearanceLevel, activeTenants: userTenants } = useSecurity();

    // User can only assign up to their clearance or the specified max
    const effectiveMax = maxSensitivity ?? maxClearanceLevel;
    const maxIndex = SENSITIVITY_ORDER.indexOf(effectiveMax);

    const handleSensitivityChange = useCallback(
        (level: SensitivityLevel) => {
            onChange({ ...value, sensitivity: level });
        },
        [value, onChange]
    );

    const handleTenantToggle = useCallback(
        (tenant: string) => {
            const currentTenants = value.tenants ?? [];
            const newTenants = currentTenants.includes(tenant)
                ? currentTenants.filter((t) => t !== tenant)
                : [...currentTenants, tenant];
            onChange({ ...value, tenants: newTenants.length > 0 ? newTenants : undefined });
        },
        [value, onChange]
    );

    const config = LEVEL_CONFIG[value.sensitivity];
    const selectedTenants = value.tenants ?? [];

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    className={cn(
                        "justify-between gap-2 min-w-[140px]",
                        config.colorClass,
                        className
                    )}
                >
                    <span className="flex items-center gap-2">
                        <Shield className="size-3.5" />
                        <span>{config.label}</span>
                        {selectedTenants.length > 0 && (
                            <span className="text-xs">{selectedTenants.join("")}</span>
                        )}
                    </span>
                    <ChevronDown className="size-3.5 opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-64 p-0" align="start">
                <div className="p-2">
                    <div className="text-xs font-medium text-zinc-500 px-2 py-1">
                        Sensitivity Level
                    </div>
                    <div className="space-y-0.5">
                        {SENSITIVITY_ORDER.map((level, index) => {
                            const levelConfig = LEVEL_CONFIG[level];
                            const isDisabled = index > maxIndex;
                            const isSelected = value.sensitivity === level;

                            return (
                                <button
                                    key={level}
                                    type="button"
                                    disabled={isDisabled}
                                    onClick={() => handleSensitivityChange(level)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-2 py-1.5 rounded text-sm transition-colors",
                                        isSelected
                                            ? levelConfig.colorClass
                                            : "hover:bg-zinc-800/50",
                                        isDisabled && "opacity-40 cursor-not-allowed"
                                    )}
                                >
                                    <div className="flex flex-col items-start">
                                        <span className={cn(isSelected && "font-medium")}>
                                            {levelConfig.label}
                                        </span>
                                        <span className="text-[10px] text-zinc-500">
                                            {levelConfig.description}
                                        </span>
                                    </div>
                                    {isSelected && <Check className="size-4" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="border-t border-zinc-800 p-2">
                    <div className="text-xs font-medium text-zinc-500 px-2 py-1">
                        Tenant Compartments
                    </div>
                    <div className="space-y-1 px-2 py-1">
                        {/* Only show tenants the user has access to */}
                        {TENANT_OPTIONS.filter(tenant => userTenants.includes(tenant)).map((tenant) => {
                            // Find if this tenant is in selected tenants (may be in LEVEL:TENANT format)
                            const selectedEntry = selectedTenants.find(t =>
                                t === tenant || t.endsWith(`:${tenant}`)
                            );
                            const isSelected = !!selectedEntry;

                            // Parse level from selected tenant (format: "LEVEL:TENANT" or just "TENANT")
                            let tenantLevel: SensitivityLevel = value.sensitivity;
                            if (selectedEntry && selectedEntry.includes(":")) {
                                const parts = selectedEntry.split(":");
                                const levelStr = parts[0].toLowerCase();
                                if (SENSITIVITY_ORDER.includes(levelStr as SensitivityLevel)) {
                                    tenantLevel = levelStr as SensitivityLevel;
                                }
                            }

                            // Available levels for this tenant (up to base level)
                            const baseLevelIndex = SENSITIVITY_ORDER.indexOf(value.sensitivity);
                            const availableLevels = SENSITIVITY_ORDER.slice(0, baseLevelIndex + 1);

                            return (
                                <div key={tenant} className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const currentTenants = selectedTenants;
                                            if (isSelected) {
                                                // Remove tenant (any format)
                                                const newTenants = currentTenants.filter(t =>
                                                    t !== tenant && !t.endsWith(`:${tenant}`)
                                                );
                                                onChange({ ...value, tenants: newTenants.length > 0 ? newTenants : undefined });
                                            } else {
                                                // Add tenant with base level
                                                const newTenant = `${value.sensitivity}:${tenant}`;
                                                onChange({ ...value, tenants: [...currentTenants, newTenant] });
                                            }
                                        }}
                                        className={cn(
                                            "size-8 rounded flex items-center justify-center text-lg transition-colors border shrink-0",
                                            isSelected
                                                ? "bg-zinc-700 border-zinc-600"
                                                : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
                                        )}
                                        title={tenant}
                                    >
                                        {tenant}
                                    </button>

                                    {/* Level selector for selected tenants */}
                                    {isSelected && (
                                        <select
                                            value={tenantLevel}
                                            onChange={(e) => {
                                                const newLevel = e.target.value as SensitivityLevel;
                                                const newTenant = `${newLevel}:${tenant}`;
                                                const newTenants = selectedTenants
                                                    .filter(t => t !== tenant && !t.endsWith(`:${tenant}`))
                                                    .concat(newTenant);
                                                onChange({ ...value, tenants: newTenants });
                                            }}
                                            className="h-6 px-1 text-xs bg-zinc-800 border border-zinc-700 rounded"
                                        >
                                            {availableLevels.map(level => (
                                                <option key={level} value={level}>
                                                    {LEVEL_CONFIG[level].label}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {userTenants.length === 0 && (
                        <p className="text-[10px] text-zinc-600 px-2 mt-1">
                            No tenant access in current session
                        </p>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
