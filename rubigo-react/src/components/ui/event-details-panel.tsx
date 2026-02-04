"use client";

/**
 * Event Details Panel
 * 
 * Shows details for a selected scheduled event.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle, User, Calendar, FileText, X } from "lucide-react";
import { SecurePanelWrapper } from "./secure-panel-wrapper";
import type { SensitivityLevel } from "@/lib/access-control/types";

// Helper to parse ACO JSON
function parseAco(aco?: string | null): { sensitivity: SensitivityLevel; compartments: string[] } {
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

export interface EventDetails {
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
    aco?: string; // JSON: {sensitivity, compartments[]}
}

interface EventDetailsPanelProps {
    event: EventDetails;
    onClose?: () => void;
}

export function EventDetailsPanel({ event, onClose }: EventDetailsPanelProps) {
    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleString();
    };

    const formatEventType = (type: string) => {
        return type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    };

    const formatCountdown = (ms: number) => {
        if (ms <= 0) return "Ready now";
        const seconds = Math.ceil(ms / 1000);
        if (seconds < 60) return `${seconds} seconds`;
        const minutes = Math.floor(seconds / 60);
        return `${minutes} min ${seconds % 60} sec`;
    };

    let parsedPayload: Record<string, unknown> | null = null;
    try {
        if (event.payload) {
            parsedPayload = JSON.parse(event.payload);
        }
    } catch {
        // Invalid JSON, show raw
    }

    const aco = parseAco(event.aco);

    return (
        <SecurePanelWrapper
            level={aco.sensitivity}
            compartments={aco.compartments}
            className="border rounded-lg overflow-hidden h-full"
        >
            <Card className="h-full border-0">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Event Details</CardTitle>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="text-muted-foreground hover:text-foreground"
                                aria-label="Close event details"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Status */}
                    <div className="flex items-center gap-3">
                        {event.isReady ? (
                            <div className="flex items-center gap-2 text-green-500">
                                <CheckCircle className="h-5 w-5" />
                                <span className="font-medium text-lg">Ready to Process</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-amber-500">
                                <Clock className="h-5 w-5" />
                                <span className="font-medium text-lg">{formatCountdown(event.msUntilReady)}</span>
                            </div>
                        )}
                    </div>

                    {/* Event Type */}
                    <div className="space-y-1">
                        <label className="text-sm text-muted-foreground">Event Type</label>
                        <div className="text-lg font-medium">
                            {formatEventType(event.eventType)}
                        </div>
                    </div>

                    {/* Agent */}
                    <div className="space-y-1">
                        <label className="text-sm text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" /> Agent
                        </label>
                        <div className="font-medium">{event.agentName}</div>
                        <div className="text-xs text-muted-foreground font-mono">{event.agentId}</div>
                    </div>

                    {/* Timing */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Scheduled For
                            </label>
                            <div className="text-sm">{formatTime(event.scheduledFor)}</div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm text-muted-foreground">Created At</label>
                            <div className="text-sm">{formatTime(event.createdAt)}</div>
                        </div>
                    </div>

                    {/* Context */}
                    {event.contextId && (
                        <div className="space-y-1">
                            <label className="text-sm text-muted-foreground">Context ID</label>
                            <div className="font-mono text-sm bg-muted px-2 py-1 rounded">
                                {event.contextId}
                            </div>
                        </div>
                    )}

                    {/* Payload */}
                    {parsedPayload && (
                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground flex items-center gap-1">
                                <FileText className="h-3 w-3" /> Payload
                            </label>
                            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48">
                                {JSON.stringify(parsedPayload, null, 2)}
                            </pre>
                        </div>
                    )}

                    {/* Raw ID */}
                    <div className="pt-4 border-t">
                        <label className="text-xs text-muted-foreground">Event ID</label>
                        <div className="font-mono text-xs text-muted-foreground">{event.id}</div>
                    </div>
                </CardContent>
            </Card>
        </SecurePanelWrapper>
    );
}
