/**
 * Agent List Panel - Displays list of AI agents with dynamic classification
 * 
 * Shows agents with their status, last activity, and activation controls.
 * Classification banners are dynamically determined by agent ACO.
 */

"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AgentStatusIndicator } from "./agent-status-indicator";
import { SecureTableWrapper } from "./secure-table-wrapper";
import { AgentBadge } from "./agent-badge";
import { Play } from "lucide-react";
import type { AgentStatus } from "@/db/schema";
import type { SensitivityLevel } from "@/lib/access-control/types";

// Helper to parse ACO JSON
function parseAco(aco?: string | null): { sensitivity: SensitivityLevel; compartments: string[] } {
    if (!aco) return { sensitivity: "low", compartments: [] };
    try {
        const parsed = JSON.parse(aco);
        return {
            sensitivity: parsed.sensitivity || "low",
            compartments: parsed.compartments || [],
        };
    } catch {
        return { sensitivity: "low", compartments: [] };
    }
}

export interface AgentInfo {
    id: string;
    name: string;
    department?: string;
    status: AgentStatus;
    pendingActions: number;
    lastActivity: string;
    aco?: string; // JSON: {sensitivity, compartments?[]}
}

export interface AgentListPanelProps {
    agents: AgentInfo[];
    onActivate?: (agentId: string) => void;
    onSelectAgent?: (agentId: string) => void;
    className?: string;
}

/**
 * List panel for displaying agents with dynamic classification
 */
export function AgentListPanel({
    agents,
    onActivate,
    onSelectAgent,
    className,
}: AgentListPanelProps) {
    return (
        <SecureTableWrapper
            items={agents}
            getSensitivity={(agent) => parseAco(agent.aco).sensitivity}
            getTenants={(agent) => parseAco(agent.aco).compartments}
            defaultLevel="low"
            className={cn("rounded-lg overflow-hidden", className)}
        >
            <div className="p-2">
                {/* Header */}
                <div className="flex items-center gap-2 mb-2 px-1">
                    <span className="text-lg font-semibold">Agents</span>
                    <span className="text-sm text-muted-foreground">({agents.length})</span>
                    <AgentBadge size="xs" />
                </div>
                {/* Column Headers */}
                {agents.length > 0 && (
                    <div className="flex items-center px-2 py-1 text-xs text-muted-foreground border-b mb-1">
                        <span className="flex-1">Name</span>
                        <span className="w-24 text-center">Department</span>
                        <span className="w-20 text-center">Status</span>
                        <span className="w-20 text-center">Action</span>
                    </div>
                )}
                <div className="space-y-1 max-h-64 overflow-y-auto overflow-x-hidden">
                    {agents.map((agent) => (
                        <AgentListItem
                            key={agent.id}
                            agent={agent}
                            onClick={() => onSelectAgent?.(agent.id)}
                            onActivate={() => onActivate?.(agent.id)}
                        />
                    ))}
                    {agents.length === 0 && (
                        <div className="text-sm text-muted-foreground text-center py-4">
                            No agents configured
                        </div>
                    )}
                </div>
            </div>
        </SecureTableWrapper>
    );
}

function AgentListItem({
    agent,
    onClick,
    onActivate,
}: {
    agent: AgentInfo;
    onClick?: () => void;
    onActivate?: () => void;
}) {
    const lastActive = new Date(agent.lastActivity).toLocaleTimeString();

    // Status display text and colors
    const statusConfig: Record<AgentStatus, { text: string; color: string }> = {
        dormant: { text: "Dormant", color: "text-gray-400" },
        active: { text: "Active", color: "text-green-400" },
    };

    const { text: statusText, color: statusColor } = statusConfig[agent.status] || statusConfig.dormant;

    return (
        <div
            className={cn(
                "w-full flex items-center p-2 rounded-lg",
                "bg-muted/50 hover:bg-muted transition-colors"
            )}
        >
            <button
                onClick={onClick}
                className="flex-1 flex items-center gap-2 text-left min-w-0"
            >
                <AgentStatusIndicator status={agent.status} showLabel={false} size="sm" />
                <span className="font-medium text-sm truncate">{agent.name}</span>
            </button>
            <div className="w-24 flex-shrink-0 text-center text-xs text-muted-foreground truncate">
                {agent.department || "—"}
            </div>
            <div className={cn("w-20 flex-shrink-0 text-center text-xs font-medium", statusColor)}>
                {statusText}
            </div>
            <div className="w-20 flex-shrink-0 text-center">
                {agent.status === "dormant" ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onActivate?.();
                        }}
                        className="h-6 px-2 text-xs text-green-500 hover:text-green-400 hover:bg-green-500/10"
                    >
                        <Play className="h-3 w-3 mr-1" /> Activate
                    </Button>
                ) : (
                    <span className="text-xs text-muted-foreground">{lastActive}</span>
                )}
            </div>
        </div>
    );
}
