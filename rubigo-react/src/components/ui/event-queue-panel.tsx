"use client";

/**
 * Agent Event Queue Panel
 * 
 * Displays pending scheduled events with pagination.
 * Shows event type, agent, scheduled time, and ready status.
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RefreshCw, Clock, CheckCircle } from "lucide-react";

export interface ScheduledEvent {
    id: string;
    agentId: string;
    agentName: string;
    eventType: string;
    contextId: string | null;
    scheduledFor: string;
    payload: string | null;
    createdAt: string;
    isReady: boolean;
    msUntilReady: number;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

interface EventQueuePanelProps {
    refreshTrigger?: number; // Increment to trigger refresh
    onSelectEvent?: (event: ScheduledEvent) => void;
    selectedEventId?: string | null;
}

export function EventQueuePanel({ refreshTrigger, onSelectEvent, selectedEventId }: EventQueuePanelProps) {
    const [events, setEvents] = useState<ScheduledEvent[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [currentTime, setCurrentTime] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);

    const fetchEvents = useCallback(async (pageNum: number) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/agents/events?page=${pageNum}&limit=8`);
            const data = await response.json();

            if (data.success) {
                setEvents(data.events);
                setPagination(data.pagination);
                setCurrentTime(data.currentTime);
            }
        } catch (error) {
            console.error("Failed to fetch events:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch on mount and when page changes
    useEffect(() => {
        fetchEvents(page);
    }, [page, fetchEvents, refreshTrigger]);

    // Auto-refresh every 2 seconds to update ready status
    useEffect(() => {
        const interval = setInterval(() => {
            fetchEvents(page);
        }, 2000);
        return () => clearInterval(interval);
    }, [page, fetchEvents]);

    const formatCountdown = (msUntilReady: number) => {
        if (msUntilReady <= 0) return "Ready";

        const seconds = Math.ceil(msUntilReady / 1000);
        if (seconds < 60) {
            return `in ${seconds}s`;
        }

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        if (minutes < 60) {
            return remainingSeconds > 0
                ? `in ${minutes}m ${remainingSeconds}s`
                : `in ${minutes}m`;
        }

        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0
            ? `in ${hours}h ${remainingMinutes}m`
            : `in ${hours}h`;
    };

    const formatEventType = (type: string) => {
        return type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <Card className="border-0 shadow-none">
            <CardHeader className="pb-2 px-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                        Event Queue
                        {pagination && (
                            <span className="ml-2 text-xs text-muted-foreground font-normal">
                                ({pagination.total} pending)
                            </span>
                        )}
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchEvents(page)}
                        disabled={loading}
                        className="h-6 w-6 p-0"
                    >
                        <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="px-0">
                {events.length === 0 ? (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                        No pending events
                    </div>
                ) : (
                    <div className="space-y-1">
                        {events.map((event) => {
                            const isSelected = selectedEventId === event.id;
                            return (
                                <button
                                    key={event.id}
                                    onClick={() => onSelectEvent?.(event)}
                                    className={`w-full flex items-center gap-2 p-2 rounded text-xs text-left transition-colors ${isSelected
                                        ? "bg-primary/20 border border-primary/40 ring-1 ring-primary/20"
                                        : event.isReady
                                            ? "bg-green-500/10 border border-green-500/20 hover:bg-green-500/20"
                                            : "bg-muted/50 hover:bg-muted"
                                        }`}
                                >
                                    {event.isReady ? (
                                        <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                                    ) : (
                                        <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1">
                                            <span className="font-medium truncate">
                                                {event.agentName}
                                            </span>
                                            <span className="text-muted-foreground">·</span>
                                            <span className="text-muted-foreground truncate">
                                                {formatEventType(event.eventType)}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground mt-0.5">
                                            @ {new Date(event.scheduledFor).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                second: "2-digit"
                                            })}
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0 min-w-[60px]">
                                        {event.isReady ? (
                                            <span className="text-green-600 dark:text-green-400 font-medium">
                                                Ready
                                            </span>
                                        ) : (
                                            <span className="text-amber-500 font-medium">
                                                {formatCountdown(event.msUntilReady)}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={!pagination.hasPrev}
                            className="h-7 px-2"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-xs text-muted-foreground">
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPage(p => p + 1)}
                            disabled={!pagination.hasNext}
                            className="h-7 px-2"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
