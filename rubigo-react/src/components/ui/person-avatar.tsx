"use client";

/**
 * PersonAvatar - Unified avatar component for personnel
 * 
 * Handles:
 * - Human avatars with photo or initials fallback
 * - AI agent avatars with glow effect
 * - Integrated presence indicator as subtle inset ring
 * 
 * Usage:
 *   <PersonAvatar person={person} size="md" showPresence />
 *   <PersonAvatar photo="/photo.jpg" name="John Doe" size="lg" />
 */

import Image from "next/image";
import { cn } from "@/lib/utils";
import { AgentGlowAvatar } from "@/components/ui/agent-glow-avatar";
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
    size?: "xs" | "sm" | "md" | "lg" | "xl";

    /** Shape variant: circular (default) or square-rounded for cards */
    variant?: "circular" | "square-rounded";

    /** Show presence indicator */
    showPresence?: boolean;

    /** Override presence status (otherwise uses presence hook if personnelId provided) */
    presenceStatus?: PresenceStatus;

    /** Additional className */
    className?: string;
}

const sizeConfig = {
    xs: { container: 20, avatar: 20, glow: 20, text: "text-[8px]", ring: 2 },
    sm: { container: 32, avatar: 32, glow: 28, text: "text-xs", ring: 2.5 },
    md: { container: 40, avatar: 40, glow: 36, text: "text-sm", ring: 3 },
    lg: { container: 64, avatar: 64, glow: 56, text: "text-lg", ring: 3.5 },
    xl: { container: 96, avatar: 96, glow: 80, text: "text-2xl", ring: 4 },
};

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

// Get ring styles based on presence status
function getPresenceRingStyle(status: PresenceStatus | undefined, ringWidth: number) {
    switch (status) {
        case "online":
            return {
                boxShadow: `
                    inset 0 0 0 ${ringWidth}px rgba(16, 185, 129, 0.8),
                    0 0 12px rgba(16, 185, 129, 0.4)
                `,
            };
        case "away":
            return {
                boxShadow: `
                    inset 0 0 0 ${ringWidth}px rgba(245, 158, 11, 0.7),
                    0 0 8px rgba(245, 158, 11, 0.3)
                `,
                animation: "presence-pulse 2.5s ease-in-out infinite",
            };
        case "offline":
        default:
            // Undefined or offline = subtle gray ring
            return {
                boxShadow: `inset 0 0 0 ${ringWidth}px rgba(113, 113, 122, 0.4)`,
            };
    }
}

export function PersonAvatar({
    person,
    photo: directPhoto,
    name: directName,
    isAgent: directIsAgent,
    personnelId: directPersonnelId,
    size = "md",
    showPresence = false,
    presenceStatus,
    className,
}: PersonAvatarProps) {
    // Resolve props from person object or direct props
    const photo = person?.photo ?? directPhoto;
    const name = person?.name ?? directName ?? "";
    const isAgent = person?.isAgent ?? directIsAgent ?? false;
    const personnelId = person?.id ?? directPersonnelId;

    const config = sizeConfig[size];
    const initials = getInitials(name);

    // Get presence ring style - apply when showPresence is true (undefined = offline)
    const ringStyle = showPresence ? getPresenceRingStyle(presenceStatus, config.ring) : {};

    return (
        <>
            <div
                className={cn(
                    "relative inline-block rounded-full overflow-hidden",
                    className
                )}
                style={{
                    width: config.container,
                    height: config.container,
                    ...ringStyle,
                }}
            >
                {isAgent ? (
                    // AI Agent: Use glow avatar (has its own styling)
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
                            <Image
                                src={photo}
                                alt={name}
                                width={config.avatar}
                                height={config.avatar}
                                className="rounded-full object-cover"
                                style={{ width: config.avatar, height: config.avatar }}
                            />
                        ) : (
                            <div
                                className={cn(
                                    "rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-medium",
                                    config.text
                                )}
                                style={{ width: config.avatar, height: config.avatar }}
                            >
                                {initials}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* CSS animation for away pulse */}
            <style jsx global>{`
                @keyframes presence-pulse {
                    0%, 100% { 
                        box-shadow: 
                            inset 0 0 0 ${config.ring}px rgba(245, 158, 11, 0.7),
                            0 0 8px rgba(245, 158, 11, 0.3);
                    }
                    50% { 
                        box-shadow: 
                            inset 0 0 0 ${config.ring}px rgba(245, 158, 11, 0.4),
                            0 0 4px rgba(245, 158, 11, 0.15);
                    }
                }
            `}</style>
        </>
    );
}
