/**
 * Agent Badge - Visual indicator that a personnel is an AI agent
 */

"use client";

import { cn } from "@/lib/utils";

export interface AgentBadgeProps {
    className?: string;
    size?: "sm" | "md" | "lg";
}

/**
 * Badge to indicate a personnel is an AI agent
 */
export function AgentBadge({ className, size = "md" }: AgentBadgeProps) {
    const sizeClasses = {
        sm: "text-xs px-1.5 py-0.5",
        md: "text-sm px-2 py-1",
        lg: "text-base px-3 py-1.5",
    };

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-full font-medium",
                "bg-gradient-to-r from-purple-500/20 to-blue-500/20",
                "text-purple-400 border border-purple-500/30",
                sizeClasses[size],
                className
            )}
            data-testid="agent-badge"
        >
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            AI Agent
        </span>
    );
}
