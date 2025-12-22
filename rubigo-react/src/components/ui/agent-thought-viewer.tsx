/**
 * Agent Thought Viewer - Display agent's internal reasoning
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AgentStatusIndicator } from "./agent-status-indicator";
import type { AgentStatus } from "@/db/schema";

export interface ThoughtEntry {
    id: string;
    timestamp: string;
    agentName: string;
    eventType: "thought" | "action" | "observation" | "decision";
    content: string;
    targetEntity?: string;
}

export interface AgentThoughtViewerProps {
    agentId: string;
    agentName: string;
    status: AgentStatus;
    thoughts: ThoughtEntry[];
    maxHeight?: string;
    className?: string;
    onClose?: () => void;
}

const eventTypeStyles: Record<ThoughtEntry["eventType"], {
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

    // Auto-scroll to bottom when new thoughts arrive
    useEffect(() => {
        if (autoScroll && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [thoughts, autoScroll]);

    return (
        <Card
            className={cn("border-purple-500/30", className)}
            data-testid="agent-thought-viewer"
            data-agent-id={agentId}
        >
            <CardHeader className="pb-2">
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
                            ✕
                        </button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea style={{ maxHeight }} ref={scrollRef}>
                    <div className="space-y-2 pr-4">
                        {thoughts.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                                No thoughts yet...
                            </div>
                        ) : (
                            thoughts.map((thought) => (
                                <ThoughtItem key={thought.id} thought={thought} />
                            ))
                        )}
                    </div>
                </ScrollArea>
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
    );
}

function ThoughtItem({ thought }: { thought: ThoughtEntry }) {
    const style = eventTypeStyles[thought.eventType];
    const time = new Date(thought.timestamp).toLocaleTimeString();

    return (
        <div
            className={cn(
                "rounded-lg p-2 text-sm",
                style.bgColor
            )}
        >
            <div className="flex items-center gap-2 mb-1">
                <span>{style.icon}</span>
                <span className={cn("font-medium capitalize", style.color)}>
                    {thought.eventType}
                </span>
                <span className="text-muted-foreground text-xs ml-auto">
                    {time}
                </span>
            </div>
            <p className="text-foreground/90">{thought.content}</p>
            {thought.targetEntity && (
                <div className="text-xs text-muted-foreground mt-1">
                    → {thought.targetEntity}
                </div>
            )}
        </div>
    );
}
