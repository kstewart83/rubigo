"use client";

import { useState, useMemo } from "react";
import { useProjectData } from "@/contexts/project-data-context";
import type { Feature, Rule, Scenario, Specification, Objective } from "@/types/project";
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

interface FeatureWithRequirements extends Feature {
    rules: (Rule & { scenarios: Scenario[] })[];
    specifications: Specification[];
    objective?: Objective;
}

// ============================================================================
// Main Component
// ============================================================================

export function FeaturesListWithCRUD() {
    const { data } = useProjectData();

    const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
    const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());
    const [filterObjective, setFilterObjective] = useState<string>("");
    const [filterStatus, setFilterStatus] = useState<string>("");

    // Build features with their requirements
    const featuresWithRequirements = useMemo((): FeatureWithRequirements[] => {
        return data.features.map((feature) => {
            const featureRules = data.rules.filter((r) => r.featureId === feature.id);
            const featureSpecs = data.specifications.filter((s) => s.featureId === feature.id);
            const objective = data.objectives.find((o) => o.id === feature.objectiveId);

            return {
                ...feature,
                rules: featureRules.map((rule) => ({
                    ...rule,
                    scenarios: data.scenarios.filter((s) => s.ruleId === rule.id),
                })),
                specifications: featureSpecs,
                objective,
            };
        });
    }, [data.features, data.rules, data.scenarios, data.specifications, data.objectives]);

    // Filter features
    const filteredFeatures = useMemo(() => {
        return featuresWithRequirements.filter((f) => {
            if (filterObjective && f.objectiveId !== filterObjective) return false;
            if (filterStatus && f.status !== filterStatus) return false;
            return true;
        });
    }, [featuresWithRequirements, filterObjective, filterStatus]);

    // Group features by objective
    const featuresByObjective = useMemo(() => {
        const grouped = new Map<string, FeatureWithRequirements[]>();

        for (const feature of filteredFeatures) {
            const objectiveId = feature.objectiveId || "unassigned";
            if (!grouped.has(objectiveId)) {
                grouped.set(objectiveId, []);
            }
            grouped.get(objectiveId)!.push(feature);
        }

        return grouped;
    }, [filteredFeatures]);

    // Get unique objectives for filter
    const objectiveOptions = useMemo(() => {
        const objectives = data.objectives.filter((o) =>
            data.features.some((f) => f.objectiveId === o.id)
        );
        return [
            { value: "", label: "All Objectives" },
            ...objectives.map((o) => ({ value: o.id, label: o.title })),
        ];
    }, [data.objectives, data.features]);

    const statusOptions = [
        { value: "", label: "All Status" },
        { value: "planned", label: "Planned" },
        { value: "in_progress", label: "In Progress" },
        { value: "complete", label: "Complete" },
        { value: "cancelled", label: "Cancelled" },
    ];

    const toggleRule = (ruleId: string) => {
        setExpandedRules((prev) => {
            const next = new Set(prev);
            if (next.has(ruleId)) {
                next.delete(ruleId);
            } else {
                next.add(ruleId);
            }
            return next;
        });
    };

    const selectedFeatureData = useMemo(() => {
        return featuresWithRequirements.find((f) => f.id === selectedFeature);
    }, [featuresWithRequirements, selectedFeature]);

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4 items-center">
                <div className="flex-1 max-w-xs">
                    <SelectInput
                        value={filterObjective}
                        onChange={setFilterObjective}
                        options={objectiveOptions}
                    />
                </div>
                <div className="flex-1 max-w-xs">
                    <SelectInput
                        value={filterStatus}
                        onChange={setFilterStatus}
                        options={statusOptions}
                    />
                </div>
                <div className="flex gap-4 text-sm text-zinc-500 ml-auto">
                    <span>{filteredFeatures.length} features</span>
                    <span>📜 {data.rules.length} rules</span>
                    <span>🎬 {data.scenarios.length} scenarios</span>
                    <span>📋 {data.specifications.length} specs</span>
                </div>
            </div>

            {/* Features grouped by Objective */}
            <div className="space-y-6">
                {Array.from(featuresByObjective.entries()).map(([objectiveId, features]) => {
                    const objective = data.objectives.find((o) => o.id === objectiveId);

                    return (
                        <div
                            key={objectiveId}
                            className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden"
                        >
                            {/* Objective Header */}
                            <div className="bg-zinc-50 dark:bg-zinc-900 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">🎯</span>
                                    <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                                        {objective?.title || "Unassigned Features"}
                                    </h2>
                                    <span className="text-xs text-zinc-500 ml-auto">
                                        {features.length} feature{features.length !== 1 ? "s" : ""}
                                    </span>
                                </div>
                            </div>

                            {/* Features */}
                            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {features.map((feature) => (
                                    <button
                                        key={feature.id}
                                        onClick={() => setSelectedFeature(feature.id)}
                                        className="w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">⚡</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                                        {feature.name}
                                                    </span>
                                                    <StatusBadge status={feature.status} />
                                                </div>
                                                {feature.description && (
                                                    <p className="text-sm text-zinc-500 truncate mt-0.5">
                                                        {feature.description}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex gap-3 text-xs text-zinc-400 shrink-0">
                                                <span title="Rules">📜 {feature.rules.length}</span>
                                                <span title="Scenarios">🎬 {feature.rules.reduce((sum, r) => sum + r.scenarios.length, 0)}</span>
                                                <span title="Specifications">📋 {feature.specifications.length}</span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {featuresByObjective.size === 0 && (
                    <div className="text-center py-12 text-zinc-500">
                        <p>No features found matching the current filters.</p>
                    </div>
                )}
            </div>

            {/* Feature Detail Panel */}
            <EntityDetailPanel
                isOpen={selectedFeature !== null}
                onClose={() => setSelectedFeature(null)}
                title={selectedFeatureData?.name ?? ""}
                isEditing={false}
            >
                {selectedFeatureData && (
                    <div className="space-y-6">
                        {/* Basic Info */}
                        <div className="space-y-3">
                            <DisplayField label="Description" value={selectedFeatureData.description} />
                            <DisplayField label="Status" value={selectedFeatureData.status} />
                            <DisplayField label="Objective" value={selectedFeatureData.objective?.title} />
                            <DisplayField label="ID" value={selectedFeatureData.id} />
                        </div>

                        {/* Rules Section */}
                        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
                                <span>📜</span> Rules (User Stories)
                                <span className="text-xs font-normal text-zinc-500">
                                    {selectedFeatureData.rules.length} total
                                </span>
                            </h3>

                            {selectedFeatureData.rules.length === 0 ? (
                                <p className="text-sm text-zinc-500 italic">No rules defined</p>
                            ) : (
                                <div className="space-y-3">
                                    {selectedFeatureData.rules.map((rule) => (
                                        <div
                                            key={rule.id}
                                            className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800"
                                        >
                                            <button
                                                onClick={() => toggleRule(rule.id)}
                                                className="w-full text-left"
                                            >
                                                <div className="flex items-start gap-2">
                                                    <span className={`transition-transform ${expandedRules.has(rule.id) ? "rotate-90" : ""}`}>
                                                        ▶
                                                    </span>
                                                    <div className="flex-1">
                                                        <p className="text-sm text-zinc-900 dark:text-zinc-100">
                                                            <span className="text-zinc-500">As a</span>{" "}
                                                            <span className="font-medium text-blue-600 dark:text-blue-400">{rule.role}</span>
                                                            <span className="text-zinc-500">, I want to</span>{" "}
                                                            <span className="font-medium">{rule.requirement}</span>
                                                            <span className="text-zinc-500">, so I can</span>{" "}
                                                            <span className="font-medium text-green-600 dark:text-green-400">{rule.reason}</span>
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                                                            <StatusBadge status={rule.status} />
                                                            <span>🎬 {rule.scenarios.length} scenarios</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>

                                            {/* Expanded Scenarios */}
                                            {expandedRules.has(rule.id) && rule.scenarios.length > 0 && (
                                                <div className="mt-3 ml-6 space-y-2">
                                                    <p className="text-xs font-medium text-zinc-500 uppercase">Scenarios</p>
                                                    {rule.scenarios.map((scenario) => (
                                                        <div
                                                            key={scenario.id}
                                                            className="bg-white dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-700 p-2"
                                                        >
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span>🎬</span>
                                                                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                                                    {scenario.name}
                                                                </span>
                                                                <StatusBadge status={scenario.status} />
                                                            </div>
                                                            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-mono whitespace-pre-wrap">
                                                                {scenario.narrative}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Specifications Section */}
                        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
                                <span>📋</span> Specifications (NFRs)
                                <span className="text-xs font-normal text-zinc-500">
                                    {selectedFeatureData.specifications.length} total
                                </span>
                            </h3>

                            {selectedFeatureData.specifications.length === 0 ? (
                                <p className="text-sm text-zinc-500 italic">No specifications defined</p>
                            ) : (
                                <div className="space-y-2">
                                    {selectedFeatureData.specifications.map((spec) => (
                                        <div
                                            key={spec.id}
                                            className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800"
                                        >
                                            <div className="flex items-start gap-2">
                                                <CategoryBadge category={spec.category} />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                                        {spec.name}
                                                    </p>
                                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                                                        {spec.narrative}
                                                    </p>
                                                    <div className="mt-1">
                                                        <StatusBadge status={spec.status} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </EntityDetailPanel>
        </div>
    );
}

// ============================================================================
// Sub-components
// ============================================================================

function StatusBadge({ status }: { status: string }) {
    const statusStyles: Record<string, string> = {
        planned: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
        in_progress: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
        complete: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
        cancelled: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
        draft: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
        active: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
        deprecated: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
    };

    return (
        <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyles[status] ?? statusStyles.draft}`}>
            {status.replace("_", " ")}
        </span>
    );
}

function CategoryBadge({ category }: { category: string }) {
    const categoryStyles: Record<string, { bg: string; icon: string }> = {
        performance: { bg: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400", icon: "⚡" },
        security: { bg: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400", icon: "🔒" },
        usability: { bg: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400", icon: "👆" },
        reliability: { bg: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400", icon: "✓" },
        accessibility: { bg: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400", icon: "♿" },
        maintainability: { bg: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400", icon: "🔧" },
    };

    const style = categoryStyles[category] ?? { bg: "bg-zinc-100 text-zinc-600", icon: "📋" };

    return (
        <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${style.bg}`}>
            <span>{style.icon}</span>
            <span>{category}</span>
        </span>
    );
}
