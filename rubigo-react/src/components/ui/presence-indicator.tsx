"use client";

/**
 * Presence Indicator - Accessible status dot for user presence
 * 
 * Accessibility: Uses shape + animation + color (not color alone)
 * - Online: Filled gradient dot with subtle glow
 * - Away: Pulsing dot (animation indicates transitional state)
 * - Offline: Hollow ring (empty = not present)
 */

import { cn } from "@/lib/utils";
import type { PresenceStatus } from "@/hooks/use-presence";

interface PresenceIndicatorProps {
    status: PresenceStatus;
    size?: "sm" | "md" | "lg";
    className?: string;
    showLabel?: boolean;
}

const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
};

const statusLabels = {
    online: "Online",
    away: "Away",
    offline: "Offline",
};

export function PresenceIndicator({
    status,
    size = "md",
    className,
    showLabel = false,
}: PresenceIndicatorProps) {
    const sizeClass = sizeClasses[size];

    const renderIndicator = () => {
        switch (status) {
            case "online":
                // Filled with gradient and subtle glow
                return (
                    <span
                        className={cn(
                            sizeClass,
                            "rounded-full",
                            // Gradient: teal to emerald for modern feel
                            "bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600",
                            // Subtle outer glow
                            "shadow-[0_0_8px_rgba(16,185,129,0.6)]",
                            // Ring to separate from avatar
                            "ring-2 ring-background"
                        )}
                        aria-label={statusLabels.online}
                    />
                );

            case "away":
                // Pulsing with amber/gold gradient
                return (
                    <span
                        className={cn(
                            sizeClass,
                            "rounded-full",
                            // Gradient: amber to warm orange
                            "bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500",
                            // Subtle glow
                            "shadow-[0_0_8px_rgba(245,158,11,0.5)]",
                            // Ring
                            "ring-2 ring-background",
                            // Slow pulse animation for "idle" feel
                            "animate-[pulse_2.5s_ease-in-out_infinite]"
                        )}
                        aria-label={statusLabels.away}
                    />
                );

            case "offline":
            default:
                // Hollow ring - clearly "empty/not present"
                return (
                    <span
                        className={cn(
                            sizeClass,
                            "rounded-full",
                            // Transparent center
                            "bg-transparent",
                            // Border creates the ring effect
                            "border-[1.5px] border-zinc-400 dark:border-zinc-500",
                            // Outer ring for consistency
                            "ring-2 ring-background"
                        )}
                        aria-label={statusLabels.offline}
                    />
                );
        }
    };

    return (
        <div className={cn("flex items-center gap-1.5", className)}>
            {renderIndicator()}
            {showLabel && (
                <span className="text-xs text-muted-foreground">
                    {statusLabels[status]}
                </span>
            )}
        </div>
    );
}
