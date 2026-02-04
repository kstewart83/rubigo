/**
 * Agent Activity Feed - Shows recent agent actions
 * 
 * Displays a list of agent events sorted by most recent.
 * Uses shared AgentEventItem component for consistent styling.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SecureTableWrapper } from "./secure-table-wrapper";
import { Activity } from "lucide-react";
import {
    AgentEventItem,
    AgentEventDetailModal,
    useEventDetailModal,
    parseAco,
    type AgentEventData,
} from "./agent-event-item";

export interface AgentActivityFeedProps {
    className?: string;
    maxHeight?: string;
    onSelectEvent?: (event: AgentEventData) => void;
}

export function AgentActivityFeed({
    className,
    maxHeight = "calc(100vh - 16rem)",
    onSelectEvent,
}: AgentActivityFeedProps) {
    const [events, setEvents] = useState<AgentEventData[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [autoScroll, setAutoScroll] = useState(true);
    const modal = useEventDetailModal();

    // Fetch recent events
    useEffect(() => {
        async function fetchEvents() {
            try {
                const res = await fetch("/api/agents/events/recent?limit=50");
                if (res.ok) {
                    const data = await res.json();
                    setEvents(data.events || []);
                }
            } catch (error) {
                console.error("Failed to fetch activity:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchEvents();

        // Poll for updates
        const interval = setInterval(fetchEvents, 5000);
        return () => clearInterval(interval);
    }, []);

    // Auto-scroll when new events arrive
    useEffect(() => {
        if (autoScroll && scrollRef.current) {
            scrollRef.current.scrollTop = 0; // Scroll to top (newest first)
        }
    }, [events, autoScroll]);

    const handleEventClick = (event: AgentEventData) => {
        modal.openModal(event);
        onSelectEvent?.(event);
    };

    return (
        <>
            <Card className={cn("border-purple-500/30 min-w-0 bg-transparent shadow-none", className)}>
                <CardHeader className="pb-2 px-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Activity className="h-5 w-5 text-muted-foreground" />
                            <CardTitle className="text-lg">Recent Activity</CardTitle>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            {events.length} events
                        </span>
                    </div>
                </CardHeader>
                <CardContent className="px-4">
                    <SecureTableWrapper
                        items={events}
                        getSensitivity={(event) => parseAco(event.aco).sensitivity}
                        getTenants={(event) => parseAco(event.aco).compartments}
                        defaultLevel="low"
                        className="border rounded-lg overflow-hidden"
                    >
                        <ScrollArea style={{ maxHeight }} ref={scrollRef}>
                            <div className="space-y-2 p-2">
                                {loading ? (
                                    <div className="text-center text-muted-foreground py-8">
                                        Loading activity...
                                    </div>
                                ) : events.length === 0 ? (
                                    <div className="text-center text-muted-foreground py-8">
                                        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p>No recent activity</p>
                                        <p className="text-xs mt-1">Agent events will appear here</p>
                                    </div>
                                ) : (
                                    events.map((event) => (
                                        <AgentEventItem
                                            key={event.id}
                                            event={event}
                                            showAgentName={true}
                                            onClick={() => handleEventClick(event)}
                                        />
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </SecureTableWrapper>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>All agents</span>
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
