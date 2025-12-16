"use client";

import { useState, useMemo } from "react";
import { useActionLog } from "@/contexts/action-log-context";
import type { ActionType, EntityType } from "@/types/logs";
import { Button } from "@/components/ui/button";

const ACTION_COLORS: Record<ActionType, string> = {
    create: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    read: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
    update: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    delete: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

const ACTION_ICONS: Record<ActionType, string> = {
    create: "➕",
    read: "👁️",
    update: "✏️",
    delete: "🗑️",
};

const ENTITY_ICONS: Record<EntityType, string> = {
    service: "🔧",
    project: "📁",
    objective: "🎯",
    feature: "⚡",
    metric: "📊",
    kpi: "📈",
    initiative: "🚀",
    activity: "📋",
    role: "👤",
    assignment: "📌",
    allocation: "⏰",
};

export function ActionLogList() {
    const { logs } = useActionLog();
    const [filterAction, setFilterAction] = useState<ActionType | "all">("all");
    const [filterEntity, setFilterEntity] = useState<EntityType | "all">("all");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            if (filterAction !== "all" && log.action !== filterAction) return false;
            if (filterEntity !== "all" && log.entityType !== filterEntity) return false;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    log.operationId.toLowerCase().includes(query) ||
                    log.entityId.toLowerCase().includes(query) ||
                    log.actorName.toLowerCase().includes(query)
                );
            }
            return true;
        });
    }, [logs, filterAction, filterEntity, searchQuery]);

    const formatTimestamp = (iso: string) => {
        const date = new Date(iso);
        return date.toLocaleString();
    };

    const formatTimeAgo = (iso: string) => {
        const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
        if (seconds < 60) return "just now";
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm flex-1 min-w-[200px]"
                />

                <select
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value as ActionType | "all")}
                    className="px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                >
                    <option value="all">All Actions</option>
                    <option value="create">Create</option>
                    <option value="update">Update</option>
                    <option value="delete">Delete</option>
                </select>

                <select
                    value={filterEntity}
                    onChange={(e) => setFilterEntity(e.target.value as EntityType | "all")}
                    className="px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                >
                    <option value="all">All Entities</option>
                    <option value="service">Service</option>
                    <option value="project">Project</option>
                    <option value="objective">Objective</option>
                    <option value="feature">Feature</option>
                    <option value="metric">Metric</option>
                    <option value="kpi">KPI</option>
                    <option value="initiative">Initiative</option>
                    <option value="activity">Activity</option>
                </select>

                <span className="text-sm text-zinc-500">
                    {filteredLogs.length} of {logs.length} logs
                </span>
            </div>

            {/* Log List */}
            {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                    <p className="text-4xl mb-4">📋</p>
                    <p className="font-medium">No action logs yet</p>
                    <p className="text-sm">Actions will appear here as you create, update, or delete entities</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredLogs.map((log) => (
                        <div
                            key={log.id}
                            className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">
                                        {ENTITY_ICONS[log.entityType] || "📄"}
                                    </span>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`text-xs px-2 py-0.5 rounded-full ${ACTION_COLORS[log.action]}`}
                                            >
                                                {ACTION_ICONS[log.action]} {log.action}
                                            </span>
                                            <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                                {log.entityType}
                                            </span>
                                            <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                                {log.entityId}
                                            </code>
                                        </div>
                                        <p className="text-sm text-zinc-500 mt-1">
                                            <span className="font-medium text-zinc-600 dark:text-zinc-400">
                                                {log.actorName}
                                            </span>
                                            {" · "}
                                            <code className="text-xs">{log.operationId}</code>
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right text-sm text-zinc-500">
                                    <p>{formatTimeAgo(log.timestamp)}</p>
                                    <p className="text-xs">{formatTimestamp(log.timestamp)}</p>
                                </div>
                            </div>

                            {/* Changes for update actions */}
                            {log.changes && log.changes.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                    <p className="text-xs font-medium text-zinc-500 mb-2">Changes:</p>
                                    <div className="space-y-1">
                                        {log.changes.map((change, idx) => (
                                            <div key={idx} className="text-xs font-mono">
                                                <span className="text-zinc-500">{change.field}:</span>{" "}
                                                <span className="text-red-600 dark:text-red-400 line-through">
                                                    {JSON.stringify(change.oldValue)}
                                                </span>
                                                {" → "}
                                                <span className="text-green-600 dark:text-green-400">
                                                    {JSON.stringify(change.newValue)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
