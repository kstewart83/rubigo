"use client";

/**
 * PersonAvatar - Unified avatar component for personnel
 * 
 * Handles:
 * - Human avatars with photo or initials fallback
 * - AI agent avatars with glow effect
 * - Presence indicator with optional blur backdrop (for mobile cards)
 * 
 * Usage:
 *   <PersonAvatar person={person} size="md" showPresence />
 *   <PersonAvatar person={person} variant="square-rounded" presenceStyle="blur-backdrop" showPresence />
 */

import Image from "next/image";
import { cn } from "@/lib/utils";
import { AgentGlowAvatar } from "@/components/ui/agent-glow-avatar";
import { PresenceIndicator } from "@/components/ui/presence-indicator";
import type { PresenceStatus } from "@/hooks/use-presence";

export interface PersonAvatarProps {
    /** Person object (convenience prop) */
    person?: {
        id?: string;
        name: string;
        photo?: string | null;
        isAgent?: boolean;
    };
    /** Direct props (use if not passing person object) */
    photo?: string | null;
    name?: string;
    isAgent?: boolean;
    personnelId?: string;

    /** Size preset */
    size?: "xs" | "sm" | "md" | "lg" | "xl" | "detail" | "card";

    /** Shape variant: circular (default) or square-rounded for cards */
    variant?: "circular" | "square-rounded";

    /** Presence indicator style: dot (default, corner dot) or blur-backdrop (mobile cards) */
    presenceStyle?: "dot" | "blur-backdrop";

    /** Show presence indicator */
    showPresence?: boolean;

    /** Override presence status */
    presenceStatus?: PresenceStatus;

    /** Additional className for the avatar container */
    className?: string;

    /** Fill container (for square-rounded variant) */
    fillContainer?: boolean;
}

const sizeConfig = {
    xs: { container: 20, avatar: 20, glow: 20, text: "text-[8px]", ring: 2, indicator: "sm" as const, backdrop: 20, dotRight: "right-0" },
    sm: { container: 32, avatar: 32, glow: 28, text: "text-xs", ring: 2.5, indicator: "sm" as const, backdrop: 20, dotRight: "right-0" },
    md: { container: 40, avatar: 40, glow: 36, text: "text-sm", ring: 3, indicator: "sm" as const, backdrop: 24, dotRight: "right-1" },
    lg: { container: 64, avatar: 64, glow: 56, text: "text-lg", ring: 3.5, indicator: "md" as const, backdrop: 24, dotRight: "right-1" },
    xl: { container: 96, avatar: 96, glow: 80, text: "text-2xl", ring: 4, indicator: "md" as const, backdrop: 28, dotRight: "right-1.5" },
    detail: { container: 240, avatar: 240, glow: 200, text: "text-4xl", ring: 5, indicator: "lg" as const, backdrop: 36, dotRight: "right-2" },
    card: { container: 0, avatar: 0, glow: 64, text: "text-xl", ring: 3.5, indicator: "md" as const, backdrop: 24, dotRight: "right-1" }, // fills container
};

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}



export function PersonAvatar({
    person,
    photo: directPhoto,
    name: directName,
    isAgent: directIsAgent,
    personnelId: directPersonnelId,
    size = "md",
    variant = "circular",
    presenceStyle = "dot",
    showPresence = false,
    presenceStatus,
    className,
    fillContainer = false,
}: PersonAvatarProps) {
    // Resolve props from person object or direct props
    const photo = person?.photo ?? directPhoto;
    const name = person?.name ?? directName ?? "";
    const isAgent = person?.isAgent ?? directIsAgent ?? false;

    const config = sizeConfig[size];
    const initials = getInitials(name);
    const isSquare = variant === "square-rounded";
    const isBlurBackdrop = presenceStyle === "blur-backdrop";
    const isDot = presenceStyle === "dot";
    const shouldFill = fillContainer || size === "card";

    // Effective status (default to offline for display)
    const effectiveStatus = presenceStatus || "offline";

    // Container styling
    const containerClasses = cn(
        "relative inline-block overflow-hidden",
        isSquare ? "rounded-lg" : "rounded-full",
        className
    );

    const containerStyle = shouldFill
        ? { width: "100%", height: "100%" }
        : { width: config.container, height: config.container };

    // Avatar styling
    const avatarClasses = cn(
        "object-cover",
        isSquare ? "rounded-lg" : "rounded-full",
        shouldFill && "h-full w-full"
    );

    const fallbackClasses = cn(
        "flex items-center justify-center font-medium",
        isSquare ? "rounded-lg bg-primary/10 text-primary font-semibold" : "bg-zinc-200 dark:bg-zinc-700",
        config.text,
        shouldFill && "h-full w-full"
    );

    return (
        <div className="relative inline-block" style={shouldFill ? { width: "100%", height: "100%" } : undefined}>
            {/* Avatar container with overflow-hidden for rounded corners */}
            <div className={containerClasses} style={containerStyle}>
                {isAgent ? (
                    // AI Agent: Use glow avatar
                    <AgentGlowAvatar
                        size={config.glow}
                        src={photo}
                        alt={name}
                        initials={initials}
                    />
                ) : (
                    // Human: Regular avatar
                    <>
                        {photo ? (
                            shouldFill ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={photo}
                                    alt={name}
                                    className={avatarClasses}
                                />
                            ) : (
                                <Image
                                    src={photo}
                                    alt={name}
                                    width={config.avatar}
                                    height={config.avatar}
                                    className={avatarClasses}
                                    style={{ width: config.avatar, height: config.avatar }}
                                />
                            )
                        ) : (
                            <div
                                className={fallbackClasses}
                                style={shouldFill ? undefined : { width: config.avatar, height: config.avatar }}
                            >
                                {initials}
                            </div>
                        )}
                    </>
                )}

                {/* Presence indicator - blur backdrop style (mobile cards) - inside for blur effect */}
                {showPresence && isBlurBackdrop && (
                    <span className="absolute bottom-2 right-2 flex items-center justify-center">
                        {/* Blurred backdrop - rounded square */}
                        <span
                            className="absolute rounded-md"
                            style={{
                                width: config.backdrop,
                                height: config.backdrop,
                                background: 'rgba(0, 0, 0, 0.5)',
                                backdropFilter: 'blur(4px)',
                                WebkitBackdropFilter: 'blur(4px)',
                            }}
                        />
                        {/* Indicator on top */}
                        <span className="relative">
                            <PresenceIndicator status={effectiveStatus} size={config.indicator} />
                        </span>
                    </span>
                )}
            </div>

            {/* Presence indicator - simple corner dot (desktop) - OUTSIDE overflow-hidden container */}
            {showPresence && isDot && (
                <span className={`absolute bottom-1 ${config.dotRight}`}>
                    <PresenceIndicator status={effectiveStatus} size={config.indicator} />
                </span>
            )}
        </div>
    );
}
