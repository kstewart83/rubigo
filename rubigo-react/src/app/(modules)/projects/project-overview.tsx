"use client";

import { useState } from "react";
import type {
    Service,
    Project,
    Objective,
    Initiative,
    KPIWithMetric,
    AssignmentWithCapacity,
} from "@/types/project";

interface ProjectOverviewProps {
    services: Service[];
    projects: Project[];
    objectives: Objective[];
    kpis: KPIWithMetric[];
    initiatives: Initiative[];
    capacityGaps: AssignmentWithCapacity[];
}

export function ProjectOverview({
    services,
    projects,
    objectives,
    kpis,
    initiatives,
    capacityGaps,
}: ProjectOverviewProps) {
    const [expandedObjectives, setExpandedObjectives] = useState<Set<string>>(new Set());

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

    // Get KPIs for a specific objective
    const getKPIsForObjective = (objectiveId: string) =>
        kpis.filter((k) => k.objectiveId === objectiveId);

    // Get initiatives for a specific KPI
    const getInitiativesForKPI = (kpiId: string) =>
        initiatives.filter((i) => i.kpiId === kpiId);

    return (
        <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="Services"
                    value={services.length}
                    icon="🏢"
                />
                <StatCard
                    label="Active Projects"
                    value={projects.filter((p) => p.status === "active").length}
                    icon="📁"
                />
                <StatCard
                    label="Objectives"
                    value={objectives.length}
                    icon="🎯"
                />
                <StatCard
                    label="Capacity Gaps"
                    value={capacityGaps.length}
                    icon="⚠️"
                    variant={capacityGaps.length > 0 ? "warning" : "default"}
                />
            </div>

            {/* Service & Project Overview */}
            {services.map((service) => {
                const serviceProjects = projects.filter((p) => p.serviceId === service.id);

                return (
                    <div
                        key={service.id}
                        className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden"
                    >
                        {/* Service Header */}
                        <div className="bg-zinc-50 dark:bg-zinc-900 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🏢</span>
                                <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                                    {service.name}
                                </h2>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${service.status === "catalog"
                                        ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                                        : service.status === "pipeline"
                                            ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                                    }`}>
                                    {service.status}
                                </span>
                            </div>
                            {service.description && (
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                                    {service.description}
                                </p>
                            )}
                        </div>

                        {/* Projects */}
                        {serviceProjects.map((project) => {
                            const projectObjectives = objectives.filter(
                                (o) => o.projectId === project.id
                            );

                            return (
                                <div key={project.id} className="border-b border-zinc-200 dark:border-zinc-800 last:border-b-0">
                                    {/* Project Header */}
                                    <div className="px-4 py-3 bg-white dark:bg-zinc-950">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">📁</span>
                                                <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                                                    {project.name}
                                                </h3>
                                                <StatusBadge status={project.status} />
                                            </div>
                                            {project.startDate && project.endDate && (
                                                <span className="text-xs text-zinc-500">
                                                    {project.startDate} → {project.endDate}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Objectives (Accordion) */}
                                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                        {projectObjectives.map((objective) => {
                                            const isExpanded = expandedObjectives.has(objective.id);
                                            const objectiveKPIs = getKPIsForObjective(objective.id);

                                            return (
                                                <div key={objective.id}>
                                                    {/* Objective Row */}
                                                    <button
                                                        onClick={() => toggleObjective(objective.id)}
                                                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-left"
                                                    >
                                                        <span className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}>
                                                            ▶
                                                        </span>
                                                        <span className="text-lg">🎯</span>
                                                        <span className="flex-1 text-zinc-900 dark:text-zinc-100">
                                                            {objective.title}
                                                        </span>
                                                        <span className="text-xs text-zinc-500">
                                                            {objectiveKPIs.length} KPI{objectiveKPIs.length !== 1 ? "s" : ""}
                                                        </span>
                                                        <StatusBadge status={objective.status} />
                                                    </button>

                                                    {/* Expanded: KPIs & Initiatives */}
                                                    {isExpanded && (
                                                        <div className="bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3 pl-12 space-y-3">
                                                            {objectiveKPIs.length === 0 ? (
                                                                <p className="text-sm text-zinc-500 italic">
                                                                    No KPIs linked to this objective
                                                                </p>
                                                            ) : (
                                                                objectiveKPIs.map((kpi) => {
                                                                    const kpiInitiatives = getInitiativesForKPI(kpi.id);
                                                                    return (
                                                                        <KPICard
                                                                            key={kpi.id}
                                                                            kpi={kpi}
                                                                            initiatives={kpiInitiatives}
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
                                    {gap.activity.name} ({gap.role.name})
                                </span>
                                <span className="text-orange-600 dark:text-orange-400 font-mono">
                                    -{gap.capacityGap.toFixed(1)} {gap.unit}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
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
        complete: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
        in_progress: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
        planned: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
        backlog: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
        draft: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
        blocked: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
        achieved: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
        deferred: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    };

    return (
        <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyles[status] ?? statusStyles.draft}`}>
            {status.replace("_", " ")}
        </span>
    );
}

function KPICard({
    kpi,
    initiatives,
}: {
    kpi: KPIWithMetric;
    initiatives: Initiative[];
}) {
    const progressColor =
        kpi.percentComplete !== undefined
            ? kpi.percentComplete >= 80
                ? "bg-green-500"
                : kpi.percentComplete >= 50
                    ? "bg-yellow-500"
                    : "bg-red-500"
            : "bg-zinc-300";

    const directionIcon =
        kpi.direction === "increase" ? "📈" : kpi.direction === "decrease" ? "📉" : "➡️";

    return (
        <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span>{directionIcon}</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {kpi.metric.name}
                    </span>
                </div>
                <span className="text-sm text-zinc-500">
                    {kpi.currentValue?.toFixed(1) ?? "—"} / {kpi.targetValue} {kpi.metric.unit}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mb-2">
                <div
                    className={`h-full ${progressColor} transition-all`}
                    style={{ width: `${Math.min(100, kpi.percentComplete ?? 0)}%` }}
                />
            </div>

            {/* Initiatives */}
            {initiatives.length > 0 && (
                <div className="mt-2 space-y-1">
                    <span className="text-xs text-zinc-500">Initiatives:</span>
                    {initiatives.map((initiative) => (
                        <div
                            key={initiative.id}
                            className="flex items-center gap-2 text-sm pl-2"
                        >
                            <span>🚀</span>
                            <span className="text-zinc-700 dark:text-zinc-300">
                                {initiative.name}
                            </span>
                            <StatusBadge status={initiative.status} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
