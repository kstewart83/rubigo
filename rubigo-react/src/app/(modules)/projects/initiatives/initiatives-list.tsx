"use client";

import { useState } from "react";
import { useProjectData } from "@/contexts/project-data-context";
import type { Initiative } from "@/types/project";
import {
    EntityDetailPanel,
    FormField,
    TextInput,
    TextArea,
    SelectInput,
    DisplayField,
} from "@/components/entity-detail-panel";
import { Button } from "@/components/ui/button";

export function InitiativesListWithCRUD() {
    const { data, updateInitiative, createInitiative, deleteInitiative } = useProjectData();

    const [selectedInitiative, setSelectedInitiative] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Initiative>>({});
    const [showCreate, setShowCreate] = useState(false);
    const [newInitiative, setNewInitiative] = useState<Omit<Initiative, "id">>({
        name: "",
        description: "",
        kpiId: "",
        status: "planned",
    });

    const openInitiative = (id: string) => {
        setSelectedInitiative(id);
        setIsEditing(false);
        const initiative = data.initiatives.find((i) => i.id === id);
        if (initiative) setEditForm({ ...initiative });
    };

    const handleSave = () => {
        if (selectedInitiative) {
            updateInitiative(selectedInitiative, editForm);
            setIsEditing(false);
        }
    };

    const handleDelete = () => {
        if (selectedInitiative) {
            deleteInitiative(selectedInitiative);
            setSelectedInitiative(null);
        }
    };

    const handleCreate = () => {
        if (newInitiative.name && newInitiative.kpiId) {
            createInitiative(newInitiative);
            setShowCreate(false);
            setNewInitiative({ name: "", description: "", kpiId: "", status: "planned" });
        }
    };

    const getActivityCount = (initiativeId: string) =>
        data.activities.filter((a) => a.initiativeId === initiativeId).length;

    const statusStyles: Record<string, string> = {
        active: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
        planned: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
        complete: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
        cancelled: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
    };

    // Get KPI options with metric names
    const kpiOptions = data.kpis.map((kpi) => {
        const metric = data.metrics.find((m) => m.id === kpi.metricId);
        return { value: kpi.id, label: `${metric?.name ?? "Unknown"} (Target: ${kpi.targetValue})` };
    });

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <p className="text-sm text-zinc-500">
                    {data.initiatives.length} initiative{data.initiatives.length !== 1 ? "s" : ""}
                </p>
                <Button size="sm" onClick={() => setShowCreate(true)}>
                    + New Initiative
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.initiatives.map((initiative) => {
                    const kpi = data.kpis.find((k) => k.id === initiative.kpiId);
                    const metric = kpi ? data.metrics.find((m) => m.id === kpi.metricId) : null;

                    return (
                        <button
                            key={initiative.id}
                            onClick={() => openInitiative(initiative.id)}
                            className="text-left p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-orange-300 dark:hover:border-orange-700 transition-colors"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">🚀</span>
                                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                                    {initiative.name}
                                </h3>
                            </div>
                            <p className="text-sm text-zinc-500 line-clamp-2 mb-3">
                                {initiative.description || "No description"}
                            </p>
                            {metric && (
                                <p className="text-xs text-zinc-400 mb-2">📈 {metric.name}</p>
                            )}
                            <div className="flex items-center justify-between">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyles[initiative.status] ?? statusStyles.planned}`}>
                                    {initiative.status}
                                </span>
                                <span className="text-xs text-zinc-500">
                                    {getActivityCount(initiative.id)} activit{getActivityCount(initiative.id) !== 1 ? "ies" : "y"}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            <EntityDetailPanel
                isOpen={selectedInitiative !== null}
                onClose={() => setSelectedInitiative(null)}
                title={`Initiative: ${data.initiatives.find((i) => i.id === selectedInitiative)?.name ?? ""}`}
                isEditing={isEditing}
                onEditToggle={() => setIsEditing(!isEditing)}
                onSave={handleSave}
                onDelete={handleDelete}
            >
                {isEditing ? (
                    <>
                        <FormField label="Name"><TextInput value={editForm.name ?? ""} onChange={(v) => setEditForm({ ...editForm, name: v })} /></FormField>
                        <FormField label="Description"><TextArea value={editForm.description ?? ""} onChange={(v) => setEditForm({ ...editForm, description: v })} /></FormField>
                        <FormField label="Linked KPI">
                            <SelectInput value={editForm.kpiId ?? ""} onChange={(v) => setEditForm({ ...editForm, kpiId: v })} options={kpiOptions} />
                        </FormField>
                        <FormField label="Status">
                            <SelectInput value={editForm.status ?? "planned"} onChange={(v) => setEditForm({ ...editForm, status: v as Initiative["status"] })} options={[
                                { value: "planned", label: "Planned" },
                                { value: "active", label: "Active" },
                                { value: "complete", label: "Complete" },
                                { value: "cancelled", label: "Cancelled" },
                            ]} />
                        </FormField>
                    </>
                ) : (
                    <>
                        <DisplayField label="Name" value={editForm.name} />
                        <DisplayField label="Description" value={editForm.description} />
                        <DisplayField label="KPI" value={(() => {
                            const kpi = data.kpis.find((k) => k.id === editForm.kpiId);
                            const metric = kpi ? data.metrics.find((m) => m.id === kpi.metricId) : null;
                            return metric?.name;
                        })()} />
                        <DisplayField label="Status" value={editForm.status} />
                        <DisplayField label="Start Date" value={editForm.startDate} />
                        <DisplayField label="End Date" value={editForm.endDate} />

                        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Activities</h4>
                            {data.activities.filter((a) => a.initiativeId === selectedInitiative).length === 0 ? (
                                <p className="text-sm text-zinc-500 italic">No activities</p>
                            ) : (
                                <ul className="space-y-1">
                                    {data.activities.filter((a) => a.initiativeId === selectedInitiative).map((activity) => (
                                        <li key={activity.id} className="text-sm text-zinc-600 dark:text-zinc-400">⚙️ {activity.name}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </>
                )}
            </EntityDetailPanel>

            <EntityDetailPanel
                isOpen={showCreate}
                onClose={() => setShowCreate(false)}
                title="Create New Initiative"
                isEditing={true}
                onSave={handleCreate}
            >
                <FormField label="Name"><TextInput value={newInitiative.name} onChange={(v) => setNewInitiative({ ...newInitiative, name: v })} placeholder="Initiative name" /></FormField>
                <FormField label="Description"><TextArea value={newInitiative.description ?? ""} onChange={(v) => setNewInitiative({ ...newInitiative, description: v })} /></FormField>
                <FormField label="Linked KPI">
                    <SelectInput value={newInitiative.kpiId} onChange={(v) => setNewInitiative({ ...newInitiative, kpiId: v })} options={[{ value: "", label: "Select KPI..." }, ...kpiOptions]} />
                </FormField>
                <FormField label="Status">
                    <SelectInput value={newInitiative.status} onChange={(v) => setNewInitiative({ ...newInitiative, status: v as Initiative["status"] })} options={[
                        { value: "planned", label: "Planned" },
                        { value: "active", label: "Active" },
                        { value: "complete", label: "Complete" },
                        { value: "cancelled", label: "Cancelled" },
                    ]} />
                </FormField>
            </EntityDetailPanel>
        </div>
    );
}
