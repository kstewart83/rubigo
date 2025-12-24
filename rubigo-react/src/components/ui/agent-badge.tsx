/**
 * Agent Badge - Visual indicator that a personnel is an AI agent
 */

"use client";

import { cn } from "@/lib/utils";

export interface AgentBadgeProps {
    className?: string;
    size?: "xs" | "sm" | "md" | "lg";
}

/**
 * Badge to indicate a personnel is an AI agent
 */
export function AgentBadge({ className, size = "md" }: AgentBadgeProps) {
    const sizeClasses = {
        xs: "text-[10px] px-1.5 h-4 gap-1",
        sm: "text-[11px] px-1.5 h-5 gap-1",
        md: "text-sm px-2 py-1 gap-1",
        lg: "text-base px-3 py-1.5 gap-1.5",
    };

    const dotSizes = {
        xs: "h-1.5 w-1.5",
        sm: "h-1.5 w-1.5",
        md: "h-2 w-2",
        lg: "h-2.5 w-2.5",
    };

    return (
        <span
            className={cn(
                "inline-flex items-center justify-center rounded-full font-medium shrink-0 leading-none",
                "bg-gradient-to-r from-purple-500/20 to-blue-500/20",
                "text-purple-400 border border-purple-500/30",
                sizeClasses[size],
                className
            )}
            data-testid="agent-badge"
        >
            <span className={cn("relative flex shrink-0", dotSizes[size])}>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className={cn("relative inline-flex rounded-full bg-purple-500", dotSizes[size])}></span>
            </span>
            <span className="leading-none translate-y-px">AI</span>
        </span>
    );
}
