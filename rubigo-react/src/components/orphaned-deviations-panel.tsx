/**
 * Orphaned Deviations Panel
 * 
 * Component to display and manage orphaned deviations for recurring events.
 * An orphaned deviation is one whose originalDate no longer matches the 
 * event's current recurrence pattern.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    getOrphanedDeviations,
    deleteDeviation,
    deleteAllOrphanedDeviations,
} from "@/lib/calendar-actions";
import type { CalendarDeviation } from "@/db/schema";

interface OrphanedDeviationsPanelProps {
    /** Event ID to check for orphaned deviations */
    eventId: string;
    /** Whether the event is actually recurring */
    isRecurring: boolean;
    /** Optional callback when orphans are deleted */
    onOrphansDeleted?: () => void;
}

/**
 * Displays indicator badge and dialog for managing orphaned deviations
 */
export function OrphanedDeviationsPanel({
    eventId,
    isRecurring,
    onOrphansDeleted,
}: OrphanedDeviationsPanelProps) {
    const [orphans, setOrphans] = useState<CalendarDeviation[]>([]);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    // Load orphaned deviations
    const loadOrphans = useCallback(async () => {
        if (!isRecurring) {
            setOrphans([]);
            return;
        }

        setLoading(true);
        try {
            const result = await getOrphanedDeviations(eventId);
            setOrphans(result);
        } catch (error) {
            console.error("Failed to load orphaned deviations:", error);
            setOrphans([]);
        } finally {
            setLoading(false);
        }
    }, [eventId, isRecurring]);

    useEffect(() => {
        loadOrphans();
    }, [loadOrphans]);

    // Delete a single orphan
    const handleDeleteOne = async (deviationId: string) => {
        setDeleting(deviationId);
        try {
            const result = await deleteDeviation(deviationId);
            if (result.success) {
                setOrphans(prev => prev.filter(o => o.id !== deviationId));
                onOrphansDeleted?.();
            }
        } catch (error) {
            console.error("Failed to delete deviation:", error);
        } finally {
            setDeleting(null);
        }
    };

    // Delete all orphans
    const handleDeleteAll = async () => {
        setDeleting("all");
        try {
            const result = await deleteAllOrphanedDeviations(eventId);
            if (result.success) {
                setOrphans([]);
                setDialogOpen(false);
                onOrphansDeleted?.();
            }
        } catch (error) {
            console.error("Failed to delete all orphaned deviations:", error);
        } finally {
            setDeleting(null);
        }
    };

    // Format date for display
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "Unknown date";
        const date = new Date(dateStr + "T12:00:00");
        return date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    // Get deviation type label
    const getDeviationType = (deviation: CalendarDeviation) => {
        if (deviation.cancelled) return "Cancelled";
        if (deviation.overrideTitle || deviation.overrideStartTime || deviation.overrideEndTime) {
            return "Modified";
        }
        return "Exception";
    };

    // Don't render if not recurring or no orphans
    if (!isRecurring || (orphans.length === 0 && !loading)) {
        return null;
    }

    return (
        <>
            {/* Indicator Badge */}
            <button
                onClick={() => setDialogOpen(true)}
                className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium 
                    text-amber-700 bg-amber-50 border border-amber-200 rounded-md 
                    hover:bg-amber-100 transition-colors"
                data-testid="orphaned-deviations-indicator"
            >
                <AlertTriangle className="h-3 w-3" />
                {loading ? (
                    "Loading..."
                ) : (
                    `${orphans.length} orphaned deviation${orphans.length !== 1 ? "s" : ""}`
                )}
            </button>

            {/* Management Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Orphaned Deviations
                        </DialogTitle>
                        <DialogDescription>
                            These exceptions reference dates that no longer occur in your
                            recurrence pattern. They can be safely deleted.
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="max-h-64 pr-4">
                        <div className="space-y-2">
                            {orphans.map((orphan) => (
                                <div
                                    key={orphan.id}
                                    className="flex items-center justify-between p-3 
                                        bg-muted/50 rounded-lg border"
                                    data-testid={`orphan-deviation-${orphan.id}`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">
                                            {formatDate(orphan.originalDate)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {getDeviationType(orphan)}
                                            {orphan.overrideTitle && `: "${orphan.overrideTitle}"`}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive 
                                            hover:bg-destructive/10"
                                        onClick={() => handleDeleteOne(orphan.id)}
                                        disabled={deleting !== null}
                                        data-testid={`delete-orphan-${orphan.id}`}
                                    >
                                        {deleting === orphan.id ? (
                                            <span className="h-4 w-4 animate-spin rounded-full 
                                                border-2 border-current border-t-transparent" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>

                    {orphans.length > 1 && (
                        <div className="flex justify-end pt-4 border-t">
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleDeleteAll}
                                disabled={deleting !== null}
                                data-testid="delete-all-orphans"
                            >
                                {deleting === "all" ? (
                                    <>
                                        <span className="h-4 w-4 mr-2 animate-spin rounded-full 
                                            border-2 border-current border-t-transparent" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete All ({orphans.length})
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {orphans.length === 0 && !loading && (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No orphaned deviations found.</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
