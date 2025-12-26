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

import { useState, useEffect, useCallback, Fragment, useRef } from "react";
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Calendar as CalendarIcon,
    X,
    Users,
    User,
    AlertTriangle,
} from "lucide-react";
import { ParticipantPicker, type ParticipantItem } from "@/components/participant-picker";
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
import { OrphanedDeviationsPanel } from "@/components/orphaned-deviations-panel";
import { useAnalytics } from "@/hooks/use-analytics";
import { SecurePanelWrapper } from "@/components/ui/secure-panel-wrapper";
import { SecurityBadge } from "@/components/ui/security-badge";
import { SecurityLabelPicker } from "@/components/ui/security-label-picker";
import { useSecurity } from "@/contexts/security-context";
import { getPersonnelPage } from "@/lib/personnel-actions";
import { getTeams } from "@/lib/teams-actions";
import { getEventParticipantsRaw } from "@/lib/calendar-actions";

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
// Security Utilities
// ============================================================================

type SensitivityLevel = "public" | "low" | "moderate" | "high";

const SENSITIVITY_ORDER: Record<SensitivityLevel, number> = {
    public: 0,
    low: 1,
    moderate: 2,
    high: 3,
};

function parseAco(aco: string | undefined): {
    sensitivity: SensitivityLevel;
    tenants: string[];
    tenantNames: string[];
    tenantLevels: Record<string, SensitivityLevel>;
} {
    if (!aco) return { sensitivity: "low", tenants: [], tenantNames: [], tenantLevels: {} };
    try {
        const parsed = JSON.parse(aco);
        const sensitivity = (parsed.sensitivity || "low") as SensitivityLevel;
        const rawTenants: string[] = parsed.tenants || [];

        // Extract tenant names and levels from "LEVEL:TENANT" format
        const tenantNames: string[] = [];
        const tenantLevels: Record<string, SensitivityLevel> = {};

        for (const t of rawTenants) {
            if (typeof t === "string" && t.includes(":")) {
                const [level, name] = t.split(":");
                if (level && name) {
                    const normalizedLevel = level.toLowerCase() as SensitivityLevel;
                    if (["public", "low", "moderate", "high"].includes(normalizedLevel)) {
                        tenantNames.push(name);
                        tenantLevels[name] = normalizedLevel;
                    } else {
                        tenantNames.push(t);
                        tenantLevels[t] = sensitivity;
                    }
                }
            } else if (typeof t === "string") {
                tenantNames.push(t);
                tenantLevels[t] = sensitivity;
            }
        }

        return {
            sensitivity,
            tenants: rawTenants,
            tenantNames,
            tenantLevels,
        };
    } catch {
        return { sensitivity: "low", tenants: [], tenantNames: [], tenantLevels: {} };
    }
}

/**
 * Parse raw tenant array (like ["moderate:apples"]) into display-ready format
 */
function parseTenants(rawTenants: string[] | undefined, fallbackLevel: SensitivityLevel = "low"): {
    tenantNames: string[];
    tenantLevels: Record<string, SensitivityLevel>;
} {
    if (!rawTenants || rawTenants.length === 0) {
        return { tenantNames: [], tenantLevels: {} };
    }

    const tenantNames: string[] = [];
    const tenantLevels: Record<string, SensitivityLevel> = {};

    for (const t of rawTenants) {
        if (typeof t === "string" && t.includes(":")) {
            const [level, name] = t.split(":");
            if (level && name) {
                const normalizedLevel = level.toLowerCase() as SensitivityLevel;
                if (["public", "low", "moderate", "high"].includes(normalizedLevel)) {
                    tenantNames.push(name);
                    tenantLevels[name] = normalizedLevel;
                } else {
                    tenantNames.push(t);
                    tenantLevels[t] = fallbackLevel;
                }
            }
        } else if (typeof t === "string") {
            tenantNames.push(t);
            tenantLevels[t] = fallbackLevel;
        }
    }

    return { tenantNames, tenantLevels };
}

function getMaxSensitivity(events: Array<{ aco?: string }>): SensitivityLevel {
    let max: SensitivityLevel = "low";
    for (const event of events) {
        const { sensitivity } = parseAco(event.aco);
        if (SENSITIVITY_ORDER[sensitivity] > SENSITIVITY_ORDER[max]) {
            max = sensitivity;
        }
    }
    return max;
}

function getAllTenants(events: Array<{ aco?: string }>): string[] {
    const tenantSet = new Set<string>();
    for (const event of events) {
        const { tenantNames } = parseAco(event.aco);
        tenantNames.forEach(t => tenantSet.add(t));
    }
    return Array.from(tenantSet);
}

function getAllTenantLevels(events: Array<{ aco?: string }>): Record<string, SensitivityLevel> {
    const levels: Record<string, SensitivityLevel> = {};
    for (const event of events) {
        const { tenantLevels } = parseAco(event.aco);
        Object.assign(levels, tenantLevels);
    }
    return levels;
}

/**
 * Check if the event's description is accessible based on session context.
 * Uses descriptionAco if set, otherwise falls back to base aco.
 */
function isDescriptionAccessible(
    event: { descriptionAco?: string | null; aco?: string },
    sessionLevel: SensitivityLevel,
    activeTenants: string[]
): boolean {
    const descAco = parseAco(event.descriptionAco || event.aco);

    // Check sensitivity level
    if (SENSITIVITY_ORDER[descAco.sensitivity] > SENSITIVITY_ORDER[sessionLevel]) {
        return false;
    }

    // Check tenants
    if (descAco.tenants.length > 0) {
        const hasAllTenants = descAco.tenants.every(t => activeTenants.includes(t));
        if (!hasAllTenants) return false;
    }

    return true;
}

// ============================================================================
// Event Positioning Utilities
// ============================================================================

const START_HOUR = 6; // Grid starts at 6 AM
const END_HOUR = 23; // Grid ends at 11 PM
const SLOTS_PER_HOUR = 6; // 10-minute slots per hour
const TOTAL_HOURS = END_HOUR - START_HOUR; // 17 hours
const TOTAL_SLOTS = TOTAL_HOURS * SLOTS_PER_HOUR; // 102 slots

interface PositionedEvent {
    event: CalendarEvent;
    startSlot: number;  // Grid row start (1-indexed for CSS grid)
    endSlot: number;    // Grid row end (exclusive, CSS grid style)
    lane: number;       // 0-indexed lane for horizontal positioning
    totalLanes: number; // Total lanes in this overlap group
}

/**
 * Calculate the grid slot position for an event based on its time
 */
function getEventSlotPosition(event: CalendarEvent): { startSlot: number; endSlot: number } {
    const { start, end } = getInstanceDateTime(event);

    const startMinutes = (start.getHours() - START_HOUR) * 60 + start.getMinutes();
    const endMinutes = (end.getHours() - START_HOUR) * 60 + end.getMinutes();

    // Convert minutes to slots (1 slot = 10 minutes), 1-indexed for CSS grid
    const startSlot = Math.max(1, Math.floor(startMinutes / 10) + 1);
    const endSlot = Math.max(startSlot + 1, Math.ceil(endMinutes / 10) + 1); // At least 1 slot

    return { startSlot, endSlot };
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
            const { startSlot, endSlot } = getEventSlotPosition(event);
            result.push({
                event,
                startSlot,
                endSlot,
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
    aco?: string;
    descriptionAco?: string;
    _descriptionRedacted?: boolean; // Server-side redaction marker
}

// ============================================================================
// Calendar Page Content
// ============================================================================

export function CalendarPageContent() {
    const { currentPersona } = usePersona();
    const { trackEvent } = useAnalytics();

    // Initialize state from localStorage
    const [currentDate, setCurrentDate] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('calendar.currentDate');
            return saved ? new Date(saved) : new Date();
        }
        return new Date();
    });
    const [view, setView] = useState<"month" | "week" | "day">(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('calendar.view');
            if (saved === 'month' || saved === 'week' || saved === 'day') return saved;
        }
        return "month";
    });
    const [workWeekOnly, setWorkWeekOnly] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('calendar.workWeekOnly') === 'true';
        }
        return false;
    });
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
    const [showDetailsPanel, setShowDetailsPanel] = useState(false);

    // Persist state to localStorage
    useEffect(() => {
        localStorage.setItem('calendar.currentDate', currentDate.toISOString());
    }, [currentDate]);

    useEffect(() => {
        localStorage.setItem('calendar.view', view);
    }, [view]);

    useEffect(() => {
        localStorage.setItem('calendar.workWeekOnly', String(workWeekOnly));
    }, [workWeekOnly]);

    // Handle view change with analytics tracking
    const handleViewChange = (newView: "month" | "week" | "day") => {
        trackEvent('calendar.view_change', { properties: { from: view, to: newView } });
        setView(newView);
    };

    // Recurring event choice dialog state
    const [showDeleteChoiceDialog, setShowDeleteChoiceDialog] = useState(false);
    const [showEditChoiceDialog, setShowEditChoiceDialog] = useState(false);
    const [pendingAction, setPendingAction] = useState<"delete" | "edit" | null>(null);

    // Fetch events for current view using server actions
    const { sessionLevel, activeTenants, activeTenantLevels } = useSecurity();
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
                `${endStr}T23:59:59`,
                // Pass session context for server-side ABAC filtering (includes tenant-specific levels)
                { sessionLevel, activeTenants, activeTenantLevels }
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
    }, [currentDate, sessionLevel, activeTenants, activeTenantLevels]);

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

    // Get events visible in current view for security rollup
    const getVisibleEvents = () => {
        if (view === "day") {
            // Only events on current date
            const dateStr = format(currentDate, "yyyy-MM-dd");
            return events.filter(e => e.instanceDate === dateStr);
        } else if (view === "week") {
            // Events for the current week
            const weekStart = new Date(currentDate);
            weekStart.setDate(currentDate.getDate() - currentDate.getDay());
            const startStr = format(weekStart, "yyyy-MM-dd");
            const endDate = new Date(weekStart);
            endDate.setDate(weekStart.getDate() + 6);
            const endStr = format(endDate, "yyyy-MM-dd");
            return events.filter(e => e.instanceDate >= startStr && e.instanceDate <= endStr);
        }
        // Month view - return all events (already filtered by fetch)
        return events;
    };

    const visibleEvents = getVisibleEvents();

    // Get month display name
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className="h-full flex flex-col">
            {/* Main calendar area - shrinks when edit panel is open */}
            <div className={`flex flex-col overflow-hidden transition-all duration-300 ${showEventModal ? "flex-1 min-h-0" : "flex-1"}`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6 shrink-0">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold min-w-48">
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
                                onClick={() => handleViewChange("month")}
                            >
                                Month
                            </Button>
                            <Button
                                variant={view === "week" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => handleViewChange("week")}
                                data-testid="week-view-toggle"
                            >
                                Week
                            </Button>
                            <Button
                                variant={view === "day" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => handleViewChange("day")}
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

                {/* Calendar Grid with Security Header/Footer */}
                <SecurePanelWrapper
                    level={getMaxSensitivity(visibleEvents)}
                    tenants={getAllTenants(visibleEvents)}
                    tenantLevels={getAllTenantLevels(visibleEvents)}
                    className="flex-1 flex flex-col border rounded-lg overflow-hidden"
                >
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
                            onNavigateToDay={(date) => {
                                setCurrentDate(date);
                                setView("day");
                            }}
                            onNavigateToWeek={(date) => {
                                setCurrentDate(date);
                                setView("week");
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
                            onNavigateToDay={(date) => {
                                setCurrentDate(date);
                                setView("day");
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
                </SecurePanelWrapper>
            </div>

            {/* Event Edit Panel - slides up from bottom */}
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
    onNavigateToDay,
    onNavigateToWeek,
}: {
    currentDate: Date;
    events: CalendarEvent[];
    workWeekOnly: boolean;
    onEventClick: (event: CalendarEvent) => void;
    onNavigateToDay: (date: Date) => void;
    onNavigateToWeek: (date: Date) => void;
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
        <div className="flex-1 flex flex-col overflow-auto" data-testid="month-grid">
            {/* Day headers */}
            <div className={`grid border-b shrink-0`} style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}>
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

            {/* Calendar grid - fills remaining space */}
            <div
                className="grid flex-1"
                style={{
                    gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${Math.ceil(days.length / gridCols)}, 1fr)`,
                }}
            >
                {days.map(({ date, isCurrentMonth }, index) => {
                    const dayEvents = getEventsForDate(date);
                    const isTodayCell = isToday(date);

                    return (
                        <div
                            key={index}
                            className={`border-b border-r p-1 flex flex-col ${!isCurrentMonth ? "bg-muted/50" : ""
                                } ${isTodayCell ? "ring-2 ring-primary ring-inset bg-primary/5" : ""}`}
                            data-testid={isTodayCell ? "today" : undefined}
                        >
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        className={`text-sm mb-1 shrink-0 cursor-pointer hover:bg-primary/10 rounded transition-colors w-7 h-7 flex items-center justify-center ${isTodayCell
                                            ? "bg-primary text-primary-foreground hover:bg-primary/80"
                                            : ""
                                            } ${!isCurrentMonth ? "text-muted-foreground" : ""}`}
                                    >
                                        {date.getDate()}
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-32">
                                    <DropdownMenuItem onClick={() => onNavigateToDay(date)}>
                                        View Day
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onNavigateToWeek(date)}>
                                        View Week
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <div className="space-y-1 flex-1 overflow-auto">
                                {dayEvents.slice(0, 3).map((event) => (
                                    <EventPill
                                        key={`${event.id}-${event.instanceDate}`}
                                        event={event}
                                        onClick={() => onEventClick(event)}
                                    />
                                ))}
                                {dayEvents.length > 3 && (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="text-xs text-muted-foreground hover:underline cursor-pointer">
                                                +{dayEvents.length - 3} more
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent side="right" className="w-64 p-2">
                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                                    {dayEvents.length - 3} more events
                                                </p>
                                                {dayEvents.slice(3).map((event) => (
                                                    <EventPill
                                                        key={`${event.id}-${event.instanceDate}`}
                                                        event={event}
                                                        onClick={() => onEventClick(event)}
                                                    />
                                                ))}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
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
    onNavigateToDay,
}: {
    currentDate: Date;
    events: CalendarEvent[];
    workWeekOnly: boolean;
    onEventClick: (event: CalendarEvent) => void;
    onNavigateToDay: (date: Date) => void;
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

    // Time slots and hours
    const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => i + START_HOUR);

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
        <div className="flex-1 flex flex-col overflow-hidden" data-testid="week-view">
            {/* Day headers */}
            <div className="grid sticky top-0 bg-background z-10 shrink-0" style={{ gridTemplateColumns: `60px repeat(${days.length}, 1fr)` }}>
                <div className="p-2 border-b" /> {/* Empty corner */}
                {days.map((day) => {
                    const todayStr = format(new Date(), "yyyy-MM-dd");
                    const dayStr = format(day, "yyyy-MM-dd");
                    const isToday = dayStr === todayStr;

                    return (
                        <div
                            key={day.toISOString()}
                            className={`p-2 text-center border-b border-l ${isToday ? "bg-primary/5" : ""}`}
                        >
                            <div className="text-sm text-muted-foreground">
                                {dayNames[day.getDay()]}
                            </div>
                            <button
                                onClick={() => onNavigateToDay(day)}
                                className={`text-lg font-semibold cursor-pointer hover:bg-primary/10 rounded-full transition-colors ${isToday ? "bg-primary text-primary-foreground w-8 h-8 flex items-center justify-center mx-auto hover:bg-primary/80" : "w-8 h-8 flex items-center justify-center mx-auto"}`}
                            >
                                {day.getDate()}
                            </button>
                        </div>
                    );
                })}
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

            {/* Time grid with events - uses CSS Grid for responsive height */}
            <div
                className="grid flex-1"
                style={{ gridTemplateColumns: `60px repeat(${days.length}, 1fr)` }}
            >
                {/* Time labels column */}
                <div
                    className="grid"
                    style={{ gridTemplateRows: `repeat(${TOTAL_SLOTS}, 1fr)` }}
                >
                    {hours.map((hour, idx) => (
                        <div
                            key={hour}
                            className="text-xs text-muted-foreground pr-2 text-right flex items-start pt-1"
                            style={{ gridRow: `${idx * SLOTS_PER_HOUR + 1} / span ${SLOTS_PER_HOUR}` }}
                        >
                            {hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                        </div>
                    ))}
                </div>

                {/* Day columns */}
                {days.map((day) => {
                    const positionedEvents = getPositionedEventsForDate(day);
                    const todayStr = format(new Date(), "yyyy-MM-dd");
                    const dayStr = format(day, "yyyy-MM-dd");
                    const isToday = dayStr === todayStr;

                    return (
                        <div
                            key={day.toISOString()}
                            className={`grid border-l relative ${isToday ? "bg-primary/5 ring-1 ring-primary/30 ring-inset" : ""}`}
                            style={{ gridTemplateRows: `repeat(${TOTAL_SLOTS}, 1fr)` }}
                        >
                            {/* Hour gridlines - only on hour boundaries */}
                            {hours.map((hour, idx) => (
                                <div
                                    key={hour}
                                    className="border-b border-border/50"
                                    style={{ gridRow: `${idx * SLOTS_PER_HOUR + 1} / span ${SLOTS_PER_HOUR}` }}
                                />
                            ))}

                            {/* Positioned events */}
                            {positionedEvents.map(({ event, startSlot, endSlot, lane, totalLanes }) => {
                                const width = `calc(${100 / totalLanes}% - 2px)`;
                                const left = `calc(${(lane / totalLanes) * 100}% + 1px)`;

                                return (
                                    <GridPositionedEventPill
                                        key={`${event.id}-${event.instanceDate}`}
                                        event={event}
                                        startSlot={startSlot}
                                        endSlot={endSlot}
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
    const totalMinutes = (hour - START_HOUR) * 60 + minute;
    const slot = Math.floor(totalMinutes / 10) + 1; // 10-minute slots, 1-indexed

    // Don't render if outside visible range
    if (hour < START_HOUR || hour >= END_HOUR) {
        return null;
    }

    // Use percentage-based positioning within the slot
    const minuteInSlot = minute % 10;
    const slotPercentage = (minuteInSlot / 10) * 100;

    return (
        <div
            className="absolute left-0 right-0 z-20 pointer-events-none"
            style={{
                gridRow: `${slot} / span 1`,
                top: `${slotPercentage}%`
            }}
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
// Grid Current Time Indicator Component (CSS Grid positioning)
// ============================================================================

function GridCurrentTimeIndicator() {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        // Update every minute
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    // Calculate slot based on current hour/minute
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();
    const totalMinutes = (hour - START_HOUR) * 60 + minute;
    const slot = Math.floor(totalMinutes / 10) + 1; // 10-minute slots, 1-indexed

    // Don't render if outside visible range
    if (hour < START_HOUR || hour >= END_HOUR) {
        return null;
    }

    // Calculate percentage within the slot for fine positioning
    const minuteInSlot = minute % 10;
    const slotPercentage = (minuteInSlot / 10) * 100;

    return (
        <div
            className="absolute left-0 right-0 z-20 pointer-events-none"
            style={{
                gridRow: `${slot} / span 1`,
                top: `${slotPercentage}%`
            }}
            data-testid="grid-current-time-indicator"
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
    // Time slots and hours
    const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => i + START_HOUR);

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
        <div className="flex-1 flex flex-col overflow-hidden" data-testid="day-view">
            {/* Day header */}
            <div className="grid sticky top-0 bg-background z-10 shrink-0" style={{ gridTemplateColumns: "60px 1fr" }}>
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

            {/* Time grid with events - uses CSS Grid for responsive height */}
            <div
                className="grid flex-1"
                style={{ gridTemplateColumns: "60px 1fr" }}
            >
                {/* Time labels column */}
                <div
                    className="grid"
                    style={{ gridTemplateRows: `repeat(${TOTAL_SLOTS}, 1fr)` }}
                >
                    {hours.map((hour, idx) => (
                        <div
                            key={hour}
                            className="text-xs text-muted-foreground pr-2 text-right flex items-start pt-1"
                            style={{ gridRow: `${idx * SLOTS_PER_HOUR + 1} / span ${SLOTS_PER_HOUR}` }}
                        >
                            {hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                        </div>
                    ))}
                </div>

                {/* Day column */}
                <div
                    className={`grid border-l relative ${isToday ? "bg-primary/5" : ""}`}
                    style={{ gridTemplateRows: `repeat(${TOTAL_SLOTS}, 1fr)` }}
                >
                    {/* Hour gridlines - only on hour boundaries */}
                    {hours.map((hour, idx) => (
                        <div
                            key={hour}
                            className="border-b border-border/50"
                            style={{ gridRow: `${idx * SLOTS_PER_HOUR + 1} / span ${SLOTS_PER_HOUR}` }}
                        />
                    ))}

                    {/* Positioned events */}
                    {positionedEvents.map(({ event, startSlot, endSlot, lane, totalLanes }) => {
                        const width = `calc(${100 / totalLanes}% - 2px)`;
                        const left = `calc(${(lane / totalLanes) * 100}% + 1px)`;

                        return (
                            <GridPositionedEventPill
                                key={`${event.id}-${event.instanceDate}`}
                                event={event}
                                startSlot={startSlot}
                                endSlot={endSlot}
                                width={width}
                                left={left}
                                onClick={() => onEventClick(event)}
                            />
                        );
                    })}

                    {/* Current time indicator - only show for today */}
                    {isToday && <GridCurrentTimeIndicator />}
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
    const aco = parseAco(event.aco);
    const textRef = useRef<HTMLSpanElement>(null);
    const [isTruncated, setIsTruncated] = useState(false);

    // Check if text is truncated on mount and resize
    useEffect(() => {
        const checkTruncation = () => {
            if (textRef.current) {
                setIsTruncated(textRef.current.scrollHeight > textRef.current.clientHeight);
            }
        };
        checkTruncation();
        window.addEventListener('resize', checkTruncation);
        return () => window.removeEventListener('resize', checkTruncation);
    }, [event.title]);

    const button = (
        <button
            className="event-pill w-full text-left text-xs p-1 rounded cursor-pointer hover:opacity-80 flex items-center gap-1.5 min-w-0"
            style={{ backgroundColor: typeInfo.color, color: typeInfo.textColor || "white" }}
            onClick={onClick}
            data-testid="event-pill"
        >
            <SecurityBadge
                aco={{ sensitivity: aco.sensitivity, tenants: aco.tenants }}
                size="sm"
                className="shrink-0"
            />
            <span ref={textRef} className="line-clamp-2 break-words min-w-0">{event.title}</span>
        </button>
    );

    if (!isTruncated) {
        return button;
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                    <p className="font-medium">{event.title}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
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
    const aco = parseAco(event.aco);

    // Format time display
    const startTime = new Date(event.startTime);
    const timeStr = `${startTime.getHours() % 12 || 12}:${startTime.getMinutes().toString().padStart(2, "0")} ${startTime.getHours() >= 12 ? "PM" : "AM"}`;

    // For taller events, use vertical layout like month view
    const isCompact = height < 48;

    const pill = (
        <button
            className="absolute rounded text-xs p-1 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity flex flex-col"
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
            <div className={`flex items-center gap-1 ${isCompact ? "" : "mb-0.5"}`}>
                <SecurityBadge
                    aco={{ sensitivity: aco.sensitivity, tenants: aco.tenants }}
                    size="sm"
                    className="shrink-0"
                />
                <span className={isCompact ? "truncate" : "line-clamp-2 break-words"}>{event.title}</span>
            </div>
            {!isCompact && <div className="text-xs opacity-80">{timeStr}</div>}
        </button>
    );

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>{pill}</TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                    <p className="font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{timeStr}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

// ============================================================================
// Grid Positioned Event Pill Component (for Day/Week view - CSS Grid positioning)
// ============================================================================

function GridPositionedEventPill({
    event,
    startSlot,
    endSlot,
    width,
    left,
    onClick,
}: {
    event: CalendarEvent;
    startSlot: number;
    endSlot: number;
    width: string;
    left: string;
    onClick: () => void;
}) {
    const typeInfo = eventTypeInfo[event.eventType] || eventTypeInfo.meeting;
    const aco = parseAco(event.aco);

    // Format time display
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);
    const formatTime = (d: Date) =>
        `${d.getHours() % 12 || 12}:${d.getMinutes().toString().padStart(2, "0")} ${d.getHours() >= 12 ? "PM" : "AM"}`;

    // For taller events (more slots), show more content
    const slots = endSlot - startSlot;
    const isCompact = slots < 3; // Less than 30 minutes
    const showTimeRange = slots >= 3; // 30 minutes or more
    const showLocation = slots >= 5 && event.location; // 50 minutes or more

    const timeDisplay = showTimeRange
        ? `${formatTime(startTime)} - ${formatTime(endTime)}`
        : formatTime(startTime);

    const pill = (
        <button
            className="absolute rounded text-xs p-1.5 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-2"
            style={{
                backgroundColor: typeInfo.color,
                color: typeInfo.textColor || "white",
                gridRow: `${startSlot} / ${endSlot}`,
                width,
                maxWidth: 400,
                left,
                top: 1,
                bottom: 1,
            }}
            onClick={onClick}
            data-testid="grid-positioned-event-pill"
        >
            {/* Badge column */}
            <SecurityBadge
                aco={{ sensitivity: aco.sensitivity, tenants: aco.tenants }}
                size="sm"
                className="shrink-0"
            />
            {/* Details column - centered vertically */}
            <div className="flex flex-col justify-center items-center flex-1 min-w-0 text-center">
                <span className={isCompact ? "truncate w-full" : "line-clamp-2 break-words"}>{event.title}</span>
                {!isCompact && <div className="text-xs opacity-80">{timeDisplay}</div>}
                {showLocation && <div className="text-xs opacity-70 truncate w-full">{event.location}</div>}
            </div>
        </button>
    );

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>{pill}</TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                    <p className="font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{timeDisplay}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
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
    const aco = parseAco(event.aco);

    const pill = (
        <button
            className="w-full text-left text-xs p-1 rounded cursor-pointer hover:opacity-80 mb-1 flex items-center gap-1"
            style={{ backgroundColor: typeInfo.color, color: typeInfo.textColor || "white" }}
            onClick={onClick}
            data-testid="all-day-event-pill"
        >
            <SecurityBadge
                aco={{ sensitivity: aco.sensitivity, tenants: aco.tenants }}
                size="sm"
                className="shrink-0"
            />
            <span className="truncate">{event.title}</span>
        </button>
    );

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>{pill}</TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                    <p className="font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">All day event</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

// ============================================================================
// Role Column Component for Personnel Tab
// ============================================================================

interface RoleColumnProps {
    role: "organizer" | "required" | "optional";
    label: string;
    description: string;
    color: "purple" | "blue" | "gray";
    items: ParticipantItem[];
    allPersonnel: Array<{ id: string; name: string; title?: string | null }>;
    allTeams: Array<{ id: string; name: string; memberCount?: number }>;
    selectedPersonnel: ParticipantItem[];
    onAdd: (item: Omit<ParticipantItem, "role">) => void;
    onRemove: (id: string) => void;
}

function RoleColumn({
    role,
    label,
    description,
    color,
    items,
    allPersonnel,
    allTeams,
    selectedPersonnel,
    onAdd,
    onRemove,
}: RoleColumnProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    // Color configurations
    const colorConfig = {
        purple: {
            header: "text-purple-700 dark:text-purple-400",
            bg: "bg-purple-50 dark:bg-purple-900/20",
            border: "border-purple-200 dark:border-purple-800",
            badge: "bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200",
            addBtn: "hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-400",
        },
        blue: {
            header: "text-blue-700 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-900/20",
            border: "border-blue-200 dark:border-blue-800",
            badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200",
            addBtn: "hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400",
        },
        gray: {
            header: "text-gray-600 dark:text-gray-400",
            bg: "bg-gray-50 dark:bg-gray-800/50",
            border: "border-gray-200 dark:border-gray-700",
            badge: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
            addBtn: "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400",
        },
    };
    const cfg = colorConfig[color];

    // Filter out already selected personnel/teams
    const selectedIds = new Set(selectedPersonnel.map(p => p.id));
    const filteredPersonnel = allPersonnel.filter(p => {
        if (selectedIds.has(p.id)) return false;
        if (!search) return true;
        const s = search.toLowerCase();
        return p.name.toLowerCase().includes(s) || (p.title?.toLowerCase().includes(s) ?? false);
    });
    const filteredTeams = allTeams.filter(t => {
        if (selectedIds.has(t.id)) return false;
        if (!search) return true;
        return t.name.toLowerCase().includes(search.toLowerCase());
    });

    const handleSelect = (type: "personnel" | "team", item: { id: string; name: string }) => {
        onAdd({ type, id: item.id, name: item.name });
        setSearch("");
        setOpen(false);
    };

    return (
        <div className={`rounded-lg border ${cfg.border} ${cfg.bg} min-h-[200px] flex flex-col`}>
            {/* Column Header */}
            <div className="p-3 border-b border-inherit">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className={`text-sm font-semibold ${cfg.header}`}>{label}</h4>
                        <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                    <span className={`text-xs font-medium ${cfg.header}`}>{items.length}</span>
                </div>
            </div>

            {/* Column Content */}
            <div className="flex-1 p-3 space-y-2">
                {/* Add Button with Popover */}
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`w-full justify-start gap-2 h-8 ${cfg.addBtn}`}
                        >
                            <Plus className="h-4 w-4" />
                            <span className="text-sm">Add...</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[280px] p-0" align="start">
                        <Command shouldFilter={false}>
                            <CommandInput
                                placeholder="Search people or teams..."
                                value={search}
                                onValueChange={setSearch}
                            />
                            <CommandList>
                                <CommandEmpty>No results found.</CommandEmpty>
                                {filteredTeams.length > 0 && (
                                    <CommandGroup heading="Teams">
                                        {filteredTeams.slice(0, 5).map(team => (
                                            <CommandItem
                                                key={team.id}
                                                onSelect={() => handleSelect("team", team)}
                                            >
                                                <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                                                <span>{team.name}</span>
                                                {team.memberCount && (
                                                    <span className="ml-auto text-xs text-muted-foreground">
                                                        {team.memberCount} members
                                                    </span>
                                                )}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}
                                {filteredPersonnel.length > 0 && (
                                    <CommandGroup heading="People">
                                        {filteredPersonnel.slice(0, 8).map(person => (
                                            <CommandItem
                                                key={person.id}
                                                onSelect={() => handleSelect("personnel", person)}
                                            >
                                                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                                                <div className="flex flex-col">
                                                    <span>{person.name}</span>
                                                    {person.title && (
                                                        <span className="text-xs text-muted-foreground">{person.title}</span>
                                                    )}
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                {/* Person/Team List */}
                {items.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-4">
                        No {label.toLowerCase()} yet
                    </p>
                ) : (
                    <div className="space-y-1">
                        {items.map(item => (
                            <div
                                key={item.id}
                                className={`flex items-center justify-between px-2 py-1.5 rounded ${cfg.badge}`}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    {item.type === "team" ? (
                                        <Users className="h-3.5 w-3.5 shrink-0" />
                                    ) : (
                                        <User className="h-3.5 w-3.5 shrink-0" />
                                    )}
                                    <span className="text-sm truncate">{item.name}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onRemove(item.id)}
                                    className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded shrink-0"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
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
    // Get current persona for default organizer
    const { currentPersona } = usePersona();

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

    // Tab and ACO state for Create Event
    const [activeTab, setActiveTab] = useState<"basic" | "series" | "description" | "participants">("basic");
    const [basicInfoAco, setBasicInfoAco] = useState<{ sensitivity: SensitivityLevel | null; tenants?: string[] }>({ sensitivity: null });
    const [descriptionAco, setDescriptionAco] = useState<{ sensitivity: SensitivityLevel | null; tenants?: string[] }>({ sensitivity: null });

    // Personnel state
    const [personnelList, setPersonnelList] = useState<Array<{ id: string; name: string; title?: string | null }>>([]);
    const [teamsList, setTeamsList] = useState<Array<{ id: string; name: string; memberCount?: number }>>([]);
    const [selectedPersonnel, setSelectedPersonnel] = useState<ParticipantItem[]>([]);
    const [personnelLoading, setPersonnelLoading] = useState(false);
    const [addingRole, setAddingRole] = useState<"organizer" | "required" | "optional">("required");
    const [personnelAco, setPersonnelAco] = useState<{ sensitivity: SensitivityLevel | null; tenants?: string[] }>({ sensitivity: null });

    // Check if we're editing just one instance of a recurring event
    const isEditingInstanceOnly = (editingEvent as CalendarEvent & { _editingInstanceOnly?: boolean })?._editingInstanceOnly === true;

    // Get browser timezone for comparison
    const browserTimezone = getBrowserTimezone();

    // Reset/populate form when modal opens
    useEffect(() => {
        if (open) {
            // Always start on Basic Information tab
            setActiveTab("basic");

            if (editingEvent) {
                // Pre-fill form with existing event data
                setTitle(editingEvent.title);
                setDescription(editingEvent.description || "");
                // For recurring events, use instanceDate ONLY when editing a single instance
                // When editing the entire series, use the original startTime
                const isEditingInstance = (editingEvent as CalendarEvent & { _editingInstanceOnly?: boolean })?._editingInstanceOnly === true;
                if (isEditingInstance && editingEvent.instanceDate) {
                    // Use the instance date that was clicked on
                    setSelectedDate(new Date(editingEvent.instanceDate + "T00:00:00"));
                } else {
                    // Use the original series start date
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
                // Set ACO state from existing event
                const parsedAco = parseAco(editingEvent.aco);
                setBasicInfoAco({ sensitivity: parsedAco.sensitivity, tenants: parsedAco.tenants.length > 0 ? parsedAco.tenants : undefined });
                const parsedDescAco = parseAco(editingEvent.descriptionAco || editingEvent.aco);
                setDescriptionAco({ sensitivity: parsedDescAco.sensitivity, tenants: parsedDescAco.tenants.length > 0 ? parsedDescAco.tenants : undefined });
                // Reset selected personnel - will be loaded separately
                setSelectedPersonnel([]);
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
                // Reset ACO to null for new events
                setBasicInfoAco({ sensitivity: null });
                setDescriptionAco({ sensitivity: null });
                // Set current user as default organizer and required
                if (currentPersona) {
                    setSelectedPersonnel([
                        { type: "personnel", id: currentPersona.id, name: currentPersona.name, role: "organizer" },
                        { type: "personnel", id: currentPersona.id, name: currentPersona.name, role: "required" },
                    ]);
                } else {
                    setSelectedPersonnel([]);
                }
            }
        }
    }, [open, editingEvent]);

    // Load personnel and teams lists when modal opens
    useEffect(() => {
        if (!open) return;

        async function loadData() {
            setPersonnelLoading(true);
            try {
                // Load personnel list via server action (max pageSize is 100)
                const personnelResult = await getPersonnelPage({ page: 1, pageSize: 100 });
                if (personnelResult.data) {
                    setPersonnelList(personnelResult.data.map((p) => ({
                        id: p.id,
                        name: p.name,
                        title: p.title
                    })));
                }

                // Load teams list via server action
                const teamsResult = await getTeams();
                if (teamsResult.success && teamsResult.data) {
                    setTeamsList(teamsResult.data.map((t) => ({
                        id: t.id,
                        name: t.name,
                        memberCount: t.memberCount
                    })));
                }

                // Load existing participants if editing
                if (editingEvent?.id) {
                    const participantsResult = await getEventParticipantsRaw(editingEvent.id);
                    if (participantsResult.success && participantsResult.data) {
                        setSelectedPersonnel(participantsResult.data.map((p) => ({
                            type: p.teamId ? "team" as const : "personnel" as const,
                            id: (p.personnelId || p.teamId) as string,
                            name: p.personnelName || p.teamName || "Unknown",
                            role: p.role as ParticipantItem["role"],
                        })));
                    }
                }
            } catch (error) {
                console.error("Failed to load personnel data:", error);
            } finally {
                setPersonnelLoading(false);
            }
        }

        loadData();
    }, [open, editingEvent?.id]);

    const handleSave = async () => {
        if (!title || !selectedDate) return;

        const dateStr = format(selectedDate, "yyyy-MM-dd");
        setSaving(true);

        // Format ACO for saving - JSON format matching database schema
        const formatAcoForSave = (aco: { sensitivity: SensitivityLevel | null; tenants?: string[] }): string | undefined => {
            if (!aco.sensitivity) return undefined;
            return JSON.stringify({
                sensitivity: aco.sensitivity,
                tenants: aco.tenants || [],
            });
        };

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
                aco: formatAcoForSave(basicInfoAco),
                descriptionAco: formatAcoForSave(descriptionAco),
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

    if (!open) return null;

    return (
        <div className="flex-1 border-t bg-background overflow-hidden flex flex-col">
            <div className="p-4 overflow-y-auto flex-1">
                {/* Header with Title and Tabs */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-semibold">
                            {editingEvent ? (isEditingInstanceOnly ? "Edit This Instance" : "Edit Event") : "Create Event"}
                        </h2>
                        {/* Tab Headers */}
                        <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
                            <button
                                onClick={() => setActiveTab("basic")}
                                className={`px-3 py-1 text-sm rounded transition-colors ${activeTab === "basic" ? "bg-background shadow-sm" : "hover:bg-background/50"
                                    }`}
                            >
                                Basic Information
                            </button>
                            <button
                                onClick={() => setActiveTab("series")}
                                className={`px-3 py-1 text-sm rounded transition-colors ${activeTab === "series" ? "bg-background shadow-sm" : "hover:bg-background/50"
                                    }`}
                            >
                                Series
                            </button>
                            <button
                                onClick={() => setActiveTab("description")}
                                className={`px-3 py-1 text-sm rounded transition-colors ${activeTab === "description" ? "bg-background shadow-sm" : "hover:bg-background/50"
                                    }`}
                            >
                                Description
                            </button>
                            <button
                                onClick={() => setActiveTab("participants")}
                                className={`px-3 py-1 text-sm rounded transition-colors ${activeTab === "participants" ? "bg-background shadow-sm" : "hover:bg-background/50"
                                    }`}
                            >
                                Personnel
                            </button>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Tab Content */}

                {/* Basic Information Tab */}
                {activeTab === "basic" && (
                    <SecurePanelWrapper
                        level={basicInfoAco.sensitivity}
                        tenants={basicInfoAco.tenants || []}
                        className="border rounded-lg overflow-hidden"
                    >
                        <div className="p-4 space-y-4">
                            {/* Classification Picker */}
                            <div className="flex items-center justify-between pb-3 border-b">
                                <Label>Classification</Label>
                                <SecurityLabelPicker
                                    value={{ sensitivity: basicInfoAco.sensitivity || "low", tenants: basicInfoAco.tenants }}
                                    onChange={(aco) => setBasicInfoAco({ sensitivity: aco.sensitivity, tenants: aco.tenants })}
                                />
                            </div>

                            <div>
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Event title"
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

                            {/* Local time preview */}
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
                        </div>
                    </SecurePanelWrapper>
                )}

                {/* Series Tab */}
                {activeTab === "series" && (
                    <SecurePanelWrapper
                        level={basicInfoAco.sensitivity}
                        tenants={basicInfoAco.tenants || []}
                        className="border rounded-lg overflow-hidden"
                    >
                        <div className="p-4 space-y-4">
                            {isEditingInstanceOnly ? (
                                <p className="text-muted-foreground text-sm">
                                    Series settings are not available when editing a single instance.
                                </p>
                            ) : (
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
                        </div>
                    </SecurePanelWrapper>
                )}

                {/* Description Tab */}
                {activeTab === "description" && (
                    <SecurePanelWrapper
                        level={editingEvent?._descriptionRedacted ? null : descriptionAco.sensitivity}
                        tenants={editingEvent?._descriptionRedacted ? [] : (descriptionAco.tenants || [])}
                        className="border rounded-lg overflow-hidden"
                    >
                        <div className="p-4 space-y-4">
                            {editingEvent?._descriptionRedacted ? (
                                // REDACTED: Cannot edit
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <span className="inline-flex items-center rounded-md bg-red-50 dark:bg-red-950/30 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-400 ring-1 ring-inset ring-red-600/20 dark:ring-red-500/30 mb-3">
                                        🔒 REDACTED
                                    </span>
                                    <p className="text-muted-foreground text-sm">
                                        Description is classified above your current access level.
                                    </p>
                                    <p className="text-muted-foreground text-xs mt-1">
                                        Editing is not permitted.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Classification Picker */}
                                    <div className="flex items-center justify-between pb-3 border-b">
                                        <Label>Classification</Label>
                                        <div className="flex items-center gap-2">
                                            {/* Mismatch warning - check sensitivity AND tenants */}
                                            {(() => {
                                                const baseSens = basicInfoAco.sensitivity;
                                                const descSens = descriptionAco.sensitivity;
                                                const baseTenants = (basicInfoAco.tenants || []).sort().join(",");
                                                const descTenants = (descriptionAco.tenants || []).sort().join(",");
                                                const sensMismatch = baseSens && descSens && descSens !== baseSens;
                                                const tenantMismatch = baseTenants !== descTenants;

                                                if (!sensMismatch && !tenantMismatch) return null;

                                                return (
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top" showArrow={false} className="max-w-xs bg-popover text-popover-foreground border shadow-md">
                                                            <p className="font-medium text-foreground">Classification Mismatch</p>
                                                            <div className="text-xs text-muted-foreground mt-1 space-y-1">
                                                                {sensMismatch && (
                                                                    <p>Sensitivity: <span className="font-medium text-foreground">{descSens?.toUpperCase()}</span> vs base <span className="font-medium text-foreground">{baseSens?.toUpperCase()}</span></p>
                                                                )}
                                                                {tenantMismatch && (
                                                                    <p>Tenants differ from base event</p>
                                                                )}
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                );
                                            })()}
                                            <SecurityLabelPicker
                                                value={{ sensitivity: descriptionAco.sensitivity || "low", tenants: descriptionAco.tenants }}
                                                onChange={(aco) => setDescriptionAco({ sensitivity: aco.sensitivity, tenants: aco.tenants })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Event description"
                                            rows={6}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </SecurePanelWrapper>
                )}

                {/* Personnel Tab - Three Column Layout */}
                {activeTab === "participants" && (() => {
                    const rawTenants = personnelAco.tenants || basicInfoAco.tenants || [];
                    const level = personnelAco.sensitivity || basicInfoAco.sensitivity;
                    const { tenantNames, tenantLevels } = parseTenants(rawTenants, level || "low");
                    return (
                        <SecurePanelWrapper
                            level={level}
                            tenants={tenantNames}
                            tenantLevels={tenantLevels}
                            className="border rounded-lg overflow-hidden"
                        >
                            <div className="p-4 space-y-4">
                                {/* Classification Picker */}
                                <div className="flex items-center justify-between pb-3 border-b">
                                    <Label className="text-sm font-medium">Personnel List Classification</Label>
                                    <div className="flex items-center gap-2">
                                        {/* Mismatch warning - check sensitivity AND tenants */}
                                        {(() => {
                                            const baseSens = basicInfoAco.sensitivity;
                                            const persSens = personnelAco.sensitivity;
                                            const baseTenants = (basicInfoAco.tenants || []).sort().join(",");
                                            const persTenants = (personnelAco.tenants || []).sort().join(",");
                                            const sensMismatch = baseSens && persSens && persSens !== baseSens;
                                            const tenantMismatch = persTenants !== "" && baseTenants !== persTenants;

                                            if (!sensMismatch && !tenantMismatch) return null;

                                            return (
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" showArrow={false} className="max-w-xs bg-popover text-popover-foreground border shadow-md">
                                                        <p className="font-medium text-foreground">Classification Mismatch</p>
                                                        <div className="text-xs text-muted-foreground mt-1 space-y-1">
                                                            {sensMismatch && (
                                                                <p>Sensitivity: <span className="font-medium text-foreground">{persSens?.toUpperCase()}</span> vs base <span className="font-medium text-foreground">{baseSens?.toUpperCase()}</span></p>
                                                            )}
                                                            {tenantMismatch && (
                                                                <p>Tenants differ from base event</p>
                                                            )}
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            );
                                        })()}
                                        <SecurityLabelPicker
                                            value={{
                                                sensitivity: personnelAco.sensitivity || basicInfoAco.sensitivity || "low",
                                                tenants: personnelAco.tenants || basicInfoAco.tenants
                                            }}
                                            onChange={(aco) => setPersonnelAco({ sensitivity: aco.sensitivity, tenants: aco.tenants })}
                                        />
                                    </div>
                                </div>

                                {/* Three Column Layout */}
                                {personnelLoading ? (
                                    <p className="text-sm text-muted-foreground py-4">Loading personnel...</p>
                                ) : (
                                    <div className="grid grid-cols-3 gap-4">
                                        {/* Organizers Column */}
                                        <RoleColumn
                                            role="organizer"
                                            label="Organizers"
                                            description="Who can edit this event"
                                            color="purple"
                                            items={selectedPersonnel.filter(p => p.role === "organizer")}
                                            allPersonnel={personnelList}
                                            allTeams={teamsList}
                                            selectedPersonnel={selectedPersonnel}
                                            onAdd={(item) => setSelectedPersonnel(prev => [...prev, { ...item, role: "organizer" }])}
                                            onRemove={(id) => setSelectedPersonnel(prev => prev.filter(p => p.id !== id))}
                                        />

                                        {/* Required Column */}
                                        <RoleColumn
                                            role="required"
                                            label="Required"
                                            description="Must attend"
                                            color="blue"
                                            items={selectedPersonnel.filter(p => p.role === "required")}
                                            allPersonnel={personnelList}
                                            allTeams={teamsList}
                                            selectedPersonnel={selectedPersonnel}
                                            onAdd={(item) => setSelectedPersonnel(prev => [...prev, { ...item, role: "required" }])}
                                            onRemove={(id) => setSelectedPersonnel(prev => prev.filter(p => p.id !== id))}
                                        />

                                        {/* Optional Column */}
                                        <RoleColumn
                                            role="optional"
                                            label="Optional"
                                            description="Invited but not required"
                                            color="gray"
                                            items={selectedPersonnel.filter(p => p.role === "optional")}
                                            allPersonnel={personnelList}
                                            allTeams={teamsList}
                                            selectedPersonnel={selectedPersonnel}
                                            onAdd={(item) => setSelectedPersonnel(prev => [...prev, { ...item, role: "optional" }])}
                                            onRemove={(id) => setSelectedPersonnel(prev => prev.filter(p => p.id !== id))}
                                        />
                                    </div>
                                )}
                            </div>
                        </SecurePanelWrapper>
                    );
                })()}

                {/* Footer with Cancel/Save */}
                <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    {(() => {
                        const hasOrganizer = selectedPersonnel.some(p => p.role === "organizer");
                        const canSave = title && (editingEvent || basicInfoAco.sensitivity !== null) && hasOrganizer;
                        const tooltip = !title
                            ? "Title is required"
                            : !hasOrganizer
                                ? "At least one organizer is required"
                                : basicInfoAco.sensitivity === null && !editingEvent
                                    ? "New events must be classified before saving"
                                    : undefined;
                        return (
                            <Button
                                onClick={handleSave}
                                disabled={saving || !canSave}
                                title={tooltip}
                            >
                                {saving ? "Saving..." : "Save"}
                            </Button>
                        );
                    })()}
                </div>
            </div>
        </div >
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
    const { sessionLevel, activeTenants } = useSecurity();

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
        <>
            {/* Backdrop overlay */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                    onClick={onClose}
                />
            )}

            {/* Modal panel */}
            <div
                className={`fixed top-1/2 right-4 -translate-y-1/2 w-96 max-h-[90vh] bg-background border-2 border-border shadow-2xl rounded-lg transform transition-all z-50 ${open ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}`}
                data-testid="event-details-panel"
            >
                <div className="p-4 flex flex-col max-h-[90vh]">
                    {/* Top bar with close, edit, delete */}
                    <div className="flex items-center gap-2 mb-4">
                        <Button variant="outline" onClick={onEdit} className="flex-1">
                            Edit
                        </Button>
                        <Button variant="destructive" onClick={onDelete} className="flex-1">
                            Delete
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="space-y-4 overflow-y-auto">
                        {/* Event Details Panel */}
                        <SecurePanelWrapper
                            level={parseAco(event.aco).sensitivity}
                            tenants={parseAco(event.aco).tenantNames}
                            tenantLevels={parseAco(event.aco).tenantLevels}
                            className="rounded-lg border overflow-hidden"
                        >
                            <div className="p-3 space-y-3">
                                {/* Title and Type */}
                                <div className="flex items-start justify-between gap-2">
                                    <h2 className="text-xl font-bold">{event.title}</h2>
                                    <div
                                        className="px-2 py-1 rounded text-xs text-white shrink-0"
                                        style={{ backgroundColor: typeInfo.color }}
                                    >
                                        {typeInfo.label}
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-muted-foreground">Date & Time</Label>
                                    <p>
                                        {displayStartTime.toLocaleDateString()}{" "}
                                        {isAllDayEvent(event) ? (
                                            <span className="font-medium">All Day</span>
                                        ) : (
                                            <>
                                                {displayStartTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {displayEndTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </>
                                        )}
                                        {event.timezone && (
                                            <span className="text-muted-foreground"> ({getTimezoneDisplayName(event.timezone)})</span>
                                        )}
                                    </p>
                                    {/* Show local time if event timezone differs from browser timezone */}
                                    {event.timezone && event.timezone !== getBrowserTimezone() && (() => {
                                        const browserTz = getBrowserTimezone();
                                        const startHour = new Date(event.startTime).getHours();
                                        const startMin = new Date(event.startTime).getMinutes();
                                        const endHour = new Date(event.endTime).getHours();
                                        const endMin = new Date(event.endTime).getMinutes();
                                        const localStart = convertTime(startHour, startMin, event.timezone, browserTz);
                                        const localEnd = convertTime(endHour, endMin, event.timezone, browserTz);
                                        return (
                                            <div className="mt-2 rounded-md bg-muted/50 p-2 text-sm">
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

                                {event.isRecurring && (
                                    <div>
                                        <Label className="text-muted-foreground">Recurrence</Label>
                                        <p className="text-sm">{event.recurrence}</p>
                                    </div>
                                )}
                            </div>
                        </SecurePanelWrapper>

                        {/* Description Panel (separate ACO) - uses server-side redaction */}
                        {(event.description || event._descriptionRedacted) && (
                            <SecurePanelWrapper
                                level={event._descriptionRedacted ? null : parseAco(event.descriptionAco || event.aco).sensitivity}
                                tenants={event._descriptionRedacted ? [] : parseAco(event.descriptionAco || event.aco).tenantNames}
                                tenantLevels={event._descriptionRedacted ? {} : parseAco(event.descriptionAco || event.aco).tenantLevels}
                                className="rounded-lg border overflow-hidden"
                            >
                                <div className="p-3">
                                    <Label className="text-muted-foreground">Description</Label>
                                    {event._descriptionRedacted ? (
                                        <div className="mt-1 flex items-center gap-2">
                                            <span className="inline-flex items-center rounded-md bg-red-50 dark:bg-red-950/30 px-2 py-1 text-xs font-medium text-red-700 dark:text-red-400 ring-1 ring-inset ring-red-600/20 dark:ring-red-500/30">
                                                🔒 REDACTED
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                Insufficient clearance to view
                                            </span>
                                        </div>
                                    ) : (
                                        <p className="mt-1">{event.description}</p>
                                    )}
                                </div>
                            </SecurePanelWrapper>
                        )}

                        {/* Participants Panel */}
                        <PersonnelSection eventId={event.id} />

                        {/* Orphaned Deviations Indicator */}
                        {event.isRecurring && (
                            <OrphanedDeviationsPanel
                                eventId={event.id}
                                isRecurring={event.isRecurring}
                            />
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
                </div>
            </div>
        </>
    );
}

// Personnel Section Component
// ============================================================================

function PersonnelSection({ eventId }: { eventId: string }) {
    const [participants, setParticipants] = useState<Array<{
        id: string;
        personnelId?: string | null;
        teamId?: string | null;
        role: string;
        personnelName?: string | null;
        teamName?: string | null;
    }>>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchParticipants() {
            try {
                const res = await fetch(`/api/calendar/participants?eventId=${eventId}`);
                const data = await res.json();
                if (data.success && data.data) {
                    setParticipants(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch participants:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchParticipants();
    }, [eventId]);

    if (loading) {
        return (
            <div className="rounded-lg border p-3">
                <Label className="text-muted-foreground">Personnel</Label>
                <p className="text-sm text-muted-foreground mt-1">Loading...</p>
            </div>
        );
    }

    if (participants.length === 0) {
        return null; // Don't show section if no participants
    }

    // Group by role
    const organizers = participants.filter(p => p.role === "organizer");
    const required = participants.filter(p => p.role === "required");
    const optional = participants.filter(p => p.role === "optional");

    // Badge for a person or team
    const PersonnelBadge = ({ p, roleColor }: { p: typeof participants[0]; roleColor: string }) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roleColor}`}>
            {p.teamId ? <Users className="h-3 w-3" /> : null}
            {p.teamName || p.personnelName}
        </span>
    );

    // Role-based badge colors (dark mode compatible)
    const roleColors = {
        organizer: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 ring-1 ring-purple-200 dark:ring-purple-700",
        required: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-700",
        optional: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 ring-1 ring-gray-200 dark:ring-gray-600",
    };

    return (
        <div className="rounded-lg border p-3 space-y-3">
            <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Label className="text-muted-foreground">Personnel</Label>
            </div>

            {/* Organizers */}
            {organizers.length > 0 && (
                <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Organizers</p>
                    <div className="flex flex-wrap gap-1.5">
                        {organizers.map(p => (
                            <PersonnelBadge key={p.id} p={p} roleColor={roleColors.organizer} />
                        ))}
                    </div>
                </div>
            )}

            {/* Required */}
            {required.length > 0 && (
                <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Required</p>
                    <div className="flex flex-wrap gap-1.5">
                        {required.map(p => (
                            <PersonnelBadge key={p.id} p={p} roleColor={roleColors.required} />
                        ))}
                    </div>
                </div>
            )}

            {/* Optional */}
            {optional.length > 0 && (
                <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Optional</p>
                    <div className="flex flex-wrap gap-1.5">
                        {optional.map(p => (
                            <PersonnelBadge key={p.id} p={p} roleColor={roleColors.optional} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default CalendarPageContent;
