/**
 * Calendar Page Content Component
 * 
 * Features:
 * - Month and Week views
 * - Event creation/editing
 * - Navigation between months
 * - Event pills with color coding
 */

"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Calendar as CalendarIcon,
    X,
} from "lucide-react";
import {
    eventTypeInfo,
    type EventType,
} from "@/lib/calendar-utils";
import {
    createCalendarEvent,
    getCalendarEvents,
    getEventDeviations,
    updateCalendarEvent,
    deleteCalendarEvent,
    cancelEventInstance,
    modifyEventInstance,
    moveEventInstance,
    type CalendarEventInput,
} from "@/lib/calendar-actions";
import { expandRecurringEvents } from "@/lib/calendar-utils";
import { usePersona } from "@/contexts/persona-context";

// ============================================================================
// Timezone Constants
// ============================================================================

const TIMEZONES = [
    { value: "America/New_York", label: "Eastern Time (GMT-5)" },
    { value: "America/Chicago", label: "Central Time (GMT-6)" },
    { value: "America/Denver", label: "Mountain Time (GMT-7)" },
    { value: "America/Los_Angeles", label: "Pacific Time (GMT-8)" },
    { value: "America/Anchorage", label: "Alaska Time (GMT-9)" },
    { value: "Pacific/Honolulu", label: "Hawaii Time (GMT-10)" },
    { value: "Europe/London", label: "London (GMT+0)" },
    { value: "Europe/Paris", label: "Paris (GMT+1)" },
    { value: "Europe/Berlin", label: "Berlin (GMT+1)" },
    { value: "Asia/Tokyo", label: "Tokyo (GMT+9)" },
    { value: "Asia/Shanghai", label: "Shanghai (GMT+8)" },
    { value: "Asia/Singapore", label: "Singapore (GMT+8)" },
    { value: "Australia/Sydney", label: "Sydney (GMT+11)" },
    { value: "UTC", label: "UTC (GMT+0)" },
] as const;

// Get browser's timezone
function getBrowserTimezone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
        return "America/New_York";
    }
}

// Get friendly display name for a timezone
function getTimezoneDisplayName(tz: string): string {
    const found = TIMEZONES.find(t => t.value === tz);
    return found ? found.label : tz;
}

// Get offset in minutes for a timezone (simplified - uses current date)
function getTimezoneOffsetMinutes(tz: string): number {
    try {
        const date = new Date();
        const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
        const tzDate = new Date(date.toLocaleString("en-US", { timeZone: tz }));
        return (tzDate.getTime() - utcDate.getTime()) / 60000;
    } catch {
        return 0;
    }
}

// Convert time from one timezone to another
function convertTime(hour: number, minute: number, fromTz: string, toTz: string): { hour: number; minute: number } {
    const fromOffset = getTimezoneOffsetMinutes(fromTz);
    const toOffset = getTimezoneOffsetMinutes(toTz);
    const offsetDiff = toOffset - fromOffset;

    let totalMins = hour * 60 + minute + offsetDiff;
    let h = Math.floor(totalMins / 60) % 24;
    if (h < 0) h += 24;
    const m = ((totalMins % 60) + 60) % 60;

    return { hour: h, minute: m };
}

// Format time for display (12-hour format)
function formatTime12h(hour: number, minute: number): string {
    const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const period = hour < 12 ? "AM" : "PM";
    return `${h12}:${minute.toString().padStart(2, "0")} ${period}`;
}

// ============================================================================
// Event Positioning Utilities
// ============================================================================

const HOUR_HEIGHT_PX = 48; // Height of one hour in pixels
const START_HOUR = 6; // Grid starts at 6 AM

interface PositionedEvent {
    event: CalendarEvent;
    top: number;      // px from top of grid
    height: number;   // px height based on duration
    lane: number;     // 0-indexed lane for horizontal positioning
    totalLanes: number; // Total lanes in this overlap group
}

/**
 * Calculate the vertical position and height of an event based on its time
 */
function getEventTimePosition(event: CalendarEvent): { top: number; height: number } {
    const { start, end } = getInstanceDateTime(event);

    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;

    // Position relative to START_HOUR
    const top = (startHour - START_HOUR) * HOUR_HEIGHT_PX;
    const height = Math.max((endHour - startHour) * HOUR_HEIGHT_PX, 20); // Minimum 20px height

    return { top, height };
}

/**
 * Get the actual start/end datetime for an event instance
 * For recurring events, combines instanceDate with the time portion of startTime/endTime
 */
function getInstanceDateTime(event: CalendarEvent): { start: Date; end: Date } {
    if (event.isRecurring && event.instanceDate) {
        const origStart = new Date(event.startTime);
        const origEnd = new Date(event.endTime);

        const startStr = `${event.instanceDate}T${origStart.toTimeString().substring(0, 8)}`;
        const endStr = `${event.instanceDate}T${origEnd.toTimeString().substring(0, 8)}`;

        return {
            start: new Date(startStr),
            end: new Date(endStr),
        };
    }

    return {
        start: new Date(event.startTime),
        end: new Date(event.endTime),
    };
}

/**
 * Check if two events overlap in time
 */
function eventsOverlap(a: CalendarEvent, b: CalendarEvent): boolean {
    const aTimes = getInstanceDateTime(a);
    const bTimes = getInstanceDateTime(b);

    return aTimes.start < bTimes.end && bTimes.start < aTimes.end;
}

/**
 * Assign lanes to overlapping events using a greedy algorithm
 */
function assignLanes(events: CalendarEvent[]): PositionedEvent[] {
    if (events.length === 0) return [];

    // Sort by start time, then by end time (longer events first)
    const sorted = [...events].sort((a, b) => {
        const aStart = new Date(a.startTime).getTime();
        const bStart = new Date(b.startTime).getTime();
        if (aStart !== bStart) return aStart - bStart;
        // For same start time, put longer events first
        const aDuration = new Date(a.endTime).getTime() - aStart;
        const bDuration = new Date(b.endTime).getTime() - bStart;
        return bDuration - aDuration;
    });

    // Find overlap groups (connected components)
    const groups: CalendarEvent[][] = [];
    const visited = new Set<string>();

    for (const event of sorted) {
        if (visited.has(event.id + event.instanceDate)) continue;

        // Find all events that overlap with this one (transitively)
        const group: CalendarEvent[] = [];
        const stack = [event];

        while (stack.length > 0) {
            const current = stack.pop()!;
            const key = current.id + current.instanceDate;
            if (visited.has(key)) continue;
            visited.add(key);
            group.push(current);

            // Find all events that overlap with current
            for (const other of sorted) {
                const otherKey = other.id + other.instanceDate;
                if (!visited.has(otherKey) && eventsOverlap(current, other)) {
                    stack.push(other);
                }
            }
        }

        if (group.length > 0) {
            groups.push(group);
        }
    }

    // Assign lanes within each group
    const result: PositionedEvent[] = [];

    for (const group of groups) {
        // Sort group by start time (using instance times)
        group.sort((a, b) => {
            const aTime = getInstanceDateTime(a);
            const bTime = getInstanceDateTime(b);
            return aTime.start.getTime() - bTime.start.getTime();
        });

        // Track end times for each lane
        const laneEndTimes: number[] = [];
        const eventLanes = new Map<string, number>();

        for (const event of group) {
            const times = getInstanceDateTime(event);
            const eventStart = times.start.getTime();
            const eventEnd = times.end.getTime();

            // Find first available lane
            let lane = 0;
            while (lane < laneEndTimes.length && laneEndTimes[lane] > eventStart) {
                lane++;
            }

            // Assign lane
            eventLanes.set(event.id + event.instanceDate, lane);

            // Update lane end time
            if (lane >= laneEndTimes.length) {
                laneEndTimes.push(eventEnd);
            } else {
                laneEndTimes[lane] = eventEnd;
            }
        }

        const totalLanes = laneEndTimes.length;

        for (const event of group) {
            const { top, height } = getEventTimePosition(event);
            result.push({
                event,
                top,
                height,
                lane: eventLanes.get(event.id + event.instanceDate) || 0,
                totalLanes,
            });
        }
    }

    return result;
}

/**
 * Check if an event is an all-day event
 * All-day events span midnight-to-midnight or have the allDay flag
 */
function isAllDayEvent(event: CalendarEvent): boolean {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);

    // Check if times indicate all-day (00:00:00 to 23:59:xx or 00:00:00 next day)
    const startsAtMidnight = start.getHours() === 0 && start.getMinutes() === 0;
    const endsAtEndOfDay = (end.getHours() === 23 && end.getMinutes() >= 59) ||
        (end.getHours() === 0 && end.getMinutes() === 0);

    return startsAtMidnight && endsAtEndOfDay;
}

// ============================================================================
// Types
// ============================================================================

interface CalendarEvent {
    id: string;
    title: string;
    description: string | null;
    startTime: string;
    endTime: string;
    eventType: EventType;
    recurrence: string;
    recurrenceDays: string | null;
    recurrenceUntil?: string | null;
    location: string | null;
    instanceDate: string;
    isRecurring: boolean;
    hasDeviation?: boolean;
    timezone?: string;
}

// ============================================================================
// Calendar Page Content
// ============================================================================

export function CalendarPageContent() {
    const { currentPersona } = usePersona();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<"month" | "week" | "day">("month");
    const [workWeekOnly, setWorkWeekOnly] = useState(false);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
    const [showDetailsPanel, setShowDetailsPanel] = useState(false);

    // Recurring event choice dialog state
    const [showDeleteChoiceDialog, setShowDeleteChoiceDialog] = useState(false);
    const [showEditChoiceDialog, setShowEditChoiceDialog] = useState(false);
    const [pendingAction, setPendingAction] = useState<"delete" | "edit" | null>(null);

    // Fetch events for current view using server actions
    const fetchEvents = useCallback(async () => {
        setLoading(true);
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // Get first and last day of month (with buffer)
        const startDate = new Date(year, month, 1);
        startDate.setDate(startDate.getDate() - 7); // Include previous week
        const endDate = new Date(year, month + 1, 0);
        endDate.setDate(endDate.getDate() + 7); // Include next week

        try {
            // Use server actions directly
            // Format dates as YYYY-MM-DD to match how events are stored
            const startStr = format(startDate, "yyyy-MM-dd");
            const endStr = format(endDate, "yyyy-MM-dd");
            const rawEvents = await getCalendarEvents(
                `${startStr}T00:00:00`,
                `${endStr}T23:59:59`
            );

            // Get deviations and expand recurring events
            const deviationsMap = new Map();
            for (const event of rawEvents) {
                if (event.recurrence && event.recurrence !== "none") {
                    const deviations = await getEventDeviations(event.id);
                    deviationsMap.set(event.id, deviations);
                }
            }

            const expanded = expandRecurringEvents(
                rawEvents,
                `${startStr}T00:00:00`,
                `${endStr}T23:59:59`,
                deviationsMap
            );

            console.log("[Calendar] Fetched events:", {
                rawCount: rawEvents.length,
                expandedCount: expanded.length,
                events: expanded.map(e => ({ id: e.id, title: e.title, instanceDate: e.instanceDate }))
            });

            setEvents(expanded as CalendarEvent[]);
        } catch (error) {
            console.error("Failed to fetch events:", error);
        } finally {
            setLoading(false);
        }
    }, [currentDate]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    // Navigation - view-aware (days in day view, weeks in week view, months in month view)
    const goToPrevious = () => {
        if (view === "day") {
            // Move back one day
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1));
        } else if (view === "week") {
            // Move back one week
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7));
        } else {
            // Move back one month
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        }
    };

    const goToNext = () => {
        if (view === "day") {
            // Move forward one day
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1));
        } else if (view === "week") {
            // Move forward one week
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7));
        } else {
            // Move forward one month
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        }
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Get month display name
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h1>
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" onClick={goToPrevious} data-testid="nav-prev">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={goToToday}>
                            Today
                        </Button>
                        <Button variant="outline" size="icon" onClick={goToNext} data-testid="nav-next">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
                        <Button
                            variant={view === "month" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setView("month")}
                        >
                            Month
                        </Button>
                        <Button
                            variant={view === "week" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setView("week")}
                            data-testid="week-view-toggle"
                        >
                            Week
                        </Button>
                        <Button
                            variant={view === "day" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setView("day")}
                            data-testid="day-view-toggle"
                        >
                            Day
                        </Button>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={workWeekOnly}
                            onChange={(e) => setWorkWeekOnly(e.target.checked)}
                            data-testid="work-week-toggle"
                            className="rounded"
                        />
                        Work week
                    </label>
                    <Button onClick={() => setShowEventModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Event
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            ) : view === "month" ? (
                <MonthGrid
                    currentDate={currentDate}
                    events={events}
                    workWeekOnly={workWeekOnly}
                    onEventClick={(event) => {
                        setSelectedEvent(event);
                        setShowDetailsPanel(true);
                    }}
                />
            ) : view === "week" ? (
                <WeekView
                    currentDate={currentDate}
                    events={events}
                    workWeekOnly={workWeekOnly}
                    onEventClick={(event) => {
                        setSelectedEvent(event);
                        setShowDetailsPanel(true);
                    }}
                />
            ) : (
                <DayView
                    currentDate={currentDate}
                    events={events}
                    onEventClick={(event) => {
                        setSelectedEvent(event);
                        setShowDetailsPanel(true);
                    }}
                />
            )}

            {/* Event Modal */}
            <EventModal
                open={showEventModal}
                onClose={() => {
                    setShowEventModal(false);
                    setEditingEvent(null);
                }}
                editingEvent={editingEvent}
                onSave={async (eventData, eventId) => {
                    console.log("[Calendar] onSave called, eventId:", eventId, "currentPersona:", currentPersona?.id);
                    if (!currentPersona) {
                        console.error("[Calendar] No currentPersona - cannot save event");
                        setShowEventModal(false);
                        setEditingEvent(null);
                        return;
                    }
                    try {
                        // Check if we're editing just one instance of a recurring event
                        const isEditingInstanceOnly = (editingEvent as CalendarEvent & { _editingInstanceOnly?: boolean })?._editingInstanceOnly;

                        if (eventId && isEditingInstanceOnly && editingEvent?.instanceDate) {
                            // Check if the date was changed (instance move)
                            const originalDate = editingEvent.instanceDate; // YYYY-MM-DD
                            const newDate = eventData.startTime?.split("T")[0]; // Extract date from datetime

                            if (newDate && newDate !== originalDate) {
                                // Date changed - this is a MOVE operation
                                console.log("[Calendar] Moving instance from", originalDate, "to", newDate);
                                const result = await moveEventInstance(
                                    eventId,
                                    originalDate,
                                    newDate,
                                    {
                                        startTime: eventData.startTime,
                                        endTime: eventData.endTime,
                                        title: eventData.title,
                                        description: eventData.description,
                                        location: eventData.location,
                                        timezone: eventData.timezone,
                                    }
                                );
                                console.log("[Calendar] Move instance result:", result);
                                if (result.success) {
                                    setShowEventModal(false);
                                    setEditingEvent(null);
                                    fetchEvents();
                                }
                            } else {
                                // Same date - just modify this instance
                                console.log("[Calendar] Modifying single instance:", editingEvent.instanceDate, eventData);
                                const result = await modifyEventInstance(
                                    eventId,
                                    editingEvent.instanceDate,
                                    {
                                        startTime: eventData.startTime,
                                        endTime: eventData.endTime,
                                        title: eventData.title,
                                        description: eventData.description,
                                        location: eventData.location,
                                        timezone: eventData.timezone,
                                    }
                                );
                                console.log("[Calendar] Modify instance result:", result);
                                if (result.success) {
                                    setShowEventModal(false);
                                    setEditingEvent(null);
                                    fetchEvents();
                                }
                            }
                        } else if (eventId) {
                            // Update entire series / existing event
                            console.log("[Calendar] Updating event:", eventId, eventData);
                            const result = await updateCalendarEvent(eventId, eventData);
                            console.log("[Calendar] Update result:", result);
                            if (result.success) {
                                setShowEventModal(false);
                                setEditingEvent(null);
                                fetchEvents();
                            }
                        } else {
                            // Create new event
                            console.log("[Calendar] Creating event:", eventData);
                            const result = await createCalendarEvent(eventData, currentPersona.id);
                            console.log("[Calendar] Create result:", result);
                            if (result.success) {
                                setShowEventModal(false);
                                setEditingEvent(null);
                                fetchEvents();
                            }
                        }
                    } catch (error) {
                        console.error("Failed to save event:", error);
                        setShowEventModal(false);
                        setEditingEvent(null);
                    }
                }}
            />

            {/* Details Panel */}
            <EventDetailsPanel
                event={selectedEvent}
                open={showDetailsPanel}
                onClose={() => {
                    setShowDetailsPanel(false);
                    setSelectedEvent(null);
                }}
                onEdit={() => {
                    if (selectedEvent) {
                        if (selectedEvent.isRecurring) {
                            // Show choice dialog for recurring events
                            setPendingAction("edit");
                            setShowEditChoiceDialog(true);
                        } else {
                            // Non-recurring: edit directly
                            setEditingEvent(selectedEvent);
                            setShowDetailsPanel(false);
                            setSelectedEvent(null);
                            setShowEventModal(true);
                        }
                    }
                }}
                onDelete={async () => {
                    if (selectedEvent) {
                        if (selectedEvent.isRecurring) {
                            // Show choice dialog for recurring events
                            setPendingAction("delete");
                            setShowDeleteChoiceDialog(true);
                        } else {
                            // Non-recurring: delete directly
                            try {
                                await deleteCalendarEvent(selectedEvent.id);
                                setShowDetailsPanel(false);
                                setSelectedEvent(null);
                                fetchEvents();
                            } catch (error) {
                                console.error("Failed to delete event:", error);
                            }
                        }
                    }
                }}
            />

            {/* Delete Choice Dialog for Recurring Events */}
            <Dialog open={showDeleteChoiceDialog} onOpenChange={setShowDeleteChoiceDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Recurring Event</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground mb-4">
                        &quot;{selectedEvent?.title}&quot; is a recurring event. What would you like to delete?
                    </p>
                    <div className="flex flex-col gap-2">
                        <Button
                            variant="outline"
                            onClick={async () => {
                                // Delete just this instance (cancel it)
                                if (selectedEvent) {
                                    try {
                                        // Cancel this instance
                                        await cancelEventInstance(
                                            selectedEvent.id,
                                            selectedEvent.instanceDate
                                        );
                                        setShowDeleteChoiceDialog(false);
                                        setShowDetailsPanel(false);
                                        setSelectedEvent(null);
                                        setPendingAction(null);
                                        fetchEvents();
                                    } catch (error) {
                                        console.error("Failed to cancel instance:", error);
                                    }
                                }
                            }}
                        >
                            Just This Occurrence
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={async () => {
                                // Delete entire series
                                if (selectedEvent) {
                                    try {
                                        await deleteCalendarEvent(selectedEvent.id);
                                        setShowDeleteChoiceDialog(false);
                                        setShowDetailsPanel(false);
                                        setSelectedEvent(null);
                                        setPendingAction(null);
                                        fetchEvents();
                                    } catch (error) {
                                        console.error("Failed to delete series:", error);
                                    }
                                }
                            }}
                        >
                            All Occurrences
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setShowDeleteChoiceDialog(false);
                                setPendingAction(null);
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Choice Dialog for Recurring Events */}
            <Dialog open={showEditChoiceDialog} onOpenChange={setShowEditChoiceDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Recurring Event</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground mb-4">
                        &quot;{selectedEvent?.title}&quot; is a recurring event. What would you like to edit?
                    </p>
                    <div className="flex flex-col gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                // Edit just this instance
                                if (selectedEvent) {
                                    setEditingEvent({
                                        ...selectedEvent,
                                        // Mark that we're editing just this instance
                                        _editingInstanceOnly: true,
                                    } as CalendarEvent & { _editingInstanceOnly?: boolean });
                                    setShowEditChoiceDialog(false);
                                    setShowDetailsPanel(false);
                                    setSelectedEvent(null);
                                    setShowEventModal(true);
                                    setPendingAction(null);
                                }
                            }}
                        >
                            This Occurrence Only
                        </Button>
                        <Button
                            variant="default"
                            onClick={() => {
                                // Edit entire series
                                if (selectedEvent) {
                                    setEditingEvent(selectedEvent);
                                    setShowEditChoiceDialog(false);
                                    setShowDetailsPanel(false);
                                    setSelectedEvent(null);
                                    setShowEventModal(true);
                                    setPendingAction(null);
                                }
                            }}
                        >
                            All Occurrences
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setShowEditChoiceDialog(false);
                                setPendingAction(null);
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ============================================================================
// Month Grid Component
// ============================================================================

function MonthGrid({
    currentDate,
    events,
    workWeekOnly,
    onEventClick,
}: {
    currentDate: Date;
    events: CalendarEvent[];
    workWeekOnly: boolean;
    onEventClick: (event: CalendarEvent) => void;
}) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Get first day of month and number of days
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay();

    // Today's date for highlighting
    const today = new Date();
    const isToday = (date: Date) =>
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

    // Build calendar grid (6 weeks x 7 days)
    const allDays: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    // Previous month days
    const prevMonthDays = startingDayOfWeek;
    const prevMonth = new Date(year, month, 0);
    for (let i = prevMonthDays - 1; i >= 0; i--) {
        allDays.push({
            date: new Date(year, month - 1, prevMonth.getDate() - i),
            isCurrentMonth: false,
        });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
        allDays.push({
            date: new Date(year, month, i),
            isCurrentMonth: true,
        });
    }

    // Next month days
    const remainingDays = 42 - allDays.length;
    for (let i = 1; i <= remainingDays; i++) {
        allDays.push({
            date: new Date(year, month + 1, i),
            isCurrentMonth: false,
        });
    }

    // Filter out weekends if work week mode is enabled
    const days = workWeekOnly
        ? allDays.filter(({ date }) => {
            const dayOfWeek = date.getDay();
            return dayOfWeek !== 0 && dayOfWeek !== 6; // Exclude Sun (0) and Sat (6)
        })
        : allDays;

    // Get events for a specific date
    const getEventsForDate = (date: Date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        return events.filter((e) => e.instanceDate === dateStr);
    };

    const allDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayNames = workWeekOnly
        ? allDayNames.filter((_, i) => i !== 0 && i !== 6) // Mon-Fri only
        : allDayNames;

    const gridCols = workWeekOnly ? 5 : 7;

    return (
        <div className="flex-1 overflow-auto" data-testid="month-grid">
            {/* Day headers */}
            <div className={`grid border-b`} style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}>
                {dayNames.map((day) => (
                    <div
                        key={day}
                        className="p-2 text-center text-sm font-medium text-muted-foreground"
                        data-testid={`month-header-${day.toLowerCase()}`}
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className={`grid flex-1`} style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}>
                {days.map(({ date, isCurrentMonth }, index) => {
                    const dayEvents = getEventsForDate(date);
                    const isTodayCell = isToday(date);

                    return (
                        <div
                            key={index}
                            className={`min-h-24 border-b border-r p-1 ${!isCurrentMonth ? "bg-muted/50" : ""
                                }`}
                            data-testid={isTodayCell ? "today" : undefined}
                        >
                            <div
                                className={`text-sm mb-1 ${isTodayCell
                                    ? "bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center"
                                    : ""
                                    } ${!isCurrentMonth ? "text-muted-foreground" : ""}`}
                            >
                                {date.getDate()}
                            </div>
                            <div className="space-y-1">
                                {dayEvents.slice(0, 3).map((event) => (
                                    <EventPill
                                        key={`${event.id}-${event.instanceDate}`}
                                        event={event}
                                        onClick={() => onEventClick(event)}
                                    />
                                ))}
                                {dayEvents.length > 3 && (
                                    <div className="text-xs text-muted-foreground">
                                        +{dayEvents.length - 3} more
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ============================================================================
// Week View Component
// ============================================================================

function WeekView({
    currentDate,
    events,
    workWeekOnly,
    onEventClick,
}: {
    currentDate: Date;
    events: CalendarEvent[];
    workWeekOnly: boolean;
    onEventClick: (event: CalendarEvent) => void;
}) {
    // Get week start (Sunday)
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());

    // Generate days of week
    const days: Date[] = [];
    const startDay = workWeekOnly ? 1 : 0; // Mon or Sun
    const endDay = workWeekOnly ? 6 : 7; // Sat or Sun (exclusive)

    for (let i = startDay; i < endDay; i++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i);
        days.push(day);
    }

    // Time slots (6 AM to 10 PM = 17 hours)
    const hours = Array.from({ length: 17 }, (_, i) => i + 6);
    const totalHeight = hours.length * HOUR_HEIGHT_PX;

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    // Get positioned events for a specific date (exclude all-day events)
    const getPositionedEventsForDate = (date: Date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        const dayEvents = events.filter((e) => e.instanceDate === dateStr && !isAllDayEvent(e));
        return assignLanes(dayEvents);
    };

    // Get all-day events for a specific date
    const getAllDayEventsForDate = (date: Date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        return events.filter((e) => e.instanceDate === dateStr && isAllDayEvent(e));
    };

    // Check if there are any all-day events this week
    const hasAnyAllDayEvents = days.some((day) => getAllDayEventsForDate(day).length > 0);

    return (
        <div className="flex-1 overflow-auto" data-testid="week-view">
            {/* Day headers */}
            <div className="grid sticky top-0 bg-background z-10" style={{ gridTemplateColumns: `60px repeat(${days.length}, 1fr)` }}>
                <div className="p-2 border-b" /> {/* Empty corner */}
                {days.map((day) => (
                    <div
                        key={day.toISOString()}
                        className="p-2 text-center border-b border-l"
                    >
                        <div className="text-sm text-muted-foreground">
                            {dayNames[day.getDay()]}
                        </div>
                        <div className="text-lg font-semibold">{day.getDate()}</div>
                    </div>
                ))}
            </div>

            {/* All Day Events Section */}
            {hasAnyAllDayEvents && (
                <div className="grid border-b" style={{ gridTemplateColumns: `60px repeat(${days.length}, 1fr)` }} data-testid="all-day-section">
                    <div className="p-1 text-xs text-muted-foreground text-right pr-2">All day</div>
                    {days.map((day) => {
                        const allDayEvents = getAllDayEventsForDate(day);
                        return (
                            <div key={`allday-${day.toISOString()}`} className="p-1 border-l min-h-8">
                                {allDayEvents.map((event) => (
                                    <AllDayEventPill
                                        key={`${event.id}-${event.instanceDate}`}
                                        event={event}
                                        onClick={() => onEventClick(event)}
                                    />
                                ))}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Time grid with events */}
            <div className="grid" style={{ gridTemplateColumns: `60px repeat(${days.length}, 1fr)` }}>
                {/* Time labels column */}
                <div className="relative" style={{ height: totalHeight }}>
                    {hours.map((hour, idx) => (
                        <div
                            key={hour}
                            className="absolute text-xs text-muted-foreground pr-2 text-right w-full"
                            style={{ top: idx * HOUR_HEIGHT_PX, height: HOUR_HEIGHT_PX }}
                        >
                            {hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                        </div>
                    ))}
                </div>

                {/* Day columns */}
                {days.map((day) => {
                    const positionedEvents = getPositionedEventsForDate(day);

                    return (
                        <div
                            key={day.toISOString()}
                            className="relative border-l"
                            style={{ height: totalHeight }}
                        >
                            {/* Hour gridlines */}
                            {hours.map((hour, idx) => (
                                <div
                                    key={hour}
                                    className="absolute w-full border-b"
                                    style={{ top: idx * HOUR_HEIGHT_PX, height: HOUR_HEIGHT_PX }}
                                />
                            ))}

                            {/* Positioned events */}
                            {positionedEvents.map(({ event, top, height, lane, totalLanes }) => {
                                const width = `calc(${100 / totalLanes}% - 2px)`;
                                const left = `calc(${(lane / totalLanes) * 100}% + 1px)`;

                                return (
                                    <PositionedEventPill
                                        key={`${event.id}-${event.instanceDate}`}
                                        event={event}
                                        top={top}
                                        height={height}
                                        width={width}
                                        left={left}
                                        onClick={() => onEventClick(event)}
                                    />
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ============================================================================
// Current Time Indicator Component
// ============================================================================

function CurrentTimeIndicator() {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        // Update every minute
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    // Calculate position based on current hour/minute
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();
    const hourDecimal = hour + minute / 60;

    // Position relative to START_HOUR (6 AM)
    const top = (hourDecimal - START_HOUR) * HOUR_HEIGHT_PX;

    // Don't render if outside visible range (6 AM - 10 PM)
    if (hour < START_HOUR || hour >= START_HOUR + 17) {
        return null;
    }

    return (
        <div
            className="absolute left-0 right-0 z-20 pointer-events-none"
            style={{ top: `${top}px` }}
            data-testid="current-time-indicator"
        >
            {/* Red circle at the start */}
            <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-red-500" />
            {/* Red line across */}
            <div className="h-0.5 bg-red-500 w-full" />
        </div>
    );
}

// ============================================================================
// Day View Component
// ============================================================================

function DayView({
    currentDate,
    events,
    onEventClick,
}: {
    currentDate: Date;
    events: CalendarEvent[];
    onEventClick: (event: CalendarEvent) => void;
}) {
    // Time slots (6 AM to 10 PM = 17 hours)
    const hours = Array.from({ length: 17 }, (_, i) => i + 6);
    const totalHeight = hours.length * HOUR_HEIGHT_PX;

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    // Get events for the current date
    const dateStr = format(currentDate, "yyyy-MM-dd");
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const isToday = dateStr === todayStr;

    // Separate all-day and timed events
    const allDayEvents = events.filter((e) => e.instanceDate === dateStr && isAllDayEvent(e));
    const timedEvents = events.filter((e) => e.instanceDate === dateStr && !isAllDayEvent(e));
    const positionedEvents = assignLanes(timedEvents);

    return (
        <div className="flex-1 overflow-auto" data-testid="day-view">
            {/* Day header */}
            <div className="grid sticky top-0 bg-background z-10" style={{ gridTemplateColumns: "60px 1fr" }}>
                <div className="p-2 border-b" /> {/* Empty corner */}
                <div className="p-2 text-center border-b border-l">
                    <div className="text-sm text-muted-foreground">
                        {dayNames[currentDate.getDay()]}
                    </div>
                    <div className="text-lg font-semibold">{currentDate.getDate()}</div>
                </div>
            </div>

            {/* All Day Events Section */}
            {allDayEvents.length > 0 && (
                <div className="grid border-b" style={{ gridTemplateColumns: "60px 1fr" }} data-testid="all-day-section">
                    <div className="p-1 text-xs text-muted-foreground text-right pr-2">All day</div>
                    <div className="p-1 border-l min-h-8">
                        {allDayEvents.map((event) => (
                            <AllDayEventPill
                                key={`${event.id}-${event.instanceDate}`}
                                event={event}
                                onClick={() => onEventClick(event)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Time grid with events */}
            <div className="grid" style={{ gridTemplateColumns: "60px 1fr" }}>
                {/* Time labels column */}
                <div className="relative" style={{ height: totalHeight }}>
                    {hours.map((hour, idx) => (
                        <div
                            key={hour}
                            className="absolute text-xs text-muted-foreground pr-2 text-right w-full"
                            style={{ top: idx * HOUR_HEIGHT_PX, height: HOUR_HEIGHT_PX }}
                        >
                            {hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                        </div>
                    ))}
                </div>

                {/* Day column */}
                <div className="relative border-l" style={{ height: totalHeight }}>
                    {/* Hour gridlines */}
                    {hours.map((hour, idx) => (
                        <div
                            key={hour}
                            className="absolute w-full border-b"
                            style={{ top: idx * HOUR_HEIGHT_PX, height: HOUR_HEIGHT_PX }}
                        />
                    ))}

                    {/* Positioned events */}
                    {positionedEvents.map(({ event, top, height, lane, totalLanes }) => {
                        const width = `calc(${100 / totalLanes}% - 2px)`;
                        const left = `calc(${(lane / totalLanes) * 100}% + 1px)`;

                        return (
                            <PositionedEventPill
                                key={`${event.id}-${event.instanceDate}`}
                                event={event}
                                top={top}
                                height={height}
                                width={width}
                                left={left}
                                onClick={() => onEventClick(event)}
                            />
                        );
                    })}

                    {/* Current time indicator - only show for today */}
                    {isToday && <CurrentTimeIndicator />}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Event Pill Component (for Month view - flow layout)
// ============================================================================

function EventPill({
    event,
    onClick,
}: {
    event: CalendarEvent;
    onClick: () => void;
}) {
    const typeInfo = eventTypeInfo[event.eventType] || eventTypeInfo.meeting;

    return (
        <button
            className="event-pill w-full text-left text-xs p-1 rounded truncate cursor-pointer hover:opacity-80"
            style={{ backgroundColor: typeInfo.color, color: typeInfo.textColor || "white" }}
            onClick={onClick}
            data-testid="event-pill"
        >
            {event.title}
        </button>
    );
}

// ============================================================================
// Positioned Event Pill Component (for Day/Week view - absolute positioning)
// ============================================================================

function PositionedEventPill({
    event,
    top,
    height,
    width,
    left,
    onClick,
}: {
    event: CalendarEvent;
    top: number;
    height: number;
    width: string;
    left: string;
    onClick: () => void;
}) {
    const typeInfo = eventTypeInfo[event.eventType] || eventTypeInfo.meeting;

    // Format time display
    const startTime = new Date(event.startTime);
    const timeStr = `${startTime.getHours() % 12 || 12}:${startTime.getMinutes().toString().padStart(2, "0")} ${startTime.getHours() >= 12 ? "PM" : "AM"}`;

    return (
        <button
            className="absolute rounded text-xs p-1 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
            style={{
                backgroundColor: typeInfo.color,
                color: typeInfo.textColor || "white",
                top: `${top}px`,
                height: `${height}px`,
                width,
                left,
            }}
            onClick={onClick}
            data-testid="positioned-event-pill"
        >
            <div className="font-medium truncate">{event.title}</div>
            {height >= 36 && <div className="text-xs opacity-80">{timeStr}</div>}
        </button>
    );
}

// ============================================================================
// All Day Event Pill Component
// ============================================================================

function AllDayEventPill({
    event,
    onClick,
}: {
    event: CalendarEvent;
    onClick: () => void;
}) {
    const typeInfo = eventTypeInfo[event.eventType] || eventTypeInfo.meeting;

    return (
        <button
            className="w-full text-left text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 mb-1"
            style={{ backgroundColor: typeInfo.color, color: typeInfo.textColor || "white" }}
            onClick={onClick}
            data-testid="all-day-event-pill"
        >
            {event.title}
        </button>
    );
}

// ============================================================================
// Event Modal Component
// ============================================================================

function EventModal({
    open,
    onClose,
    onSave,
    editingEvent,
}: {
    open: boolean;
    onClose: () => void;
    onSave: (data: CalendarEventInput, eventId?: string) => Promise<void>;
    editingEvent?: CalendarEvent | null;
}) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("10:00");
    const [eventType, setEventType] = useState<EventType>("meeting");
    const [location, setLocation] = useState("");
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrence, setRecurrence] = useState<"daily" | "weekly" | "monthly" | "yearly">("weekly");
    const [recurrenceDays, setRecurrenceDays] = useState<string[]>([]);
    const [recurrenceUntil, setRecurrenceUntil] = useState<Date | undefined>(undefined);
    const [timezone, setTimezone] = useState(getBrowserTimezone());
    const [allDay, setAllDay] = useState(false);
    const [saving, setSaving] = useState(false);

    // Check if we're editing just one instance of a recurring event
    const isEditingInstanceOnly = (editingEvent as CalendarEvent & { _editingInstanceOnly?: boolean })?._editingInstanceOnly === true;

    // Get browser timezone for comparison
    const browserTimezone = getBrowserTimezone();

    // Reset/populate form when modal opens
    useEffect(() => {
        if (open) {
            if (editingEvent) {
                // Pre-fill form with existing event data
                setTitle(editingEvent.title);
                setDescription(editingEvent.description || "");
                // For recurring events, use instanceDate to show the specific instance's date
                // For non-recurring events or when editing the series, use startTime
                if (editingEvent.instanceDate && editingEvent.isRecurring) {
                    // Use the instance date that was clicked on
                    setSelectedDate(new Date(editingEvent.instanceDate + "T00:00:00"));
                } else {
                    setSelectedDate(new Date(editingEvent.startTime));
                }
                setDatePickerOpen(false);
                // Extract time from startTime/endTime (format: "2024-01-01T09:00:00")
                const startTimePart = editingEvent.startTime.split("T")[1]?.substring(0, 5) || "09:00";
                const endTimePart = editingEvent.endTime.split("T")[1]?.substring(0, 5) || "10:00";
                setStartTime(startTimePart);
                setEndTime(endTimePart);
                setEventType(editingEvent.eventType as EventType);
                setLocation(editingEvent.location || "");
                setIsRecurring(editingEvent.isRecurring);
                if (editingEvent.recurrence && editingEvent.recurrence !== "none") {
                    setRecurrence(editingEvent.recurrence as "daily" | "weekly" | "monthly" | "yearly");
                }
                // Load recurrence days from event data (stored as JSON string)
                if (editingEvent.recurrenceDays) {
                    try {
                        setRecurrenceDays(JSON.parse(editingEvent.recurrenceDays));
                    } catch {
                        setRecurrenceDays([]);
                    }
                } else {
                    setRecurrenceDays([]);
                }
                if (editingEvent.recurrenceUntil) {
                    setRecurrenceUntil(new Date(editingEvent.recurrenceUntil));
                } else {
                    setRecurrenceUntil(undefined);
                }
                setTimezone(editingEvent.timezone || getBrowserTimezone());
            } else {
                // Reset form for new event
                setTitle("");
                setDescription("");
                setSelectedDate(new Date());
                setDatePickerOpen(false);
                setStartTime("09:00");
                setEndTime("10:00");
                setEventType("meeting");
                setLocation("");
                setIsRecurring(false);
                setRecurrence("weekly");
                setRecurrenceDays([]);
                setTimezone(getBrowserTimezone());
            }
        }
    }, [open, editingEvent]);

    const handleSave = async () => {
        if (!title || !selectedDate) return;

        const dateStr = format(selectedDate, "yyyy-MM-dd");
        setSaving(true);
        try {
            await onSave({
                title,
                description: description || undefined,
                startTime: allDay ? `${dateStr}T00:00:00` : `${dateStr}T${startTime}:00`,
                endTime: allDay ? `${dateStr}T23:59:59` : `${dateStr}T${endTime}:00`,
                eventType,
                location: location || undefined,
                recurrence: isRecurring ? recurrence : "none",
                recurrenceDays: isRecurring && recurrence === "weekly" ? recurrenceDays : undefined,
                recurrenceUntil: isRecurring && recurrenceUntil ? format(recurrenceUntil, "yyyy-MM-dd") : undefined,
                timezone,
                allDay,
            }, editingEvent?.id);
            onClose(); // Close modal after successful save
        } finally {
            setSaving(false);
        }
    };

    const toggleDay = (day: string) => {
        setRecurrenceDays((prev) =>
            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
        );
    };

    const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{editingEvent ? "Edit Event" : "New Event"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Event title"
                        />
                    </div>
                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Event description"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Date</Label>
                            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        id="date"
                                        data-testid="event-date"
                                        className="w-full justify-start text-left font-normal"
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={(date) => {
                                            setSelectedDate(date);
                                            setDatePickerOpen(false);
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div>
                            <Label htmlFor="eventType">Type</Label>
                            <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(eventTypeInfo).map(([key, info]) => (
                                        <SelectItem key={key} value={key}>
                                            {info.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {/* All Day Toggle */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="all-day-toggle"
                            data-testid="all-day-toggle"
                            checked={allDay}
                            onChange={(e) => setAllDay(e.target.checked)}
                            className="rounded"
                        />
                        <Label htmlFor="all-day-toggle">All Day</Label>
                    </div>
                    {/* Time inputs - hidden when All Day is checked */}
                    {!allDay && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="startTime">Start Time</Label>
                                <Input
                                    id="startTime"
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    data-testid="start-time"
                                />
                            </div>
                            <div>
                                <Label htmlFor="endTime">End Time</Label>
                                <Input
                                    id="endTime"
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    data-testid="end-time"
                                />
                            </div>
                        </div>
                    )}
                    <div>
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select value={timezone} onValueChange={setTimezone}>
                            <SelectTrigger data-testid="timezone-select">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {TIMEZONES.map((tz) => (
                                    <SelectItem key={tz.value} value={tz.value}>
                                        {tz.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {/* Local time preview - only show when event TZ differs from browser TZ */}
                    {timezone !== browserTimezone && (() => {
                        const [startHour, startMin] = startTime.split(":").map(Number);
                        const [endHour, endMin] = endTime.split(":").map(Number);
                        const localStart = convertTime(startHour, startMin, timezone, browserTimezone);
                        const localEnd = convertTime(endHour, endMin, timezone, browserTimezone);
                        return (
                            <div
                                className="rounded-md bg-muted/50 p-3 text-sm"
                                data-testid="local-time-preview"
                            >
                                <span className="font-medium text-muted-foreground">Your local time: </span>
                                <span>
                                    {formatTime12h(localStart.hour, localStart.minute)} - {formatTime12h(localEnd.hour, localEnd.minute)} ({getTimezoneDisplayName(browserTimezone)})
                                </span>
                            </div>
                        );
                    })()}
                    <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                            id="location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Meeting location"
                        />
                    </div>
                    {/* Recurrence section - hidden when editing single instance */}
                    {!isEditingInstanceOnly && (
                        <>
                            <div className="flex items-center gap-2" data-testid="recurrence-section">
                                <input
                                    type="checkbox"
                                    id="recurrence-toggle"
                                    checked={isRecurring}
                                    onChange={(e) => setIsRecurring(e.target.checked)}
                                    className="rounded"
                                />
                                <Label htmlFor="recurrence-toggle">Repeat</Label>
                            </div>
                            {isRecurring && (
                                <div className="space-y-4 pl-6 border-l-2">
                                    <div>
                                        <Label htmlFor="recurrence-frequency">Frequency</Label>
                                        <Select value={recurrence} onValueChange={(v) => setRecurrence(v as typeof recurrence)}>
                                            <SelectTrigger id="recurrence-frequency">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="daily">Daily</SelectItem>
                                                <SelectItem value="weekly">Weekly</SelectItem>
                                                <SelectItem value="monthly">Monthly</SelectItem>
                                                <SelectItem value="yearly">Yearly</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {recurrence === "weekly" && (
                                        <div>
                                            <Label>Days</Label>
                                            <div className="flex gap-1 mt-1">
                                                {daysOfWeek.map((day) => (
                                                    <button
                                                        key={day}
                                                        type="button"
                                                        onClick={() => toggleDay(day)}
                                                        className={`px-2 py-1 text-xs rounded border ${recurrenceDays.includes(day)
                                                            ? "bg-primary text-primary-foreground"
                                                            : "bg-muted"
                                                            }`}
                                                        data-day={day}
                                                    >
                                                        {day}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <Label htmlFor="recurrence-until">Until (optional)</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    id="recurrence-until"
                                                    variant="outline"
                                                    className="w-full justify-start text-left font-normal mt-1"
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {recurrenceUntil ? recurrenceUntil.toLocaleDateString() : "No end date"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={recurrenceUntil}
                                                    onSelect={(d) => {
                                                        setRecurrenceUntil(d);
                                                    }}
                                                    initialFocus
                                                />
                                                {recurrenceUntil && (
                                                    <div className="p-2 border-t">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setRecurrenceUntil(undefined)}
                                                            className="w-full"
                                                        >
                                                            Clear end date
                                                        </Button>
                                                    </div>
                                                )}
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving || !title}>
                            {saving ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ============================================================================
// Event Details Panel Component
// ============================================================================

function EventDetailsPanel({
    event,
    open,
    onClose,
    onEdit,
    onDelete,
}: {
    event: CalendarEvent | null;
    open: boolean;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    if (!event) return null;

    const typeInfo = eventTypeInfo[event.eventType] || eventTypeInfo.meeting;

    // For recurring events, construct the display date from instanceDate + time from startTime
    // For non-recurring events, use startTime directly
    let displayStartTime: Date;
    let displayEndTime: Date;

    if (event.isRecurring && event.instanceDate) {
        // Get time portion from original startTime/endTime
        const origStart = new Date(event.startTime);
        const origEnd = new Date(event.endTime);

        // Create new dates with instance date and original time
        displayStartTime = new Date(event.instanceDate + "T" + origStart.toTimeString().substring(0, 8));
        displayEndTime = new Date(event.instanceDate + "T" + origEnd.toTimeString().substring(0, 8));
    } else {
        displayStartTime = new Date(event.startTime);
        displayEndTime = new Date(event.endTime);
    }

    // For calculations below that need original startTime
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);

    return (
        <div
            className={`fixed inset-y-0 right-0 w-96 bg-background border-l shadow-lg transform transition-transform z-50 ${open ? "translate-x-0" : "translate-x-full"
                }`}
            data-testid="event-details-panel"
        >
            <div className="p-4 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <div
                        className="px-2 py-1 rounded text-xs text-white"
                        style={{ backgroundColor: typeInfo.color }}
                    >
                        {typeInfo.label}
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <h2 className="text-xl font-bold mb-4">{event.title}</h2>

                <div className="space-y-4 flex-1">
                    <div>
                        <Label className="text-muted-foreground">Date & Time</Label>
                        <p>
                            {displayStartTime.toLocaleDateString()} {displayStartTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {displayEndTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            {event.timezone && (
                                <span className="text-muted-foreground"> ({getTimezoneDisplayName(event.timezone)})</span>
                            )}
                        </p>
                        {/* Show local time if event timezone differs from browser timezone */}
                        {event.timezone && event.timezone !== getBrowserTimezone() && (() => {
                            const browserTz = getBrowserTimezone();
                            const startHour = startTime.getHours();
                            const startMin = startTime.getMinutes();
                            const endHour = endTime.getHours();
                            const endMin = endTime.getMinutes();
                            const localStart = convertTime(startHour, startMin, event.timezone, browserTz);
                            const localEnd = convertTime(endHour, endMin, event.timezone, browserTz);
                            return (
                                <div
                                    className="mt-2 rounded-md bg-muted/50 p-2 text-sm"
                                    data-testid="local-time-details"
                                >
                                    <span className="font-medium text-muted-foreground">Your local time: </span>
                                    <span>
                                        {formatTime12h(localStart.hour, localStart.minute)} - {formatTime12h(localEnd.hour, localEnd.minute)} ({getTimezoneDisplayName(browserTz)})
                                    </span>
                                </div>
                            );
                        })()}
                    </div>

                    {event.location && (
                        <div>
                            <Label className="text-muted-foreground">Location</Label>
                            <p>{event.location}</p>
                        </div>
                    )}

                    {event.description && (
                        <div>
                            <Label className="text-muted-foreground">Description</Label>
                            <p>{event.description}</p>
                        </div>
                    )}

                    {event.isRecurring && (
                        <div>
                            <Label className="text-muted-foreground">Recurrence</Label>
                            <p className="text-sm">{event.recurrence}</p>
                        </div>
                    )}

                    {/* Deviation status indicator */}
                    {event.hasDeviation && (
                        <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-2">
                            <Label className="text-amber-700 dark:text-amber-400 text-sm font-medium">
                                {(event as CalendarEvent & { isUnanchored?: boolean }).isUnanchored
                                    ? "📅 Moved Instance"
                                    : "✏️ Modified Instance"}
                            </Label>
                            <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">
                                {(event as CalendarEvent & { isUnanchored?: boolean }).isUnanchored
                                    ? "This occurrence was moved from its original date in the series."
                                    : "This occurrence has been modified from the series."}
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={onEdit} className="flex-1">
                        Edit
                    </Button>
                    <Button variant="destructive" onClick={onDelete}>
                        Delete
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default CalendarPageContent;
