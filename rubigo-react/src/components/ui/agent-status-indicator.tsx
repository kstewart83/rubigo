/**
 * Agent Status Indicator - Shows current agent state with visual feedback
 */

"use client";

import { cn } from "@/lib/utils";
import type { AgentStatus } from "@/db/schema";

export interface AgentStatusIndicatorProps {
    status: AgentStatus;
    showLabel?: boolean;
    size?: "sm" | "md" | "lg";
    className?: string;
}

const statusConfig: Record<AgentStatus, {
    color: string;
    bgColor: string;
    label: string;
    animate: boolean;
}> = {
    dormant: {
        color: "bg-gray-400",
        bgColor: "bg-gray-400/20",
        label: "Dormant",
        animate: false,
    },
    sleeping: {
        color: "bg-blue-400",
        bgColor: "bg-blue-400/20",
        label: "Sleeping",
        animate: false,
    },
    idle: {
        color: "bg-green-400",
        bgColor: "bg-green-400/20",
        label: "Idle",
        animate: false,
    },
    working: {
        color: "bg-amber-400",
        bgColor: "bg-amber-400/20",
        label: "Working",
        animate: true,
    },
};

/**
 * Visual indicator showing agent's current status
 */
export function AgentStatusIndicator({
    status,
    showLabel = true,
    size = "md",
    className,
}: AgentStatusIndicatorProps) {
    const config = statusConfig[status];

    const sizeClasses = {
        sm: { dot: "h-2 w-2", text: "text-xs" },
        md: { dot: "h-3 w-3", text: "text-sm" },
        lg: { dot: "h-4 w-4", text: "text-base" },
    };

    const { dot, text } = sizeClasses[size];

    return (
        <div
            className={cn("inline-flex items-center gap-2", className)}
            data-testid="agent-status-indicator"
            data-status={status}
        >
            <span className={cn("relative flex", dot)}>
                {config.animate && (
                    <span
                        className={cn(
                            "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                            config.color
                        )}
                    />
                )}
                <span
                    className={cn(
                        "relative inline-flex rounded-full h-full w-full",
                        config.color
                    )}
                />
            </span>
            {showLabel && (
                <span className={cn("font-medium text-muted-foreground", text)}>
                    {config.label}
                </span>
            )}
        </div>
    );
}

/**
 * Compact status dot for use in tables or lists
 */
export function AgentStatusDot({
    status,
    className,
}: {
    status: AgentStatus;
    className?: string;
}) {
    return (
        <AgentStatusIndicator
            status={status}
            showLabel={false}
            size="sm"
            className={className}
        />
    );
}
