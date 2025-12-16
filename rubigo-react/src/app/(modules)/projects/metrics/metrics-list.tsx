"use client";

import { useState } from "react";
import { useProjectData } from "@/contexts/project-data-context";
import type { Metric, KPI } from "@/types/project";
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

type TabType = "metrics" | "kpis";

export function MetricsListWithCRUD() {
    const { data, updateMetric, createMetric, deleteMetric, updateKPI, createKPI, deleteKPI } = useProjectData();

    const [activeTab, setActiveTab] = useState<TabType>("metrics");
    const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
    const [selectedKPI, setSelectedKPI] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editMetricForm, setEditMetricForm] = useState<Partial<Metric>>({});
    const [editKPIForm, setEditKPIForm] = useState<Partial<KPI>>({});
    const [showCreateMetric, setShowCreateMetric] = useState(false);
    const [showCreateKPI, setShowCreateKPI] = useState(false);
    const [newMetric, setNewMetric] = useState<Omit<Metric, "id">>({
        name: "",
        description: "",
        unit: "",
        currentValue: undefined,
        source: "",
    });
    const [newKPI, setNewKPI] = useState<Omit<KPI, "id">>({
        metricId: "",
        objectiveId: undefined,
        targetValue: 0,
        direction: "increase",
    });

    // Metric handlers
    const openMetric = (id: string) => {
        setSelectedMetric(id);
        setIsEditing(false);
        const metric = data.metrics.find((m) => m.id === id);
        if (metric) setEditMetricForm({ ...metric });
    };

    const handleSaveMetric = () => {
        if (selectedMetric) {
            updateMetric(selectedMetric, editMetricForm);
            setIsEditing(false);
        }
    };

    const handleDeleteMetric = () => {
        if (selectedMetric) {
            deleteMetric(selectedMetric);
            setSelectedMetric(null);
        }
    };

    const handleCreateMetric = () => {
        if (newMetric.name && newMetric.unit) {
            createMetric(newMetric);
            setShowCreateMetric(false);
            setNewMetric({ name: "", description: "", unit: "", currentValue: undefined, source: "" });
        }
    };

    // KPI handlers
    const openKPI = (id: string) => {
        setSelectedKPI(id);
        setIsEditing(false);
        const kpi = data.kpis.find((k) => k.id === id);
        if (kpi) setEditKPIForm({ ...kpi });
    };

    const handleSaveKPI = () => {
        if (selectedKPI) {
            updateKPI(selectedKPI, editKPIForm);
            setIsEditing(false);
        }
    };

    const handleDeleteKPI = () => {
        if (selectedKPI) {
            deleteKPI(selectedKPI);
            setSelectedKPI(null);
        }
    };

    const handleCreateKPI = () => {
        if (newKPI.metricId && newKPI.targetValue) {
            createKPI(newKPI);
            setShowCreateKPI(false);
            setNewKPI({ metricId: "", objectiveId: undefined, targetValue: 0, direction: "increase" });
        }
    };

    return (
        <div className="space-y-4">
            {/* Tabs */}
            <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
                <button
                    onClick={() => setActiveTab("metrics")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "metrics"
                            ? "border-orange-500 text-orange-600 dark:text-orange-400"
                            : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        }`}
                >
                    Metrics ({data.metrics.length})
                </button>
                <button
                    onClick={() => setActiveTab("kpis")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "kpis"
                            ? "border-orange-500 text-orange-600 dark:text-orange-400"
                            : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        }`}
                >
                    KPIs ({data.kpis.length})
                </button>
            </div>

            {/* Metrics Tab */}
            {activeTab === "metrics" && (
                <>
                    <div className="flex justify-end">
                        <Button size="sm" onClick={() => setShowCreateMetric(true)}>
                            + New Metric
                        </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                        {data.metrics.map((metric) => (
                            <button
                                key={metric.id}
                                onClick={() => openMetric(metric.id)}
                                className="text-left p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-orange-300 dark:hover:border-orange-700 transition-colors"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span>📊</span>
                                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{metric.name}</span>
                                </div>
                                <p className="text-sm text-zinc-500 mb-2 line-clamp-1">{metric.description || "No description"}</p>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-600 dark:text-zinc-400">
                                        Current: {metric.currentValue?.toFixed(1) ?? "—"} {metric.unit}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </>
            )}

            {/* KPIs Tab */}
            {activeTab === "kpis" && (
                <>
                    <div className="flex justify-end">
                        <Button size="sm" onClick={() => setShowCreateKPI(true)}>
                            + New KPI
                        </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                        {data.kpis.map((kpi) => {
                            const metric = data.metrics.find((m) => m.id === kpi.metricId);
                            const objective = data.objectives.find((o) => o.id === kpi.objectiveId);
                            const progress = metric?.currentValue !== undefined
                                ? (metric.currentValue / kpi.targetValue) * 100
                                : 0;
                            const progressColor = progress >= 80 ? "bg-green-500" : progress >= 50 ? "bg-yellow-500" : "bg-red-500";

                            return (
                                <button
                                    key={kpi.id}
                                    onClick={() => openKPI(kpi.id)}
                                    className="text-left p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-orange-300 dark:hover:border-orange-700 transition-colors"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span>{kpi.direction === "increase" ? "📈" : kpi.direction === "decrease" ? "📉" : "➡️"}</span>
                                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{metric?.name ?? "Unknown"}</span>
                                    </div>
                                    {objective && (
                                        <p className="text-xs text-zinc-500 mb-2">🎯 {objective.title}</p>
                                    )}
                                    <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mb-2">
                                        <div className={`h-full ${progressColor}`} style={{ width: `${Math.min(100, progress)}%` }} />
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-zinc-500">
                                        <span>{metric?.currentValue?.toFixed(1) ?? "—"}</span>
                                        <span>Target: {kpi.targetValue} {metric?.unit}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Metric Detail Panel */}
            <EntityDetailPanel
                isOpen={selectedMetric !== null}
                onClose={() => setSelectedMetric(null)}
                title={`Metric: ${data.metrics.find((m) => m.id === selectedMetric)?.name ?? ""}`}
                isEditing={isEditing}
                onEditToggle={() => setIsEditing(!isEditing)}
                onSave={handleSaveMetric}
                onDelete={handleDeleteMetric}
            >
                {isEditing ? (
                    <>
                        <FormField label="Name"><TextInput value={editMetricForm.name ?? ""} onChange={(v) => setEditMetricForm({ ...editMetricForm, name: v })} /></FormField>
                        <FormField label="Description"><TextArea value={editMetricForm.description ?? ""} onChange={(v) => setEditMetricForm({ ...editMetricForm, description: v })} /></FormField>
                        <FormField label="Unit"><TextInput value={editMetricForm.unit ?? ""} onChange={(v) => setEditMetricForm({ ...editMetricForm, unit: v })} /></FormField>
                        <FormField label="Current Value"><NumberInput value={editMetricForm.currentValue} onChange={(v) => setEditMetricForm({ ...editMetricForm, currentValue: v })} step={0.1} /></FormField>
                        <FormField label="Source"><TextInput value={editMetricForm.source ?? ""} onChange={(v) => setEditMetricForm({ ...editMetricForm, source: v })} /></FormField>
                    </>
                ) : (
                    <>
                        <DisplayField label="Name" value={editMetricForm.name} />
                        <DisplayField label="Description" value={editMetricForm.description} />
                        <DisplayField label="Unit" value={editMetricForm.unit} />
                        <DisplayField label="Current Value" value={editMetricForm.currentValue} />
                        <DisplayField label="Source" value={editMetricForm.source} />
                    </>
                )}
            </EntityDetailPanel>

            {/* KPI Detail Panel */}
            <EntityDetailPanel
                isOpen={selectedKPI !== null}
                onClose={() => setSelectedKPI(null)}
                title={`KPI: ${data.metrics.find((m) => m.id === data.kpis.find((k) => k.id === selectedKPI)?.metricId)?.name ?? ""}`}
                isEditing={isEditing}
                onEditToggle={() => setIsEditing(!isEditing)}
                onSave={handleSaveKPI}
                onDelete={handleDeleteKPI}
            >
                {isEditing ? (
                    <>
                        <FormField label="Metric">
                            <SelectInput value={editKPIForm.metricId ?? ""} onChange={(v) => setEditKPIForm({ ...editKPIForm, metricId: v })} options={data.metrics.map((m) => ({ value: m.id, label: m.name }))} />
                        </FormField>
                        <FormField label="Objective (Optional)">
                            <SelectInput value={editKPIForm.objectiveId ?? ""} onChange={(v) => setEditKPIForm({ ...editKPIForm, objectiveId: v || undefined })} options={[{ value: "", label: "None" }, ...data.objectives.map((o) => ({ value: o.id, label: o.title }))]} />
                        </FormField>
                        <FormField label="Target Value"><NumberInput value={editKPIForm.targetValue} onChange={(v) => setEditKPIForm({ ...editKPIForm, targetValue: v ?? 0 })} step={0.1} /></FormField>
                        <FormField label="Direction">
                            <SelectInput value={editKPIForm.direction ?? "increase"} onChange={(v) => setEditKPIForm({ ...editKPIForm, direction: v as KPI["direction"] })} options={[{ value: "increase", label: "Increase ↑" }, { value: "decrease", label: "Decrease ↓" }, { value: "maintain", label: "Maintain →" }]} />
                        </FormField>
                    </>
                ) : (
                    <>
                        <DisplayField label="Metric" value={data.metrics.find((m) => m.id === editKPIForm.metricId)?.name} />
                        <DisplayField label="Objective" value={data.objectives.find((o) => o.id === editKPIForm.objectiveId)?.title} />
                        <DisplayField label="Target Value" value={editKPIForm.targetValue} />
                        <DisplayField label="Direction" value={editKPIForm.direction} />
                    </>
                )}
            </EntityDetailPanel>

            {/* Create Metric Panel */}
            <EntityDetailPanel isOpen={showCreateMetric} onClose={() => setShowCreateMetric(false)} title="Create New Metric" isEditing={true} onSave={handleCreateMetric}>
                <FormField label="Name"><TextInput value={newMetric.name} onChange={(v) => setNewMetric({ ...newMetric, name: v })} placeholder="Metric name" /></FormField>
                <FormField label="Description"><TextArea value={newMetric.description ?? ""} onChange={(v) => setNewMetric({ ...newMetric, description: v })} /></FormField>
                <FormField label="Unit"><TextInput value={newMetric.unit} onChange={(v) => setNewMetric({ ...newMetric, unit: v })} placeholder="e.g., hours, %, count" /></FormField>
                <FormField label="Current Value"><NumberInput value={newMetric.currentValue} onChange={(v) => setNewMetric({ ...newMetric, currentValue: v })} /></FormField>
                <FormField label="Source"><TextInput value={newMetric.source ?? ""} onChange={(v) => setNewMetric({ ...newMetric, source: v })} placeholder="Data source" /></FormField>
            </EntityDetailPanel>

            {/* Create KPI Panel */}
            <EntityDetailPanel isOpen={showCreateKPI} onClose={() => setShowCreateKPI(false)} title="Create New KPI" isEditing={true} onSave={handleCreateKPI}>
                <FormField label="Metric">
                    <SelectInput value={newKPI.metricId} onChange={(v) => setNewKPI({ ...newKPI, metricId: v })} options={[{ value: "", label: "Select metric..." }, ...data.metrics.map((m) => ({ value: m.id, label: m.name }))]} />
                </FormField>
                <FormField label="Objective (Optional)">
                    <SelectInput value={newKPI.objectiveId ?? ""} onChange={(v) => setNewKPI({ ...newKPI, objectiveId: v || undefined })} options={[{ value: "", label: "None" }, ...data.objectives.map((o) => ({ value: o.id, label: o.title }))]} />
                </FormField>
                <FormField label="Target Value"><NumberInput value={newKPI.targetValue} onChange={(v) => setNewKPI({ ...newKPI, targetValue: v ?? 0 })} /></FormField>
                <FormField label="Direction">
                    <SelectInput value={newKPI.direction} onChange={(v) => setNewKPI({ ...newKPI, direction: v as KPI["direction"] })} options={[{ value: "increase", label: "Increase ↑" }, { value: "decrease", label: "Decrease ↓" }, { value: "maintain", label: "Maintain →" }]} />
                </FormField>
            </EntityDetailPanel>
        </div>
    );
}
