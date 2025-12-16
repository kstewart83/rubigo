"use client";

import { useState, useMemo } from "react";
import { useProjectData } from "@/contexts/project-data-context";
import type { Objective } from "@/types/project";
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

interface ObjectiveTreeNode extends Objective {
    children: ObjectiveTreeNode[];
}

// ============================================================================
// Main Component
// ============================================================================

export function ObjectivesListWithCRUD() {
    const { data, updateObjective, createObjective, deleteObjective } = useProjectData();

    // Current folder (objective being viewed) - null means root level
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

    // Detail panel state
    const [selectedObjective, setSelectedObjective] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Objective>>({});

    // Create objective state
    const [showCreate, setShowCreate] = useState(false);
    const [newObjective, setNewObjective] = useState<Omit<Objective, "id">>({
        title: "",
        description: "",
        projectId: data.projects[0]?.id ?? "",
        parentId: undefined,
        status: "draft",
    });

    // Build the objective tree
    const objectiveTree = useMemo(() => {
        const buildTree = (parentId: string | undefined): ObjectiveTreeNode[] => {
            return data.objectives
                .filter((obj) => obj.parentId === parentId)
                .map((obj) => ({
                    ...obj,
                    children: buildTree(obj.id),
                }));
        };
        return buildTree(undefined);
    }, [data.objectives]);

    // Get current folder's children
    const currentChildren = useMemo(() => {
        if (currentFolderId === null) {
            // Root level: show objectives without parent
            return data.objectives.filter((obj) => !obj.parentId);
        }
        return data.objectives.filter((obj) => obj.parentId === currentFolderId);
    }, [data.objectives, currentFolderId]);

    // Build breadcrumb path
    const breadcrumbPath = useMemo(() => {
        const path: Objective[] = [];
        let currentId = currentFolderId;

        while (currentId) {
            const obj = data.objectives.find((o) => o.id === currentId);
            if (obj) {
                path.unshift(obj);
                currentId = obj.parentId ?? null;
            } else {
                break;
            }
        }
        return path;
    }, [data.objectives, currentFolderId]);

    // Get current folder objective (if any)
    const currentFolder = currentFolderId
        ? data.objectives.find((o) => o.id === currentFolderId)
        : null;

    // Navigate into a folder (objective)
    const navigateToFolder = (objectiveId: string | null) => {
        setCurrentFolderId(objectiveId);
    };

    // Open detail panel
    const openObjectiveDetail = (id: string) => {
        setSelectedObjective(id);
        setIsEditing(false);
        const objective = data.objectives.find((o) => o.id === id);
        if (objective) {
            setEditForm({ ...objective });
        }
    };

    const handleSave = () => {
        if (selectedObjective) {
            updateObjective(selectedObjective, editForm);
            setIsEditing(false);
        }
    };

    const handleDelete = () => {
        if (selectedObjective) {
            // Check if has children
            const hasChildren = data.objectives.some((o) => o.parentId === selectedObjective);
            if (hasChildren) {
                alert("Cannot delete an objective with children. Delete children first.");
                return;
            }
            deleteObjective(selectedObjective);
            setSelectedObjective(null);
        }
    };

    const handleCreate = () => {
        if (newObjective.title) {
            createObjective({
                ...newObjective,
                parentId: currentFolderId ?? undefined,
            });
            setShowCreate(false);
            setNewObjective({
                title: "",
                description: "",
                projectId: data.projects[0]?.id ?? "",
                parentId: undefined,
                status: "draft",
            });
        }
    };

    // Get child count for an objective
    const getChildCount = (objectiveId: string) =>
        data.objectives.filter((o) => o.parentId === objectiveId).length;

    // Get KPI count for an objective
    const getKPICount = (objectiveId: string) =>
        data.kpis.filter((k) => k.objectiveId === objectiveId).length;

    const statusStyles: Record<string, string> = {
        active: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
        achieved: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
        draft: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
        deferred: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
        planned: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
    };

    return (
        <div className="space-y-4">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-1 text-sm">
                <button
                    onClick={() => navigateToFolder(null)}
                    className={`px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${currentFolderId === null
                            ? "font-semibold text-zinc-900 dark:text-zinc-100"
                            : "text-zinc-500 dark:text-zinc-400"
                        }`}
                >
                    🏠 Objectives
                </button>
                {breadcrumbPath.map((obj, index) => (
                    <span key={obj.id} className="flex items-center gap-1">
                        <span className="text-zinc-400">/</span>
                        <button
                            onClick={() => navigateToFolder(obj.id)}
                            className={`px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors max-w-[200px] truncate ${index === breadcrumbPath.length - 1
                                    ? "font-semibold text-zinc-900 dark:text-zinc-100"
                                    : "text-zinc-500 dark:text-zinc-400"
                                }`}
                            title={obj.title}
                        >
                            {obj.title}
                        </button>
                    </span>
                ))}
            </div>

            {/* Current Folder Info */}
            {currentFolder && (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                🎯 {currentFolder.title}
                                <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyles[currentFolder.status] ?? statusStyles.draft}`}>
                                    {currentFolder.status}
                                </span>
                            </h2>
                            {currentFolder.description && (
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                                    {currentFolder.description}
                                </p>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openObjectiveDetail(currentFolder.id)}
                        >
                            Edit
                        </Button>
                    </div>
                </div>
            )}

            {/* Action Bar */}
            <div className="flex justify-between items-center">
                <p className="text-sm text-zinc-500">
                    {currentChildren.length} {currentFolderId ? "sub-objective" : "objective"}{currentChildren.length !== 1 ? "s" : ""}
                </p>
                <Button size="sm" onClick={() => setShowCreate(true)}>
                    + New {currentFolderId ? "Sub-Objective" : "Objective"}
                </Button>
            </div>

            {/* Objectives List (Folder View) */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                {currentChildren.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500">
                        <p className="text-lg mb-2">📂</p>
                        <p>No objectives at this level</p>
                        <p className="text-sm">Create a new objective to get started</p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {currentChildren.map((objective) => {
                            const childCount = getChildCount(objective.id);
                            const kpiCount = getKPICount(objective.id);
                            const hasChildren = childCount > 0;

                            return (
                                <div
                                    key={objective.id}
                                    className="flex items-center hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                                >
                                    {/* Main clickable area - navigates into folder */}
                                    <button
                                        onClick={() => hasChildren ? navigateToFolder(objective.id) : openObjectiveDetail(objective.id)}
                                        className="flex-1 flex items-center gap-3 px-4 py-3 text-left"
                                    >
                                        <span className="text-xl">
                                            {hasChildren ? "📁" : "🎯"}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                                    {objective.title}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${statusStyles[objective.status] ?? statusStyles.draft}`}>
                                                    {objective.status}
                                                </span>
                                            </div>
                                            {objective.description && (
                                                <p className="text-sm text-zinc-500 truncate mt-0.5">
                                                    {objective.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                                            {childCount > 0 && (
                                                <span title="Sub-objectives">
                                                    📁 {childCount}
                                                </span>
                                            )}
                                            {kpiCount > 0 && (
                                                <span title="KPIs">
                                                    📈 {kpiCount}
                                                </span>
                                            )}
                                        </div>
                                    </button>

                                    {/* Details button */}
                                    <button
                                        onClick={() => openObjectiveDetail(objective.id)}
                                        className="px-3 py-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 border-l border-zinc-100 dark:border-zinc-800"
                                        title="View details"
                                    >
                                        ⋮
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Detail Panel */}
            <EntityDetailPanel
                isOpen={selectedObjective !== null}
                onClose={() => setSelectedObjective(null)}
                title={`Objective: ${data.objectives.find((o) => o.id === selectedObjective)?.title ?? ""}`}
                isEditing={isEditing}
                onEditToggle={() => setIsEditing(!isEditing)}
                onSave={handleSave}
                onDelete={handleDelete}
            >
                {isEditing ? (
                    <>
                        <FormField label="Title">
                            <TextInput
                                value={editForm.title ?? ""}
                                onChange={(v) => setEditForm({ ...editForm, title: v })}
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
                                value={editForm.status ?? "draft"}
                                onChange={(v) => setEditForm({ ...editForm, status: v as Objective["status"] })}
                                options={[
                                    { value: "draft", label: "Draft" },
                                    { value: "active", label: "Active" },
                                    { value: "achieved", label: "Achieved" },
                                    { value: "deferred", label: "Deferred" },
                                ]}
                            />
                        </FormField>
                        <FormField label="Parent Objective">
                            <SelectInput
                                value={editForm.parentId ?? ""}
                                onChange={(v) => setEditForm({ ...editForm, parentId: v || undefined })}
                                options={[
                                    { value: "", label: "None (Root level)" },
                                    ...data.objectives
                                        .filter((o) => o.id !== selectedObjective)
                                        .map((o) => ({ value: o.id, label: o.title })),
                                ]}
                            />
                        </FormField>
                    </>
                ) : (
                    <>
                        <DisplayField label="Title" value={editForm.title} />
                        <DisplayField label="Description" value={editForm.description} />
                        <DisplayField label="Status" value={editForm.status} />
                        <DisplayField label="Parent" value={data.objectives.find((o) => o.id === editForm.parentId)?.title ?? "Root Level"} />
                        <DisplayField label="Project" value={data.projects.find((p) => p.id === editForm.projectId)?.name} />
                        <DisplayField label="ID" value={selectedObjective ?? ""} />

                        {/* Children */}
                        {(() => {
                            const children = data.objectives.filter((o) => o.parentId === selectedObjective);
                            return children.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                                    <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                        Sub-Objectives ({children.length})
                                    </h4>
                                    <ul className="space-y-1">
                                        {children.map((child) => (
                                            <li key={child.id} className="text-sm text-zinc-600 dark:text-zinc-400">
                                                📁 {child.title}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })()}

                        {/* KPIs */}
                        {(() => {
                            const kpis = data.kpis.filter((k) => k.objectiveId === selectedObjective);
                            return kpis.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                                    <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                        Linked KPIs ({kpis.length})
                                    </h4>
                                    <ul className="space-y-1">
                                        {kpis.map((kpi) => {
                                            const metric = data.metrics.find((m) => m.id === kpi.metricId);
                                            return (
                                                <li key={kpi.id} className="text-sm text-zinc-600 dark:text-zinc-400">
                                                    📈 {metric?.name ?? "Unknown"} → {kpi.targetValue}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            );
                        })()}
                    </>
                )}
            </EntityDetailPanel>

            {/* Create Panel */}
            <EntityDetailPanel
                isOpen={showCreate}
                onClose={() => setShowCreate(false)}
                title={`Create New ${currentFolderId ? "Sub-Objective" : "Objective"}`}
                isEditing={true}
                onSave={handleCreate}
            >
                <FormField label="Title">
                    <TextInput
                        value={newObjective.title}
                        onChange={(v) => setNewObjective({ ...newObjective, title: v })}
                        placeholder="Objective title"
                    />
                </FormField>
                <FormField label="Description">
                    <TextArea
                        value={newObjective.description ?? ""}
                        onChange={(v) => setNewObjective({ ...newObjective, description: v })}
                        placeholder="Describe this objective"
                    />
                </FormField>
                {currentFolderId && (
                    <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded text-sm text-zinc-600 dark:text-zinc-400">
                        Will be created under: <strong>{currentFolder?.title}</strong>
                    </div>
                )}
                <FormField label="Status">
                    <SelectInput
                        value={newObjective.status}
                        onChange={(v) => setNewObjective({ ...newObjective, status: v as Objective["status"] })}
                        options={[
                            { value: "draft", label: "Draft" },
                            { value: "active", label: "Active" },
                            { value: "achieved", label: "Achieved" },
                            { value: "deferred", label: "Deferred" },
                        ]}
                    />
                </FormField>
            </EntityDetailPanel>
        </div>
    );
}
