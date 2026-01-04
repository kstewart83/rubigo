/**
 * Agent Thought Viewer - Display agent's internal reasoning
 * 
 * Uses shared AgentEventItem component for consistent styling with activity feed.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AgentStatusIndicator } from "./agent-status-indicator";
import { SecureTableWrapper } from "./secure-table-wrapper";
import { X } from "lucide-react";
import {
    AgentEventItem,
    AgentEventDetailModal,
    useEventDetailModal,
    parseAco,
    type AgentEventData,
} from "./agent-event-item";
import type { AgentStatus } from "@/db/schema";

export interface AgentThoughtViewerProps {
    agentId: string;
    agentName: string;
    status: AgentStatus;
    thoughts: AgentEventData[];
    maxHeight?: string;
    className?: string;
    onClose?: () => void;
}

/**
 * Display an agent's thought stream
 */
export function AgentThoughtViewer({
    agentId,
    agentName,
    status,
    thoughts,
    maxHeight = "400px",
    className,
    onClose,
}: AgentThoughtViewerProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [autoScroll, setAutoScroll] = useState(true);
    const modal = useEventDetailModal();

    // Auto-scroll to bottom when new thoughts arrive
    useEffect(() => {
        if (autoScroll && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [thoughts, autoScroll]);

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString();
    };

    return (
        <>
            <Card
                className={cn("border-purple-500/30 min-w-0 bg-transparent shadow-none", className)}
                data-testid="agent-thought-viewer"
                data-agent-id={agentId}
            >
                <CardHeader className="pb-2 px-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CardTitle className="text-lg">{agentName}</CardTitle>
                            <AgentStatusIndicator status={status} size="sm" />
                        </div>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="text-muted-foreground hover:text-foreground"
                                aria-label="Close thought viewer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="px-4">
                    <SecureTableWrapper
                        items={thoughts}
                        getSensitivity={(thought) => parseAco(thought.aco).sensitivity}
                        getTenants={(thought) => parseAco(thought.aco).compartments}
                        defaultLevel="low"
                        className="border rounded-lg overflow-hidden"
                    >
                        <ScrollArea style={{ maxHeight }} ref={scrollRef}>
                            <div className="space-y-2 p-2">
                                {thoughts.length === 0 ? (
                                    <div className="text-center text-muted-foreground py-8">
                                        No thoughts yet...
                                    </div>
                                ) : (
                                    thoughts.map((thought) => (
                                        <AgentEventItem
                                            key={thought.id}
                                            event={thought}
                                            showAgentName={false}
                                            formatTime={formatTime}
                                            onClick={() => modal.openModal(thought)}
                                        />
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </SecureTableWrapper>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{thoughts.length} events</span>
                        <label className="flex items-center gap-1 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={autoScroll}
                                onChange={(e) => setAutoScroll(e.target.checked)}
                                className="w-3 h-3"
                            />
                            Auto-scroll
                        </label>
                    </div>
                </CardContent>
            </Card>

            <AgentEventDetailModal
                event={modal.selectedEvent}
                open={modal.isOpen}
                onOpenChange={modal.setOpen}
            />
        </>
    );
}

// Re-export ThoughtEntry type for backwards compatibility
export type ThoughtEntry = AgentEventData;
