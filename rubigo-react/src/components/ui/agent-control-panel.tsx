/**
 * Agent Control Panel - Dev/demo interface for controlling agent simulation
 */

"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentStatusIndicator } from "./agent-status-indicator";
import { AgentBadge } from "./agent-badge";
import { SecureTableWrapper } from "./secure-table-wrapper";
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
    status: AgentStatus;
    pendingActions: number;
    lastActivity: string;
    aco?: string; // JSON: {sensitivity, compartments?[]}
}

export interface SimulationState {
    running: boolean;
    ollamaAvailable: boolean;
    ollamaModel?: string;
    tickRateMs: number;
    totalTicks: number;
}

export interface AgentControlPanelProps {
    agents: AgentInfo[];
    simulation: SimulationState;
    onStart?: () => void;
    onStop?: () => void;
    onTick?: () => void;
    onReset?: () => void;
    onActivate?: (agentId: string) => void;
    onSelectAgent?: (agentId: string) => void;
    className?: string;
}

/**
 * Control panel for managing agent simulation
 */
export function AgentControlPanel({
    agents,
    simulation,
    onStart,
    onStop,
    onTick,
    onReset,
    onActivate,
    onSelectAgent,
    className,
}: AgentControlPanelProps) {
    const [expanded, setExpanded] = useState(true);

    const activeAgents = agents.filter(a => a.status === "active").length;

    return (
        <Card
            className={cn(
                "border-purple-500/30 bg-card/95 backdrop-blur-sm",
                className
            )}
            data-testid="agent-control-panel"
        >
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">Agent Simulation</CardTitle>
                        <AgentBadge size="xs" />
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? "−" : "+"}
                    </Button>
                </div>
            </CardHeader>

            {expanded && (
                <CardContent className="space-y-4">
                    {/* Status Overview */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground">Status:</span>
                            <span
                                className={cn(
                                    "ml-2 font-medium",
                                    simulation.running ? "text-green-400" : "text-gray-400"
                                )}
                            >
                                {simulation.running ? "Running" : "Stopped"}
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Ollama:</span>
                            <span
                                className={cn(
                                    "ml-2 font-medium",
                                    simulation.ollamaAvailable ? "text-green-400" : "text-red-400"
                                )}
                            >
                                {simulation.ollamaAvailable ? "Connected" : "Unavailable"}
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Agents:</span>
                            <span className="ml-2 font-medium">
                                {activeAgents}/{agents.length} active
                            </span>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-2">
                        {simulation.running ? (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={onStop}
                                className="flex-1"
                            >
                                ⏹ Stop
                            </Button>
                        ) : (
                            <Button
                                variant="default"
                                size="sm"
                                onClick={onStart}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                disabled={!simulation.ollamaAvailable}
                            >
                                ▶ Start
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onTick}
                        >
                            ⏭ Tick
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onReset}
                            className="text-muted-foreground hover:text-destructive"
                        >
                            🗑 Reset
                        </Button>
                    </div>

                    {/* Agent List - wrapped with dynamic classification */}
                    <SecureTableWrapper
                        items={agents}
                        getSensitivity={(agent) => parseAco(agent.aco).sensitivity}
                        getTenants={(agent) => parseAco(agent.aco).compartments}
                        defaultLevel="low"
                        className="border rounded-lg overflow-hidden"
                    >
                        <div className="space-y-2 p-3">
                            <h4 className="text-sm font-medium text-muted-foreground">
                                Agents
                            </h4>
                            {/* Column Headers */}
                            {agents.length > 0 && (
                                <div className="flex items-center justify-between px-2 py-1 text-xs text-muted-foreground border-b">
                                    <span className="w-1/3">Name</span>
                                    <span className="w-1/4 text-center">Status</span>
                                    <span className="w-1/4 text-right">Last Activity</span>
                                </div>
                            )}
                            <div className="space-y-1 max-h-64 overflow-y-auto">
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

                    {/* Footer Info */}
                    {simulation.ollamaModel && (
                        <div className="text-xs text-muted-foreground text-center">
                            Model: {simulation.ollamaModel} •
                            Tick rate: {simulation.tickRateMs}ms •
                            Total ticks: {simulation.totalTicks}
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
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
                "w-full flex items-center justify-between p-2 rounded-lg",
                "bg-muted/50 hover:bg-muted transition-colors"
            )}
        >
            <button
                onClick={onClick}
                className="w-1/3 flex items-center gap-2 text-left"
            >
                <AgentStatusIndicator status={agent.status} showLabel={false} size="sm" />
                <span className="font-medium text-sm truncate">{agent.name}</span>
            </button>
            <div className={cn("w-1/6 text-center text-xs font-medium", statusColor)}>
                {statusText}
            </div>
            <div className="w-1/6 text-center">
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
                        ▶ Activate
                    </Button>
                ) : (
                    <span className="text-xs text-muted-foreground">{lastActive}</span>
                )}
            </div>
        </div>
    );
}

/**
 * Floating control panel for overlay use
 */
export function FloatingAgentControlPanel(props: AgentControlPanelProps) {
    return (
        <div className="fixed bottom-4 right-4 z-50 w-80">
            <AgentControlPanel {...props} />
        </div>
    );
}
