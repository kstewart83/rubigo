"use client";

/**
 * Events Debug Page
 * 
 * Shows incoming SSE events in real-time for debugging.
 * Features:
 * - Clickable filter buttons by event type
 * - Tabular view with parsed payload info
 * - Real-time updates with dedup tracking
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { useEventContext } from "@/contexts/event-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Trash2, Wifi, WifiOff, RefreshCw, X } from "lucide-react";

interface EventLogEntry {
    id: string;
    type: string;
    payload: Record<string, unknown>;
    timestamp: Date;
}

interface Props {
    personnelMap: Record<string, string>;
}

type FilterType = "all" | "presence.update" | "chat.message" | "personnel.update" | "calendar.update" | "connection";

export default function EventsDebugPage({ personnelMap }: Props) {
    const { isConnected, subscribe } = useEventContext();
    const [events, setEvents] = useState<EventLogEntry[]>([]);
    const [dedupStats, setDedupStats] = useState({ received: 0, deduplicated: 0, processed: 0 });
    const [filter, setFilter] = useState<FilterType>("all");
    const seenIds = useRef<Set<string>>(new Set());

    // Helper to get personnel name from map
    const getPersonnelName = (id: string) => personnelMap[id] || id?.slice(0, 8) || "Unknown";

    // Subscribe to all event types
    useEffect(() => {
        const eventTypes = [
            "chat.message",
            "personnel.update",
            "calendar.update",
            "presence.update",
            "connection",
        ];

        const unsubscribes = eventTypes.map(type =>
            subscribe(type as "presence.update" | "chat.message" | "personnel.update" | "calendar.update" | "connection", (event) => {
                setDedupStats(prev => {
                    const newReceived = prev.received + 1;
                    if (seenIds.current.has(event.id)) {
                        return { ...prev, received: newReceived, deduplicated: prev.deduplicated + 1 };
                    }
                    seenIds.current.add(event.id);
                    return { ...prev, received: newReceived, processed: prev.processed + 1 };
                });

                const entry: EventLogEntry = {
                    id: event.id,
                    type: event.type,
                    payload: event.payload as Record<string, unknown>,
                    timestamp: new Date(),
                };

                setEvents(prev => [entry, ...prev].slice(0, 200));
            })
        );

        return () => unsubscribes.forEach(unsub => unsub());
    }, [subscribe]);

    const clearEvents = () => {
        setEvents([]);
        setDedupStats({ received: 0, deduplicated: 0, processed: 0 });
        seenIds.current.clear();
    };

    // Filtered events
    const filteredEvents = useMemo(() => {
        if (filter === "all") return events;
        return events.filter(e => e.type === filter);
    }, [events, filter]);

    // Get count for a type
    const getCount = (type: FilterType) => {
        if (type === "all") return events.length;
        return events.filter(e => e.type === type).length;
    };

    // Format payload for display
    const formatPayload = (event: EventLogEntry) => {
        const p = event.payload;
        switch (event.type) {
            case "presence.update":
                const personName = getPersonnelName(p.personnelId as string);
                return { "Person": personName, "Status": p.status, "Last Seen": new Date(p.lastSeen as string).toLocaleTimeString() };
            case "chat.message":
                return { "Channel": (p.channelId as string)?.slice(0, 8), "Sender": (p.senderId as string)?.slice(0, 8), "Content": ((p.content as string)?.slice(0, 30) || "") + "..." };
            case "personnel.update":
                return { "Action": p.action, "Personnel": p.personnelId, "Name": p.name || "-" };
            case "calendar.update":
                return { "Action": p.action, "Event": (p.eventId as string)?.slice(0, 8), "Title": p.title || "-" };
            case "connection":
                return { "Status": p.status, "Session": (p.sessionId as string)?.slice(0, 12) };
            default:
                return p;
        }
    };

    const filterButtons: { type: FilterType; label: string; color: string; bgColor: string }[] = [
        { type: "all", label: "All", color: "text-foreground", bgColor: "bg-muted/50" },
        { type: "presence.update", label: "Presence", color: "text-green-600", bgColor: "bg-green-500/10 border-green-500/20" },
        { type: "chat.message", label: "Chat", color: "text-blue-600", bgColor: "bg-blue-500/10 border-blue-500/20" },
        { type: "personnel.update", label: "Personnel", color: "text-purple-600", bgColor: "bg-purple-500/10 border-purple-500/20" },
        { type: "calendar.update", label: "Calendar", color: "text-orange-600", bgColor: "bg-orange-500/10 border-orange-500/20" },
        { type: "connection", label: "Connection", color: "text-zinc-600", bgColor: "bg-zinc-500/10 border-zinc-500/20" },
    ];

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-semibold">Events Debug</h1>
                    <Badge variant={isConnected ? "default" : "destructive"} className="gap-1">
                        {isConnected ? <><Wifi className="h-3 w-3" /> Connected</> : <><WifiOff className="h-3 w-3" /> Disconnected</>}
                    </Badge>
                </div>
                <div className="flex gap-2 items-center">
                    <span className="text-xs text-muted-foreground">
                        Recv: {dedupStats.received} | Dedup: {dedupStats.deduplicated}
                    </span>
                    <Button variant="outline" size="sm" onClick={clearEvents}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear
                    </Button>
                </div>
            </div>

            {/* Clickable Filter Buttons */}
            <div className="grid grid-cols-6 gap-3 mb-4">
                {filterButtons.map(({ type, label, color, bgColor }) => (
                    <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer ${bgColor} ${filter === type ? "ring-2 ring-primary ring-offset-2" : "hover:opacity-80"
                            }`}
                    >
                        <div className={`text-2xl font-bold ${color}`}>{getCount(type)}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                            {label}
                            {filter === type && type !== "all" && (
                                <X className="h-3 w-3" onClick={(e) => { e.stopPropagation(); setFilter("all"); }} />
                            )}
                        </div>
                    </button>
                ))}
            </div>

            {/* Events Table */}
            <div className="flex-1 border rounded-lg overflow-hidden">
                <ScrollArea className="h-full">
                    <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                                <TableHead className="w-20">Time</TableHead>
                                <TableHead className="w-32">Type</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead className="w-48">Event ID</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredEvents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                        <RefreshCw className="h-6 w-6 mx-auto mb-2 opacity-50" />
                                        {filter === "all" ? "No events received yet" : `No ${filter} events`}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredEvents.map((event) => {
                                    const details = formatPayload(event);
                                    return (
                                        <TableRow key={event.id} className="hover:bg-muted/30">
                                            <TableCell className="font-mono text-xs">
                                                {event.timestamp.toLocaleTimeString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono text-xs">
                                                    {event.type.replace(".update", "").replace(".message", "")}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-2">
                                                    {Object.entries(details).map(([key, value]) => (
                                                        <span key={key} className="text-xs">
                                                            <span className="text-muted-foreground">{key}:</span>{" "}
                                                            <span className="font-medium">{String(value)}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                {event.id.slice(0, 20)}...
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </div>
        </div>
    );
}
