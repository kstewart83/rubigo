"use client";

import { useState } from "react";
import { useProjectData } from "@/contexts/project-data-context";
import type { Activity } from "@/types/project";
import {
    EntityDetailPanel,
    FormField,
    TextInput,
    TextArea,
    SelectInput,
    DisplayField,
} from "@/components/entity-detail-panel";
import { Button } from "@/components/ui/button";

export function ActivitiesListWithCRUD() {
    const { data, updateActivity, createActivity, deleteActivity } = useProjectData();

    const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Activity>>({});
    const [showCreate, setShowCreate] = useState(false);
    const [newActivity, setNewActivity] = useState<Omit<Activity, "id">>({
        name: "",
        description: "",
        initiativeId: "",
        status: "backlog",
    });

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

    const statusStyles: Record<string, string> = {
        backlog: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
        planned: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
        in_progress: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
        complete: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
        blocked: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
    };

    // Group by initiative
    const activitiesByInitiative = data.initiatives.map((initiative) => ({
        initiative,
        activities: data.activities.filter((a) => a.initiativeId === initiative.id),
    }));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <p className="text-sm text-zinc-500">
                    {data.activities.length} activit{data.activities.length !== 1 ? "ies" : "y"}
                </p>
                <Button size="sm" onClick={() => setShowCreate(true)}>
                    + New Activity
                </Button>
            </div>

            {activitiesByInitiative.map(({ initiative, activities }) => (
                <div key={initiative.id} className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                    <div className="bg-zinc-50 dark:bg-zinc-900 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800">
                        <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                            🚀 {initiative.name}
                        </h3>
                    </div>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {activities.length === 0 ? (
                            <p className="p-4 text-sm text-zinc-500 italic">No activities</p>
                        ) : (
                            activities.map((activity) => (
                                <button
                                    key={activity.id}
                                    onClick={() => openActivity(activity.id)}
                                    className="w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span>⚙️</span>
                                        <span className="flex-1 text-zinc-900 dark:text-zinc-100">
                                            {activity.name}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyles[activity.status] ?? statusStyles.backlog}`}>
                                            {activity.status.replace("_", " ")}
                                        </span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            ))}

            <EntityDetailPanel
                isOpen={selectedActivity !== null}
                onClose={() => setSelectedActivity(null)}
                title={`Activity: ${data.activities.find((a) => a.id === selectedActivity)?.name ?? ""}`}
                isEditing={isEditing}
                onEditToggle={() => setIsEditing(!isEditing)}
                onSave={handleSave}
                onDelete={handleDelete}
            >
                {isEditing ? (
                    <>
                        <FormField label="Name"><TextInput value={editForm.name ?? ""} onChange={(v) => setEditForm({ ...editForm, name: v })} /></FormField>
                        <FormField label="Description"><TextArea value={editForm.description ?? ""} onChange={(v) => setEditForm({ ...editForm, description: v })} /></FormField>
                        <FormField label="Status">
                            <SelectInput value={editForm.status ?? "backlog"} onChange={(v) => setEditForm({ ...editForm, status: v as Activity["status"] })} options={[
                                { value: "backlog", label: "Backlog" },
                                { value: "planned", label: "Planned" },
                                { value: "in_progress", label: "In Progress" },
                                { value: "complete", label: "Complete" },
                                { value: "blocked", label: "Blocked" },
                            ]} />
                        </FormField>
                    </>
                ) : (
                    <>
                        <DisplayField label="Name" value={editForm.name} />
                        <DisplayField label="Description" value={editForm.description} />
                        <DisplayField label="Initiative" value={data.initiatives.find((i) => i.id === editForm.initiativeId)?.name} />
                        <DisplayField label="Status" value={editForm.status?.replace("_", " ")} />

                        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Assignments</h4>
                            {data.assignments.filter((a) => a.activityId === selectedActivity).length === 0 ? (
                                <p className="text-sm text-zinc-500 italic">No assignments</p>
                            ) : (
                                <ul className="space-y-1">
                                    {data.assignments.filter((a) => a.activityId === selectedActivity).map((assignment) => {
                                        const role = data.roles.find((r) => r.id === assignment.roleId);
                                        return (
                                            <li key={assignment.id} className="text-sm text-zinc-600 dark:text-zinc-400">
                                                👤 {role?.name ?? "Unknown"}: {assignment.quantity} {assignment.unit}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </>
                )}
            </EntityDetailPanel>

            <EntityDetailPanel
                isOpen={showCreate}
                onClose={() => setShowCreate(false)}
                title="Create New Activity"
                isEditing={true}
                onSave={handleCreate}
            >
                <FormField label="Name"><TextInput value={newActivity.name} onChange={(v) => setNewActivity({ ...newActivity, name: v })} placeholder="Activity name" /></FormField>
                <FormField label="Description"><TextArea value={newActivity.description ?? ""} onChange={(v) => setNewActivity({ ...newActivity, description: v })} /></FormField>
                <FormField label="Initiative">
                    <SelectInput value={newActivity.initiativeId ?? ""} onChange={(v) => setNewActivity({ ...newActivity, initiativeId: v || undefined })} options={[
                        { value: "", label: "Select initiative..." },
                        ...data.initiatives.map((i) => ({ value: i.id, label: i.name })),
                    ]} />
                </FormField>
                <FormField label="Status">
                    <SelectInput value={newActivity.status} onChange={(v) => setNewActivity({ ...newActivity, status: v as Activity["status"] })} options={[
                        { value: "backlog", label: "Backlog" },
                        { value: "planned", label: "Planned" },
                        { value: "in_progress", label: "In Progress" },
                        { value: "complete", label: "Complete" },
                        { value: "blocked", label: "Blocked" },
                    ]} />
                </FormField>
            </EntityDetailPanel>
        </div>
    );
}
