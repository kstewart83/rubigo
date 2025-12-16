"use client";

import { useState } from "react";
import { useProjectData } from "@/contexts/project-data-context";
import type {
    SolutionView,
    Project,
    Objective,
    Initiative,
    Metric,
    KPI,
} from "@/types/project";
import {
    EntityDetailPanel,
    FormField,
    TextInput,
    TextArea,
    SelectInput,
    NumberInput,
    DisplayField,
} from "@/components/entity-detail-panel";
import { Button } from "@/components/ui/button";

// ============================================================================
// Main Component
// ============================================================================

export function ProjectOverviewWithCRUD() {
    const { data, updateObjective, updateSolutionView, updateProject, updateMetric, updateKPI, updateInitiative, createObjective, deleteObjective } = useProjectData();

    const [expandedObjectives, setExpandedObjectives] = useState<Set<string>>(new Set());

    // Entity detail panel state
    const [selectedEntity, setSelectedEntity] = useState<{
        type: "solution" | "project" | "objective" | "metric" | "kpi" | "initiative";
        id: string;
    } | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Record<string, unknown>>({});

    // Create objective modal state
    const [showCreateObjective, setShowCreateObjective] = useState(false);
    const [newObjective, setNewObjective] = useState<{ title: string; description: string; projectId: string; status: Objective["status"] }>({ title: "", description: "", projectId: "", status: "draft" });

    const toggleObjective = (id: string) => {
        setExpandedObjectives((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // Open entity detail panel
    const openEntityDetail = (type: typeof selectedEntity extends null ? never : NonNullable<typeof selectedEntity>["type"], id: string) => {
        setSelectedEntity({ type, id });
        setIsEditing(false);

        // Load entity data into edit form
        let entity: unknown;
        switch (type) {
            case "solution":
                entity = data.solutionViews.find((s) => s.id === id);
                break;
            case "project":
                entity = data.projects.find((p) => p.id === id);
                break;
            case "objective":
                entity = data.objectives.find((o) => o.id === id);
                break;
            case "metric":
                entity = data.metrics.find((m) => m.id === id);
                break;
            case "kpi":
                entity = data.kpis.find((k) => k.id === id);
                break;
            case "initiative":
                entity = data.initiatives.find((i) => i.id === id);
                break;
        }
        if (entity) {
            setEditForm({ ...(entity as Record<string, unknown>) });
        }
    };

    const closeEntityDetail = () => {
        setSelectedEntity(null);
        setIsEditing(false);
        setEditForm({});
    };

    const handleSave = () => {
        if (!selectedEntity) return;

        switch (selectedEntity.type) {
            case "solution":
                updateSolutionView(selectedEntity.id, editForm as Partial<SolutionView>);
                break;
            case "project":
                updateProject(selectedEntity.id, editForm as Partial<Project>);
                break;
            case "objective":
                updateObjective(selectedEntity.id, editForm as Partial<Objective>);
                break;
            case "metric":
                updateMetric(selectedEntity.id, editForm as Partial<Metric>);
                break;
            case "kpi":
                updateKPI(selectedEntity.id, editForm as Partial<KPI>);
                break;
            case "initiative":
                updateInitiative(selectedEntity.id, editForm as Partial<Initiative>);
                break;
        }
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (!selectedEntity) return;
        if (selectedEntity.type === "objective") {
            deleteObjective(selectedEntity.id);
        }
        closeEntityDetail();
    };

    const handleCreateObjective = () => {
        if (!newObjective.title || !newObjective.projectId) return;
        createObjective(newObjective);
        setShowCreateObjective(false);
        setNewObjective({ title: "", description: "", projectId: "", status: "draft" });
    };

    // Get KPIs for a specific objective
    const getKPIsForObjective = (objectiveId: string) =>
        data.kpis.filter((k) => k.objectiveId === objectiveId);

    // Get initiatives for a specific KPI
    const getInitiativesForKPI = (kpiId: string) =>
        data.initiatives.filter((i) => i.kpiId === kpiId);

    // Get metric for a KPI
    const getMetricForKPI = (metricId: string) =>
        data.metrics.find((m) => m.id === metricId);

    // Calculate capacity gaps
    const capacityGaps = data.assignments.map((assignment) => {
        const allocations = data.allocations.filter((a) => a.assignmentId === assignment.id);
        const totalAllocated = allocations.reduce((sum, a) => sum + a.quantityContributed, 0);
        const gap = assignment.quantity - totalAllocated;
        const activity = data.activities.find((a) => a.id === assignment.activityId);
        const role = data.roles.find((r) => r.id === assignment.roleId);
        return { ...assignment, totalAllocated, capacityGap: gap, activity, role };
    }).filter((a) => a.capacityGap > 0);

    return (
        <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => setShowCreateObjective(true)}
                    >
                        + New Objective
                    </Button>
                </div>
                <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                    ✓ Auto-saved to database
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard label="Services" value={data.services.length} icon="🏢" />
                <StatCard label="Projects" value={data.projects.filter((p) => p.status === "active").length} icon="📁" />
                <StatCard label="Objectives" value={data.objectives.length} icon="🎯" />
                <StatCard label="Metrics" value={data.metrics.length} icon="📊" />
                <StatCard
                    label="Capacity Gaps"
                    value={capacityGaps.length}
                    icon="⚠️"
                    variant={capacityGaps.length > 0 ? "warning" : "default"}
                />
            </div>

            {/* Solution & Project Overview */}
            {data.solutionViews.map((solution) => {
                const solutionProjects = data.projects.filter((p) => p.solutionId === solution.id);

                return (
                    <div
                        key={solution.id}
                        className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden"
                    >
                        {/* Solution Header */}
                        <button
                            onClick={() => openEntityDetail("solution", solution.id)}
                            className="w-full bg-zinc-50 dark:bg-zinc-900 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{solution.isProduct && solution.isService ? "📦🔧" : solution.isProduct ? "📦" : "🔧"}</span>
                                <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                                    {solution.name}
                                </h2>
                                <StatusBadge status={solution.status} />
                                <span className="text-xs text-zinc-500 ml-auto">Click to edit</span>
                            </div>
                        </button>

                        {/* Projects */}
                        {solutionProjects.map((project) => {
                            const projectObjectives = data.objectives.filter(
                                (o) => o.projectId === project.id
                            );

                            return (
                                <div key={project.id} className="border-b border-zinc-200 dark:border-zinc-800 last:border-b-0">
                                    {/* Project Header */}
                                    <button
                                        onClick={() => openEntityDetail("project", project.id)}
                                        className="w-full px-4 py-3 bg-white dark:bg-zinc-950 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">📁</span>
                                                <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                                                    {project.name}
                                                </h3>
                                                <StatusBadge status={project.status} />
                                            </div>
                                            <span className="text-xs text-zinc-500">Click to edit</span>
                                        </div>
                                    </button>

                                    {/* Objectives (Accordion) */}
                                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                        {projectObjectives.map((objective) => {
                                            const isExpanded = expandedObjectives.has(objective.id);
                                            const objectiveKPIs = getKPIsForObjective(objective.id);

                                            return (
                                                <div key={objective.id}>
                                                    {/* Objective Row */}
                                                    <div className="flex items-center">
                                                        <button
                                                            onClick={() => toggleObjective(objective.id)}
                                                            className="px-4 py-3 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                                                        >
                                                            <span className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}>
                                                                ▶
                                                            </span>
                                                        </button>
                                                        <button
                                                            onClick={() => openEntityDetail("objective", objective.id)}
                                                            className="flex-1 py-3 pr-4 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-left"
                                                        >
                                                            <span className="text-lg">🎯</span>
                                                            <span className="flex-1 text-zinc-900 dark:text-zinc-100">
                                                                {objective.title}
                                                            </span>
                                                            <span className="text-xs text-zinc-500">
                                                                {objectiveKPIs.length} KPI{objectiveKPIs.length !== 1 ? "s" : ""}
                                                            </span>
                                                            <StatusBadge status={objective.status} />
                                                        </button>
                                                    </div>

                                                    {/* Expanded: KPIs & Initiatives */}
                                                    {isExpanded && (
                                                        <div className="bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3 pl-12 space-y-3">
                                                            {objectiveKPIs.length === 0 ? (
                                                                <p className="text-sm text-zinc-500 italic">
                                                                    No KPIs linked to this objective
                                                                </p>
                                                            ) : (
                                                                objectiveKPIs.map((kpi) => {
                                                                    const metric = getMetricForKPI(kpi.metricId);
                                                                    const kpiInitiatives = getInitiativesForKPI(kpi.id);
                                                                    return (
                                                                        <KPICard
                                                                            key={kpi.id}
                                                                            kpi={kpi}
                                                                            metric={metric}
                                                                            initiatives={kpiInitiatives}
                                                                            onClickKPI={() => openEntityDetail("kpi", kpi.id)}
                                                                            onClickMetric={() => metric && openEntityDetail("metric", metric.id)}
                                                                            onClickInitiative={(id) => openEntityDetail("initiative", id)}
                                                                        />
                                                                    );
                                                                })
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            })}

            {/* Capacity Gaps Warning */}
            {capacityGaps.length > 0 && (
                <div className="border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/30 rounded-lg p-4">
                    <h3 className="font-semibold text-orange-800 dark:text-orange-300 mb-2 flex items-center gap-2">
                        <span>⚠️</span> Under-Resourced Assignments
                    </h3>
                    <div className="space-y-2">
                        {capacityGaps.map((gap) => (
                            <div
                                key={gap.id}
                                className="flex items-center justify-between text-sm"
                            >
                                <span className="text-zinc-700 dark:text-zinc-300">
                                    {gap.activity?.name} ({gap.role?.name})
                                </span>
                                <span className="text-orange-600 dark:text-orange-400 font-mono">
                                    -{gap.capacityGap.toFixed(1)} {gap.unit}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Entity Detail Panel */}
            <EntityDetailPanel
                isOpen={selectedEntity !== null}
                onClose={closeEntityDetail}
                title={getEntityTitle(selectedEntity, data)}
                isEditing={isEditing}
                onEditToggle={() => setIsEditing(!isEditing)}
                onSave={handleSave}
                onDelete={selectedEntity?.type === "objective" ? handleDelete : undefined}
            >
                {selectedEntity && (
                    <EntityForm
                        type={selectedEntity.type}
                        data={data}
                        form={editForm}
                        setForm={setEditForm}
                        isEditing={isEditing}
                    />
                )}
            </EntityDetailPanel>

            {/* Create Objective Modal */}
            <EntityDetailPanel
                isOpen={showCreateObjective}
                onClose={() => setShowCreateObjective(false)}
                title="Create New Objective"
                isEditing={true}
                onSave={handleCreateObjective}
            >
                <FormField label="Title">
                    <TextInput
                        value={newObjective.title}
                        onChange={(v) => setNewObjective((prev) => ({ ...prev, title: v }))}
                        placeholder="Enter objective title"
                    />
                </FormField>
                <FormField label="Description">
                    <TextArea
                        value={newObjective.description}
                        onChange={(v) => setNewObjective((prev) => ({ ...prev, description: v }))}
                        placeholder="Describe the objective"
                    />
                </FormField>
                <FormField label="Project">
                    <SelectInput
                        value={newObjective.projectId}
                        onChange={(v) => setNewObjective((prev) => ({ ...prev, projectId: v }))}
                        options={[
                            { value: "", label: "Select a project..." },
                            ...data.projects.map((p) => ({ value: p.id, label: p.name })),
                        ]}
                    />
                </FormField>
                <FormField label="Status">
                    <SelectInput
                        value={newObjective.status}
                        onChange={(v) => setNewObjective((prev) => ({ ...prev, status: v as Objective["status"] }))}
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

// ============================================================================
// Helper Functions
// ============================================================================

function getEntityTitle(
    selected: { type: string; id: string } | null,
    data: ReturnType<typeof useProjectData>["data"]
): string {
    if (!selected) return "";
    switch (selected.type) {
        case "solution":
            return `Solution: ${data.solutionViews.find((s) => s.id === selected.id)?.name ?? "Unknown"}`;
        case "project":
            return `Project: ${data.projects.find((p) => p.id === selected.id)?.name ?? "Unknown"}`;
        case "objective":
            return `Objective: ${data.objectives.find((o) => o.id === selected.id)?.title ?? "Unknown"}`;
        case "metric":
            return `Metric: ${data.metrics.find((m) => m.id === selected.id)?.name ?? "Unknown"}`;
        case "kpi":
            const kpi = data.kpis.find((k) => k.id === selected.id);
            const metric = kpi ? data.metrics.find((m) => m.id === kpi.metricId) : null;
            return `KPI: ${metric?.name ?? "Unknown"}`;
        case "initiative":
            return `Initiative: ${data.initiatives.find((i) => i.id === selected.id)?.name ?? "Unknown"}`;
        default:
            return "Entity";
    }
}

// ============================================================================
// Sub-components
// ============================================================================

function StatCard({
    label,
    value,
    icon,
    variant = "default",
}: {
    label: string;
    value: number;
    icon: string;
    variant?: "default" | "warning";
}) {
    return (
        <div className={`rounded-lg p-4 ${variant === "warning"
            ? "bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900"
            : "bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
            }`}>
            <div className="flex items-center gap-2 mb-1">
                <span>{icon}</span>
                <span className={`text-sm ${variant === "warning"
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-zinc-600 dark:text-zinc-400"
                    }`}>
                    {label}
                </span>
            </div>
            <div className={`text-2xl font-bold ${variant === "warning"
                ? "text-orange-700 dark:text-orange-300"
                : "text-zinc-900 dark:text-zinc-100"
                }`}>
                {value}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const statusStyles: Record<string, string> = {
        active: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
        catalog: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
        complete: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
        in_progress: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
        planned: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
        pipeline: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
        backlog: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
        draft: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
        blocked: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
        achieved: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
        deferred: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
        retired: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    };

    return (
        <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyles[status] ?? statusStyles.draft}`}>
            {status.replace("_", " ")}
        </span>
    );
}

function KPICard({
    kpi,
    metric,
    initiatives,
    onClickKPI,
    onClickMetric,
    onClickInitiative,
}: {
    kpi: KPI;
    metric: Metric | undefined;
    initiatives: Initiative[];
    onClickKPI: () => void;
    onClickMetric: () => void;
    onClickInitiative: (id: string) => void;
}) {
    const currentValue = metric?.currentValue;
    let percentComplete: number | undefined;

    if (currentValue !== undefined) {
        if (kpi.direction === "increase") {
            percentComplete = Math.min(100, (currentValue / kpi.targetValue) * 100);
        } else if (kpi.direction === "decrease") {
            const startValue = kpi.thresholdCritical ?? kpi.targetValue * 2;
            const progress = startValue - currentValue;
            const totalNeeded = startValue - kpi.targetValue;
            percentComplete = Math.min(100, Math.max(0, (progress / totalNeeded) * 100));
        }
    }

    const progressColor =
        percentComplete !== undefined
            ? percentComplete >= 80
                ? "bg-green-500"
                : percentComplete >= 50
                    ? "bg-yellow-500"
                    : "bg-red-500"
            : "bg-zinc-300";

    const directionIcon =
        kpi.direction === "increase" ? "📈" : kpi.direction === "decrease" ? "📉" : "➡️";

    return (
        <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <div className="flex items-center justify-between mb-2">
                <button
                    onClick={onClickKPI}
                    className="flex items-center gap-2 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                >
                    <span>{directionIcon}</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {metric?.name ?? "Unknown Metric"}
                    </span>
                </button>
                <button
                    onClick={onClickMetric}
                    className="text-sm text-zinc-500 hover:text-orange-600 dark:hover:text-orange-400"
                >
                    {currentValue?.toFixed(1) ?? "—"} / {kpi.targetValue} {metric?.unit}
                </button>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mb-2">
                <div
                    className={`h-full ${progressColor} transition-all`}
                    style={{ width: `${Math.min(100, percentComplete ?? 0)}%` }}
                />
            </div>

            {/* Initiatives */}
            {initiatives.length > 0 && (
                <div className="mt-2 space-y-1">
                    <span className="text-xs text-zinc-500">Initiatives:</span>
                    {initiatives.map((initiative) => (
                        <button
                            key={initiative.id}
                            onClick={() => onClickInitiative(initiative.id)}
                            className="w-full flex items-center gap-2 text-sm pl-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded py-1 text-left"
                        >
                            <span>🚀</span>
                            <span className="text-zinc-700 dark:text-zinc-300">
                                {initiative.name}
                            </span>
                            <StatusBadge status={initiative.status} />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Entity Forms
// ============================================================================

function EntityForm({
    type,
    data,
    form,
    setForm,
    isEditing,
}: {
    type: string;
    data: ReturnType<typeof useProjectData>["data"];
    form: Record<string, unknown>;
    setForm: (form: Record<string, unknown>) => void;
    isEditing: boolean;
}) {
    const updateField = (key: string, value: unknown) => {
        setForm({ ...form, [key]: value });
    };

    switch (type) {
        case "service":
            return (
                <>
                    {isEditing ? (
                        <>
                            <FormField label="Name">
                                <TextInput value={(form.name as string) ?? ""} onChange={(v) => updateField("name", v)} />
                            </FormField>
                            <FormField label="Description">
                                <TextArea value={(form.description as string) ?? ""} onChange={(v) => updateField("description", v)} />
                            </FormField>
                            <FormField label="Status">
                                <SelectInput
                                    value={(form.status as string) ?? "catalog"}
                                    onChange={(v) => updateField("status", v)}
                                    options={[
                                        { value: "pipeline", label: "Pipeline" },
                                        { value: "catalog", label: "Catalog" },
                                        { value: "retired", label: "Retired" },
                                    ]}
                                />
                            </FormField>
                        </>
                    ) : (
                        <>
                            <DisplayField label="Name" value={form.name as string} />
                            <DisplayField label="Description" value={form.description as string} />
                            <DisplayField label="Status" value={form.status as string} />
                            <DisplayField label="ID" value={form.id as string} />
                        </>
                    )}
                </>
            );

        case "project":
            return (
                <>
                    {isEditing ? (
                        <>
                            <FormField label="Name">
                                <TextInput value={(form.name as string) ?? ""} onChange={(v) => updateField("name", v)} />
                            </FormField>
                            <FormField label="Description">
                                <TextArea value={(form.description as string) ?? ""} onChange={(v) => updateField("description", v)} />
                            </FormField>
                            <FormField label="Status">
                                <SelectInput
                                    value={(form.status as string) ?? "planning"}
                                    onChange={(v) => updateField("status", v)}
                                    options={[
                                        { value: "planning", label: "Planning" },
                                        { value: "active", label: "Active" },
                                        { value: "on_hold", label: "On Hold" },
                                        { value: "complete", label: "Complete" },
                                        { value: "cancelled", label: "Cancelled" },
                                    ]}
                                />
                            </FormField>
                            <FormField label="Start Date">
                                <TextInput value={(form.startDate as string) ?? ""} onChange={(v) => updateField("startDate", v)} placeholder="YYYY-MM-DD" />
                            </FormField>
                            <FormField label="End Date">
                                <TextInput value={(form.endDate as string) ?? ""} onChange={(v) => updateField("endDate", v)} placeholder="YYYY-MM-DD" />
                            </FormField>
                        </>
                    ) : (
                        <>
                            <DisplayField label="Name" value={form.name as string} />
                            <DisplayField label="Description" value={form.description as string} />
                            <DisplayField label="Status" value={form.status as string} />
                            <DisplayField label="Start Date" value={form.startDate as string} />
                            <DisplayField label="End Date" value={form.endDate as string} />
                            <DisplayField label="ID" value={form.id as string} />
                        </>
                    )}
                </>
            );

        case "objective":
            return (
                <>
                    {isEditing ? (
                        <>
                            <FormField label="Title">
                                <TextInput value={(form.title as string) ?? ""} onChange={(v) => updateField("title", v)} />
                            </FormField>
                            <FormField label="Description">
                                <TextArea value={(form.description as string) ?? ""} onChange={(v) => updateField("description", v)} />
                            </FormField>
                            <FormField label="Status">
                                <SelectInput
                                    value={(form.status as string) ?? "draft"}
                                    onChange={(v) => updateField("status", v)}
                                    options={[
                                        { value: "draft", label: "Draft" },
                                        { value: "active", label: "Active" },
                                        { value: "achieved", label: "Achieved" },
                                        { value: "deferred", label: "Deferred" },
                                    ]}
                                />
                            </FormField>
                        </>
                    ) : (
                        <>
                            <DisplayField label="Title" value={form.title as string} />
                            <DisplayField label="Description" value={form.description as string} />
                            <DisplayField label="Status" value={form.status as string} />
                            <DisplayField label="Project" value={data.projects.find((p) => p.id === form.projectId)?.name} />
                            <DisplayField label="ID" value={form.id as string} />
                        </>
                    )}
                </>
            );

        case "metric":
            return (
                <>
                    {isEditing ? (
                        <>
                            <FormField label="Name">
                                <TextInput value={(form.name as string) ?? ""} onChange={(v) => updateField("name", v)} />
                            </FormField>
                            <FormField label="Description">
                                <TextArea value={(form.description as string) ?? ""} onChange={(v) => updateField("description", v)} />
                            </FormField>
                            <FormField label="Unit">
                                <TextInput value={(form.unit as string) ?? ""} onChange={(v) => updateField("unit", v)} />
                            </FormField>
                            <FormField label="Current Value">
                                <NumberInput value={form.currentValue as number} onChange={(v) => updateField("currentValue", v)} step={0.1} />
                            </FormField>
                            <FormField label="Source">
                                <TextInput value={(form.source as string) ?? ""} onChange={(v) => updateField("source", v)} />
                            </FormField>
                        </>
                    ) : (
                        <>
                            <DisplayField label="Name" value={form.name as string} />
                            <DisplayField label="Description" value={form.description as string} />
                            <DisplayField label="Unit" value={form.unit as string} />
                            <DisplayField label="Current Value" value={form.currentValue as number} />
                            <DisplayField label="Source" value={form.source as string} />
                            <DisplayField label="ID" value={form.id as string} />
                        </>
                    )}
                </>
            );

        case "kpi":
            return (
                <>
                    {isEditing ? (
                        <>
                            <FormField label="Metric">
                                <SelectInput
                                    value={(form.metricId as string) ?? ""}
                                    onChange={(v) => updateField("metricId", v)}
                                    options={data.metrics.map((m) => ({ value: m.id, label: m.name }))}
                                />
                            </FormField>
                            <FormField label="Objective (Optional)">
                                <SelectInput
                                    value={(form.objectiveId as string) ?? ""}
                                    onChange={(v) => updateField("objectiveId", v || undefined)}
                                    options={[
                                        { value: "", label: "None" },
                                        ...data.objectives.map((o) => ({ value: o.id, label: o.title })),
                                    ]}
                                />
                            </FormField>
                            <FormField label="Target Value">
                                <NumberInput value={form.targetValue as number} onChange={(v) => updateField("targetValue", v)} step={0.1} />
                            </FormField>
                            <FormField label="Direction">
                                <SelectInput
                                    value={(form.direction as string) ?? "increase"}
                                    onChange={(v) => updateField("direction", v)}
                                    options={[
                                        { value: "increase", label: "Increase ↑" },
                                        { value: "decrease", label: "Decrease ↓" },
                                        { value: "maintain", label: "Maintain →" },
                                    ]}
                                />
                            </FormField>
                        </>
                    ) : (
                        <>
                            <DisplayField label="Metric" value={data.metrics.find((m) => m.id === form.metricId)?.name} />
                            <DisplayField label="Objective" value={data.objectives.find((o) => o.id === form.objectiveId)?.title} />
                            <DisplayField label="Target Value" value={form.targetValue as number} />
                            <DisplayField label="Direction" value={form.direction as string} />
                            <DisplayField label="ID" value={form.id as string} />
                        </>
                    )}
                </>
            );

        case "initiative":
            return (
                <>
                    {isEditing ? (
                        <>
                            <FormField label="Name">
                                <TextInput value={(form.name as string) ?? ""} onChange={(v) => updateField("name", v)} />
                            </FormField>
                            <FormField label="Description">
                                <TextArea value={(form.description as string) ?? ""} onChange={(v) => updateField("description", v)} />
                            </FormField>
                            <FormField label="KPI">
                                <SelectInput
                                    value={(form.kpiId as string) ?? ""}
                                    onChange={(v) => updateField("kpiId", v)}
                                    options={data.kpis.map((k) => {
                                        const metric = data.metrics.find((m) => m.id === k.metricId);
                                        return { value: k.id, label: metric?.name ?? k.id };
                                    })}
                                />
                            </FormField>
                            <FormField label="Status">
                                <SelectInput
                                    value={(form.status as string) ?? "planned"}
                                    onChange={(v) => updateField("status", v)}
                                    options={[
                                        { value: "planned", label: "Planned" },
                                        { value: "active", label: "Active" },
                                        { value: "complete", label: "Complete" },
                                        { value: "cancelled", label: "Cancelled" },
                                    ]}
                                />
                            </FormField>
                        </>
                    ) : (
                        <>
                            <DisplayField label="Name" value={form.name as string} />
                            <DisplayField label="Description" value={form.description as string} />
                            <DisplayField label="Status" value={form.status as string} />
                            <DisplayField label="Start Date" value={form.startDate as string} />
                            <DisplayField label="End Date" value={form.endDate as string} />
                            <DisplayField label="ID" value={form.id as string} />
                        </>
                    )}
                </>
            );

        default:
            return <p>Unknown entity type</p>;
    }
}
