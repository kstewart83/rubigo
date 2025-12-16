"use client";

import { useState, useMemo } from "react";
import { useProjectData } from "@/contexts/project-data-context";
import type { Activity, Assignment, Allocation, Role, Initiative } from "@/types/project";
import type { Person } from "@/types/personnel";
import {
    EntityDetailPanel,
    FormField,
    TextInput,
    TextArea,
    SelectInput,
    DisplayField,
} from "@/components/entity-detail-panel";
import { Button } from "@/components/ui/button";

// ============================================================================
// Types
// ============================================================================

interface ActivityWithResources extends Activity {
    initiative?: Initiative;
    assignments: AssignmentWithAllocations[];
    blockedByActivities: Activity[];
}

interface AssignmentWithAllocations extends Assignment {
    role?: Role;
    allocations: AllocationWithPerson[];
    capacityGap: number; // quantity - sum(allocations)
}

interface AllocationWithPerson extends Allocation {
    personName: string;
}

// ============================================================================
// Main Component
// ============================================================================

interface ActivitiesListProps {
    personnel: Person[];
}

export function ActivitiesListWithCRUD({ personnel }: ActivitiesListProps) {
    const { data, updateActivity, createActivity, deleteActivity } = useProjectData();

    const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Activity>>({});
    const [showCreate, setShowCreate] = useState(false);
    const [filterInitiative, setFilterInitiative] = useState<string>("");
    const [filterStatus, setFilterStatus] = useState<string>("");
    const [showGapsOnly, setShowGapsOnly] = useState(false);
    const [newActivity, setNewActivity] = useState<Omit<Activity, "id">>({
        name: "",
        description: "",
        initiativeId: "",
        status: "backlog",
    });

    // Build activities with resource data
    const activitiesWithResources = useMemo((): ActivityWithResources[] => {
        return data.activities.map((activity) => {
            const initiative = data.initiatives.find((i) => i.id === activity.initiativeId);
            const assignments = data.assignments
                .filter((a) => a.activityId === activity.id)
                .map((assignment) => {
                    const role = data.roles.find((r) => r.id === assignment.roleId);
                    const allocations = data.allocations
                        .filter((alloc) => alloc.assignmentId === assignment.id)
                        .map((alloc) => {
                            const person = personnel.find((p) => p.id === alloc.personId);
                            return {
                                ...alloc,
                                personName: person?.name ?? alloc.personId,
                            };
                        });
                    const totalAllocated = allocations.reduce(
                        (sum, a) => sum + a.quantityContributed,
                        0
                    );
                    return {
                        ...assignment,
                        role,
                        allocations,
                        capacityGap: assignment.quantity - totalAllocated,
                    };
                });

            // Get blocked by activities
            const blockedByIds: string[] = activity.blockedBy ?? [];
            const blockedByActivities = data.activities.filter((a) =>
                blockedByIds.includes(a.id)
            );

            return {
                ...activity,
                initiative,
                assignments,
                blockedByActivities,
            };
        });
    }, [data.activities, data.initiatives, data.assignments, data.allocations, data.roles]);

    // Filter activities
    const filteredActivities = useMemo(() => {
        return activitiesWithResources.filter((a) => {
            if (filterInitiative && a.initiativeId !== filterInitiative) return false;
            if (filterStatus && a.status !== filterStatus) return false;
            if (showGapsOnly) {
                const hasGap = a.assignments.some((asgn) => asgn.capacityGap > 0);
                if (!hasGap) return false;
            }
            return true;
        });
    }, [activitiesWithResources, filterInitiative, filterStatus, showGapsOnly]);

    // Group by initiative
    const activitiesByInitiative = useMemo(() => {
        const grouped = new Map<string, ActivityWithResources[]>();
        for (const activity of filteredActivities) {
            const key = activity.initiativeId || "unassigned";
            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key)!.push(activity);
        }
        return grouped;
    }, [filteredActivities]);

    // Calculate totals
    const totals = useMemo(() => {
        const totalAssignments = activitiesWithResources.reduce(
            (sum, a) => sum + a.assignments.length,
            0
        );
        const totalGaps = activitiesWithResources.reduce(
            (sum, a) =>
                sum +
                a.assignments.filter((asgn) => asgn.capacityGap > 0).length,
            0
        );
        const totalCapacityNeeded = activitiesWithResources.reduce(
            (sum, a) =>
                sum + a.assignments.reduce((s, asgn) => s + asgn.quantity, 0),
            0
        );
        const totalCapacityFilled = activitiesWithResources.reduce(
            (sum, a) =>
                sum +
                a.assignments.reduce(
                    (s, asgn) =>
                        s + asgn.allocations.reduce((ss, alloc) => ss + alloc.quantityContributed, 0),
                    0
                ),
            0
        );
        return {
            totalAssignments,
            totalGaps,
            totalCapacityNeeded,
            totalCapacityFilled,
            fillPercentage: totalCapacityNeeded > 0
                ? Math.round((totalCapacityFilled / totalCapacityNeeded) * 100)
                : 100,
        };
    }, [activitiesWithResources]);

    const openActivity = (id: string) => {
        setSelectedActivity(id);
        setIsEditing(false);
        const activity = data.activities.find((a) => a.id === id);
        if (activity) setEditForm({ ...activity });
    };

    const handleSave = () => {
        if (selectedActivity) {
            updateActivity(selectedActivity, editForm);
            setIsEditing(false);
        }
    };

    const handleDelete = () => {
        if (selectedActivity) {
            deleteActivity(selectedActivity);
            setSelectedActivity(null);
        }
    };

    const handleCreate = () => {
        if (newActivity.name && newActivity.initiativeId) {
            createActivity(newActivity);
            setShowCreate(false);
            setNewActivity({ name: "", description: "", initiativeId: "", status: "backlog" });
        }
    };

    const selectedActivityData = useMemo(() => {
        return activitiesWithResources.find((a) => a.id === selectedActivity);
    }, [activitiesWithResources, selectedActivity]);

    const statusOptions = [
        { value: "", label: "All Status" },
        { value: "backlog", label: "Backlog" },
        { value: "ready", label: "Ready" },
        { value: "in_progress", label: "In Progress" },
        { value: "blocked", label: "Blocked" },
        { value: "complete", label: "Complete" },
    ];

    const initiativeOptions = [
        { value: "", label: "All Initiatives" },
        ...data.initiatives.map((i) => ({ value: i.id, label: i.name })),
    ];

    return (
        <div className="space-y-4">
            {/* Summary Bar */}
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">📊</span>
                    <div>
                        <p className="text-sm text-zinc-500">Capacity Filled</p>
                        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                            {totals.fillPercentage}%
                        </p>
                    </div>
                </div>
                <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700" />
                <div>
                    <p className="text-sm text-zinc-500">FTE Required</p>
                    <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        {totals.totalCapacityNeeded.toFixed(1)}
                    </p>
                </div>
                <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700" />
                <div>
                    <p className="text-sm text-zinc-500">FTE Allocated</p>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {totals.totalCapacityFilled.toFixed(1)}
                    </p>
                </div>
                <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700" />
                <div>
                    <p className="text-sm text-zinc-500">Capacity Gap</p>
                    <p className={`text-lg font-semibold ${totals.totalCapacityNeeded - totals.totalCapacityFilled > 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-green-600 dark:text-green-400"
                        }`}>
                        {(totals.totalCapacityNeeded - totals.totalCapacityFilled).toFixed(1)} FTE
                    </p>
                </div>
                {totals.totalGaps > 0 && (
                    <>
                        <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700" />
                        <div>
                            <p className="text-sm text-zinc-500">Understaffed Roles</p>
                            <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                                {totals.totalGaps}
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center">
                <div className="flex-1 max-w-xs">
                    <SelectInput
                        value={filterInitiative}
                        onChange={setFilterInitiative}
                        options={initiativeOptions}
                    />
                </div>
                <div className="flex-1 max-w-xs">
                    <SelectInput
                        value={filterStatus}
                        onChange={setFilterStatus}
                        options={statusOptions}
                    />
                </div>
                <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showGapsOnly}
                        onChange={(e) => setShowGapsOnly(e.target.checked)}
                        className="rounded border-zinc-300"
                    />
                    Show capacity gaps only
                </label>
                <div className="ml-auto">
                    <Button size="sm" onClick={() => setShowCreate(true)}>
                        + New Activity
                    </Button>
                </div>
            </div>

            {/* Activities grouped by Initiative */}
            <div className="space-y-4">
                {Array.from(activitiesByInitiative.entries()).map(([initiativeId, activities]) => {
                    const initiative = data.initiatives.find((i) => i.id === initiativeId);

                    return (
                        <div
                            key={initiativeId}
                            className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden"
                        >
                            {/* Initiative Header */}
                            <div className="bg-zinc-50 dark:bg-zinc-900 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">🚀</span>
                                    <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                                        {initiative?.name || "Unassigned"}
                                    </h2>
                                    <span className="text-xs text-zinc-500 ml-auto">
                                        {activities.length} activit{activities.length !== 1 ? "ies" : "y"}
                                    </span>
                                </div>
                            </div>

                            {/* Activities */}
                            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {activities.map((activity) => (
                                    <ActivityRow
                                        key={activity.id}
                                        activity={activity}
                                        onClick={() => openActivity(activity.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}

                {activitiesByInitiative.size === 0 && (
                    <div className="text-center py-12 text-zinc-500">
                        <p>No activities found matching the current filters.</p>
                    </div>
                )}
            </div>

            {/* Activity Detail Panel */}
            <EntityDetailPanel
                isOpen={selectedActivity !== null}
                onClose={() => setSelectedActivity(null)}
                title={selectedActivityData?.name ?? ""}
                isEditing={isEditing}
                onEditToggle={() => setIsEditing(!isEditing)}
                onSave={handleSave}
                onDelete={handleDelete}
            >
                {isEditing ? (
                    <>
                        <FormField label="Name">
                            <TextInput
                                value={editForm.name ?? ""}
                                onChange={(v) => setEditForm({ ...editForm, name: v })}
                            />
                        </FormField>
                        <FormField label="Description">
                            <TextArea
                                value={editForm.description ?? ""}
                                onChange={(v) => setEditForm({ ...editForm, description: v })}
                            />
                        </FormField>
                        <FormField label="Status">
                            <SelectInput
                                value={editForm.status ?? "backlog"}
                                onChange={(v) => setEditForm({ ...editForm, status: v as Activity["status"] })}
                                options={[
                                    { value: "backlog", label: "Backlog" },
                                    { value: "ready", label: "Ready" },
                                    { value: "in_progress", label: "In Progress" },
                                    { value: "blocked", label: "Blocked" },
                                    { value: "complete", label: "Complete" },
                                ]}
                            />
                        </FormField>
                    </>
                ) : (
                    selectedActivityData && (
                        <div className="space-y-4">
                            <DisplayField label="Description" value={selectedActivityData.description} />
                            <DisplayField label="Initiative" value={selectedActivityData.initiative?.name} />
                            <DisplayField label="Status" value={selectedActivityData.status?.replace("_", " ")} />

                            {/* Blocked By */}
                            {selectedActivityData.blockedByActivities.length > 0 && (
                                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                                    <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                        🚫 Blocked By
                                    </h4>
                                    <ul className="space-y-1">
                                        {selectedActivityData.blockedByActivities.map((blocker) => (
                                            <li key={blocker.id} className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                                                <StatusBadge status={blocker.status} />
                                                {blocker.name}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Assignments */}
                            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                                <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
                                    <span>👥</span> Resource Assignments
                                    <span className="text-xs font-normal text-zinc-500">
                                        {selectedActivityData.assignments.length} role{selectedActivityData.assignments.length !== 1 ? "s" : ""}
                                    </span>
                                </h4>

                                {selectedActivityData.assignments.length === 0 ? (
                                    <p className="text-sm text-zinc-500 italic">No assignments defined</p>
                                ) : (
                                    <div className="space-y-3">
                                        {selectedActivityData.assignments.map((assignment) => (
                                            <div
                                                key={assignment.id}
                                                className={`rounded-lg p-3 border ${assignment.capacityGap > 0
                                                    ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
                                                    : "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800"
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                                            {assignment.role?.name ?? "Unknown Role"}
                                                        </span>
                                                        {assignment.raciType && (
                                                            <span className="text-xs bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400">
                                                                {assignment.raciType.toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm">
                                                        <span className="text-zinc-500">Needed:</span>{" "}
                                                        <span className="font-medium">{assignment.quantity} {assignment.unit}</span>
                                                    </div>
                                                </div>

                                                {/* Capacity Bar */}
                                                <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden mb-2">
                                                    <div
                                                        className={`h-full transition-all ${assignment.capacityGap > 0
                                                            ? "bg-red-500"
                                                            : "bg-green-500"
                                                            }`}
                                                        style={{
                                                            width: `${Math.min(100, ((assignment.quantity - assignment.capacityGap) / assignment.quantity) * 100)}%`,
                                                        }}
                                                    />
                                                </div>

                                                {/* Allocations */}
                                                {assignment.allocations.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {assignment.allocations.map((alloc) => (
                                                            <div
                                                                key={alloc.id}
                                                                className="flex items-center justify-between text-sm"
                                                            >
                                                                <span className="text-zinc-600 dark:text-zinc-400">
                                                                    👤 {alloc.personName}
                                                                </span>
                                                                <span className="text-green-600 dark:text-green-400">
                                                                    +{alloc.quantityContributed} {assignment.unit}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-zinc-500 italic">No allocations yet</p>
                                                )}

                                                {/* Gap Warning */}
                                                {assignment.capacityGap > 0 && (
                                                    <div className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">
                                                        ⚠️ Gap: {assignment.capacityGap.toFixed(1)} {assignment.unit} unfilled
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                )}
            </EntityDetailPanel>

            {/* Create Activity Dialog */}
            <EntityDetailPanel
                isOpen={showCreate}
                onClose={() => setShowCreate(false)}
                title="Create New Activity"
                isEditing={true}
                onSave={handleCreate}
            >
                <FormField label="Name">
                    <TextInput
                        value={newActivity.name}
                        onChange={(v) => setNewActivity({ ...newActivity, name: v })}
                        placeholder="Activity name"
                    />
                </FormField>
                <FormField label="Description">
                    <TextArea
                        value={newActivity.description ?? ""}
                        onChange={(v) => setNewActivity({ ...newActivity, description: v })}
                    />
                </FormField>
                <FormField label="Initiative">
                    <SelectInput
                        value={newActivity.initiativeId ?? ""}
                        onChange={(v) => setNewActivity({ ...newActivity, initiativeId: v || undefined })}
                        options={[
                            { value: "", label: "Select initiative..." },
                            ...data.initiatives.map((i) => ({ value: i.id, label: i.name })),
                        ]}
                    />
                </FormField>
                <FormField label="Status">
                    <SelectInput
                        value={newActivity.status}
                        onChange={(v) => setNewActivity({ ...newActivity, status: v as Activity["status"] })}
                        options={[
                            { value: "backlog", label: "Backlog" },
                            { value: "ready", label: "Ready" },
                            { value: "in_progress", label: "In Progress" },
                            { value: "blocked", label: "Blocked" },
                            { value: "complete", label: "Complete" },
                        ]}
                    />
                </FormField>
            </EntityDetailPanel>
        </div>
    );
}

// ============================================================================
// Sub-components
// ============================================================================

function ActivityRow({
    activity,
    onClick,
}: {
    activity: ActivityWithResources;
    onClick: () => void;
}) {
    const totalNeeded = activity.assignments.reduce((sum, a) => sum + a.quantity, 0);
    const totalFilled = activity.assignments.reduce(
        (sum, a) => sum + a.quantity - a.capacityGap,
        0
    );
    const hasGap = activity.assignments.some((a) => a.capacityGap > 0);

    return (
        <button
            onClick={onClick}
            className="w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
        >
            <div className="flex items-center gap-3">
                <span className="text-xl">⚙️</span>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                            {activity.name}
                        </span>
                        <StatusBadge status={activity.status} />
                        {activity.blockedByActivities.length > 0 && (
                            <span className="text-xs text-red-500" title="Has blockers">
                                🚫 {activity.blockedByActivities.length}
                            </span>
                        )}
                    </div>
                    {activity.description && (
                        <p className="text-sm text-zinc-500 truncate mt-0.5">
                            {activity.description}
                        </p>
                    )}
                </div>

                {/* Resource Summary */}
                {activity.assignments.length > 0 && (
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                            <p className="text-xs text-zinc-500">Staffing</p>
                            <p className={`text-sm font-medium ${hasGap ? "text-red-600" : "text-green-600"}`}>
                                {totalFilled.toFixed(1)}/{totalNeeded.toFixed(1)} FTE
                            </p>
                        </div>
                        <div className="w-20 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${hasGap ? "bg-red-500" : "bg-green-500"}`}
                                style={{ width: `${(totalFilled / totalNeeded) * 100}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </button>
    );
}

function StatusBadge({ status }: { status: string }) {
    const statusStyles: Record<string, string> = {
        backlog: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
        ready: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
        in_progress: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
        complete: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
        blocked: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
    };

    return (
        <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyles[status] ?? statusStyles.backlog}`}>
            {status.replace("_", " ")}
        </span>
    );
}
