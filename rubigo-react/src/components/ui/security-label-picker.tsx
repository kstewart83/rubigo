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
                    <div className="flex flex-wrap gap-1 px-2 py-1">
                        {TENANT_OPTIONS.map((tenant) => {
                            const isSelected = selectedTenants.includes(tenant);
                            const hasAccess = userTenants.includes(tenant);

                            return (
                                <button
                                    key={tenant}
                                    type="button"
                                    disabled={!hasAccess}
                                    onClick={() => handleTenantToggle(tenant)}
                                    className={cn(
                                        "size-8 rounded flex items-center justify-center text-lg transition-colors border",
                                        isSelected
                                            ? "bg-zinc-700 border-zinc-600"
                                            : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800",
                                        !hasAccess && "opacity-30 cursor-not-allowed"
                                    )}
                                    title={hasAccess ? tenant : `No access to ${tenant}`}
                                >
                                    {tenant}
                                </button>
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
