"use client";

/**
 * AgentGlowAvatar - Reusable AI agent avatar with neon glow effect.
 * 
 * A scalable component that renders an AI agent's avatar with a layered
 * glow effect: neon orb + glassmorphism overlay + zoomed avatar image.
 * 
 * Usage:
 *   <AgentGlowAvatar size={64} src="/api/photos/headshot_agent01" alt="ARIA" />
 *   <AgentGlowAvatar size={120} src={photo} alt={name} />
 */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AgentGlowAvatarProps {
    /** Size in pixels (diameter of the avatar) */
    size: number;
    /** Image source URL */
    src?: string | null;
    /** Alt text for accessibility */
    alt: string;
    /** Optional fallback initials (auto-generated from alt if not provided) */
    initials?: string;
    /** Additional className for the container */
    className?: string;
}

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export function AgentGlowAvatar({
    size,
    src,
    alt,
    initials,
    className,
}: AgentGlowAvatarProps) {
    const displayInitials = initials || getInitials(alt);

    // Scale factors relative to size
    const glowOrbSize = size * 1.15;      // Outer glow is 15% larger
    const glassSize = size * 1.08;        // Glass overlay is 8% larger
    const avatarSize = size;              // Avatar is the exact size
    const avatarZoom = size * 1.4;        // Avatar image is 40% zoomed to fill edge fade

    // Glow intensity scales with size
    const glowBlur1 = Math.max(6, size * 0.1);
    const glowBlur2 = Math.max(12, size * 0.18);
    const glowBlur3 = Math.max(20, size * 0.28);

    // Font size for fallback initials
    const fontSize = Math.max(12, size * 0.25);

    return (
        <div
            className={cn(
                "relative flex items-center justify-center",
                className
            )}
            style={{ width: glowOrbSize, height: glowOrbSize }}
        >
            {/* Layer 1: Neon glow orb */}
            <div
                className="absolute rounded-full"
                style={{
                    width: glowOrbSize,
                    height: glowOrbSize,
                    background: 'radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, rgba(147, 51, 234, 0.15) 50%, rgba(124, 58, 237, 0.08) 100%)',
                    boxShadow: `
                        0 0 ${glowBlur1}px rgba(168, 85, 247, 0.35),
                        0 0 ${glowBlur2}px rgba(147, 51, 234, 0.25),
                        0 0 ${glowBlur3}px rgba(124, 58, 237, 0.18)
                    `,
                    animation: 'agent-glow-pulse 3s ease-in-out infinite',
                }}
            />

            {/* Layer 2: Glassmorphism overlay */}
            <div
                className="absolute rounded-full"
                style={{
                    width: glassSize,
                    height: glassSize,
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
            />

            {/* Layer 3: Avatar with mask for edge fade */}
            <div
                className="relative rounded-full overflow-hidden z-10"
                style={{
                    width: avatarSize,
                    height: avatarSize,
                    maskImage: 'radial-gradient(circle, black 60%, transparent 100%)',
                    WebkitMaskImage: 'radial-gradient(circle, black 60%, transparent 100%)',
                }}
            >
                <Avatar
                    className="rounded-full"
                    style={{ width: avatarZoom, height: avatarZoom, marginLeft: -(avatarZoom - avatarSize) / 2, marginTop: -(avatarZoom - avatarSize) / 2 }}
                >
                    {src && <AvatarImage src={src} alt={alt} className="rounded-full object-cover" />}
                    <AvatarFallback
                        className="rounded-full bg-purple-500/20 text-purple-300 font-semibold"
                        style={{ fontSize }}
                    >
                        {displayInitials}
                    </AvatarFallback>
                </Avatar>
            </div>

            {/* CSS animation keyframes */}
            <style jsx global>{`
                @keyframes agent-glow-pulse {
                    0%, 100% { 
                        box-shadow: 
                            0 0 ${glowBlur1}px rgba(168, 85, 247, 0.35),
                            0 0 ${glowBlur2}px rgba(147, 51, 234, 0.25),
                            0 0 ${glowBlur3}px rgba(124, 58, 237, 0.18);
                    }
                    50% { 
                        box-shadow: 
                            0 0 ${glowBlur1 * 1.5}px rgba(168, 85, 247, 0.45),
                            0 0 ${glowBlur2 * 1.5}px rgba(147, 51, 234, 0.35),
                            0 0 ${glowBlur3 * 1.5}px rgba(124, 58, 237, 0.25);
                    }
                }
            `}</style>
        </div>
    );
}
