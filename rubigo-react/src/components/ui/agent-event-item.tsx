/**
 * Agent Event Item - Shared component for displaying agent events
 * 
 * Used by both AgentActivityFeed (all agents) and AgentThoughtViewer (single agent)
 * to ensure consistent styling and behavior.
 */

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SecurityBadge } from "./security-badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Hash, MessageCircle, Reply, SmilePlus } from "lucide-react";
import type { SensitivityLevel } from "@/lib/access-control/types";

// ============================================================================
// Types
// ============================================================================

export interface AgentEventData {
    id: string;
    personnelId?: string;
    agentName: string;
    timestamp: string;
    eventType: "thought" | "action" | "observation" | "decision";
    content: string;
    targetEntity?: string;
    channelName?: string;
    actionType?: string;
    aco?: string;
    metadata?: string;
}

interface ParsedAco {
    sensitivity: SensitivityLevel;
    compartments: string[];
}

interface ParsedMetadata {
    type?: string;
    model?: string;
    digest?: string;
}

// ============================================================================
// Helpers
// ============================================================================

export function parseAco(aco?: string | null): ParsedAco {
    if (!aco) return { sensitivity: "low", compartments: [] };
    try {
        const parsed = JSON.parse(aco);
        return {
            sensitivity: parsed.sensitivity || "low",
            compartments: parsed.compartments || [],
        };
    } catch {
        return { sensitivity: "low", compartments: [] };
    }
}

export function parseMetadata(metadata?: string | null): ParsedMetadata {
    if (!metadata) return {};
    try {
        return JSON.parse(metadata);
    } catch {
        return {};
    }
}

export const eventTypeStyles: Record<AgentEventData["eventType"], {
    icon: string;
    color: string;
    bgColor: string;
}> = {
    thought: {
        icon: "💭",
        color: "text-purple-400",
        bgColor: "bg-purple-500/10",
    },
    action: {
        icon: "⚡",
        color: "text-amber-400",
        bgColor: "bg-amber-500/10",
    },
    observation: {
        icon: "👁",
        color: "text-blue-400",
        bgColor: "bg-blue-500/10",
    },
    decision: {
        icon: "🎯",
        color: "text-green-400",
        bgColor: "bg-green-500/10",
    },
};

// ============================================================================
// Event Item Component
// ============================================================================

export interface AgentEventItemProps {
    event: AgentEventData;
    /** Show agent name in the header (for multi-agent views) */
    showAgentName?: boolean;
    /** Format function for relative time display */
    formatTime?: (timestamp: string) => string;
    /** Called when the event item is clicked */
    onClick?: () => void;
}

/**
 * A single event item (thought, action, observation, decision)
 * Can be used in any list view - activity feed or agent-specific view
 */
export function AgentEventItem({
    event,
    showAgentName = true,
    formatTime = defaultFormatTime,
    onClick,
}: AgentEventItemProps) {
    const style = eventTypeStyles[event.eventType];
    const aco = parseAco(event.aco);
    const meta = parseMetadata(event.metadata);

    return (
        <div
            className={cn(
                "rounded-lg p-2 text-sm cursor-pointer hover:ring-1 hover:ring-white/10 transition-all",
                style.bgColor
            )}
            onClick={onClick}
        >
            <div className="flex items-center gap-2 mb-1 min-w-0">
                <span className="shrink-0">{style.icon}</span>
                {showAgentName && (
                    <span className="font-medium text-sm truncate">
                        {event.agentName}
                    </span>
                )}
                <span className={cn("text-xs capitalize shrink-0", style.color)}>
                    {event.eventType}
                </span>
                <SecurityBadge
                    aco={aco}
                    size="sm"
                    className="shrink-0"
                />
                <span className="text-muted-foreground text-xs ml-auto shrink-0">
                    {formatTime(event.timestamp)}
                </span>
            </div>
            <p className="text-foreground/90 line-clamp-2">{event.content}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                {meta.model && (
                    <span className="font-mono">{meta.model}</span>
                )}
                {event.channelName && (
                    <>
                        {meta.model && <span className="text-muted-foreground/50">•</span>}
                        <Hash className="h-3 w-3 shrink-0" />
                        <span className="truncate">{event.channelName}</span>
                        {event.actionType && (
                            <span className="flex items-center gap-1 shrink-0">
                                {event.actionType === "message" && <MessageCircle className="h-3 w-3" />}
                                {event.actionType === "reply" && <Reply className="h-3 w-3" />}
                                {event.actionType === "reaction" && <SmilePlus className="h-3 w-3" />}
                                {event.actionType}
                            </span>
                        )}
                    </>
                )}
                {!event.channelName && event.targetEntity && (
                    <>
                        {meta.model && <span className="text-muted-foreground/50">•</span>}
                        <span>→ {event.targetEntity}</span>
                    </>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// Event Detail Modal Component
// ============================================================================

export interface AgentEventDetailModalProps {
    event: AgentEventData | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * Modal dialog showing full event details
 */
export function AgentEventDetailModal({
    event,
    open,
    onOpenChange,
}: AgentEventDetailModalProps) {
    if (!event) return null;

    const style = eventTypeStyles[event.eventType];
    const meta = parseMetadata(event.metadata);
    const aco = parseAco(event.aco);

    const formatFullTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg backdrop-blur-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span>{style.icon}</span>
                        <span className={style.color}>
                            {event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1)}
                        </span>
                        <span className="text-muted-foreground">by</span>
                        <span>{event.agentName}</span>
                    </DialogTitle>
                    <DialogDescription>
                        {formatFullTime(event.timestamp)}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    {/* Full Content */}
                    <div className="space-y-1">
                        <label className="text-xs text-muted-foreground font-medium">Content</label>
                        <div className={cn("rounded-lg p-3 text-sm", style.bgColor)}>
                            {event.content}
                        </div>
                    </div>

                    {/* Channel Info */}
                    {event.channelName && (
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground font-medium">Channel</label>
                            <div className="flex items-center gap-2 text-sm">
                                <Hash className="h-4 w-4" />
                                <span>{event.channelName}</span>
                                {event.actionType && (
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                        ({event.actionType === "message" && <MessageCircle className="h-3 w-3" />}
                                        {event.actionType === "reply" && <Reply className="h-3 w-3" />}
                                        {event.actionType === "reaction" && <SmilePlus className="h-3 w-3" />}
                                        {event.actionType})
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Target Entity */}
                    {event.targetEntity && !event.channelName && (
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground font-medium">Target</label>
                            <div className="text-sm">→ {event.targetEntity}</div>
                        </div>
                    )}

                    {/* Security Badge */}
                    <div className="space-y-1">
                        <label className="text-xs text-muted-foreground font-medium">Classification</label>
                        <div>
                            <SecurityBadge
                                aco={aco}
                                size="default"
                                showIcon
                            />
                        </div>
                    </div>

                    {/* Model Info */}
                    {meta.model && (
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground font-medium">Model</label>
                            <div className="text-sm">
                                <span className="font-medium">{meta.model}</span>
                                {meta.digest && (
                                    <span className="ml-2 font-mono text-xs text-muted-foreground">
                                        {meta.digest.substring(0, 12)}...
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Event ID */}
                    <div className="pt-2 border-t">
                        <label className="text-xs text-muted-foreground">Event ID</label>
                        <div className="font-mono text-xs text-muted-foreground">{event.id}</div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ============================================================================
// Hook for managing event selection with modal
// ============================================================================

export function useEventDetailModal() {
    const [selectedEvent, setSelectedEvent] = useState<AgentEventData | null>(null);

    return {
        selectedEvent,
        isOpen: !!selectedEvent,
        openModal: (event: AgentEventData) => setSelectedEvent(event),
        closeModal: () => setSelectedEvent(null),
        setOpen: (open: boolean) => !open && setSelectedEvent(null),
    };
}

// ============================================================================
// Helpers
// ============================================================================

function defaultFormatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
}
