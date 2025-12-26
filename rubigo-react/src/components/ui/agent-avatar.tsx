"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface AgentAvatarProps {
    src: string;
    alt: string;
    size: number;
    className?: string;
    /** If true, applies the radial gradient fade effect on edges */
    fadeEdges?: boolean;
}

/**
 * AgentAvatar - Avatar component for AI agents with optional edge fade effect.
 * 
 * When fadeEdges is true, applies a radial gradient vignette that fades
 * the edges of the circular avatar, creating a subtle glow effect that
 * emphasizes the "energy sphere" design of AI agent avatars.
 */
export function AgentAvatar({
    src,
    alt,
    size,
    className,
    fadeEdges = false
}: AgentAvatarProps) {
    return (
        <div
            className={cn(
                "relative rounded-full overflow-hidden",
                className
            )}
            style={{ width: size, height: size }}
        >
            <Image
                src={src}
                alt={alt}
                width={size}
                height={size}
                className="rounded-full object-cover"
            />
            {fadeEdges && (
                <div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                        background: `radial-gradient(
                            circle at center,
                            transparent 50%,
                            transparent 60%,
                            rgba(0, 0, 0, 0.15) 75%,
                            rgba(0, 0, 0, 0.4) 90%,
                            rgba(0, 0, 0, 0.7) 100%
                        )`,
                    }}
                />
            )}
        </div>
    );
}
