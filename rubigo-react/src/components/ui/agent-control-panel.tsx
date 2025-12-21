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
import type { AgentStatus } from "@/db/schema";

export interface AgentInfo {
    id: string;
    name: string;
    status: AgentStatus;
    pendingActions: number;
    lastActivity: string;
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
    onSelectAgent,
    className,
}: AgentControlPanelProps) {
    const [expanded, setExpanded] = useState(true);

    const activeAgents = agents.filter(a => a.status !== "dormant").length;
    const workingAgents = agents.filter(a => a.status === "working").length;

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
                        <AgentBadge size="sm" />
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
                        <div>
                            <span className="text-muted-foreground">Working:</span>
                            <span className="ml-2 font-medium text-amber-400">
                                {workingAgents}
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
                            disabled={!simulation.running}
                        >
                            ⏭ Tick
                        </Button>
                    </div>

                    {/* Agent List */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">
                            Agents
                        </h4>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                            {agents.map((agent) => (
                                <AgentListItem
                                    key={agent.id}
                                    agent={agent}
                                    onClick={() => onSelectAgent?.(agent.id)}
                                />
                            ))}
                            {agents.length === 0 && (
                                <div className="text-sm text-muted-foreground text-center py-4">
                                    No agents configured
                                </div>
                            )}
                        </div>
                    </div>

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
}: {
    agent: AgentInfo;
    onClick?: () => void;
}) {
    const lastActive = new Date(agent.lastActivity).toLocaleTimeString();

    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center justify-between p-2 rounded-lg",
                "bg-muted/50 hover:bg-muted transition-colors",
                "text-left"
            )}
        >
            <div className="flex items-center gap-2">
                <AgentStatusIndicator status={agent.status} showLabel={false} size="sm" />
                <span className="font-medium text-sm">{agent.name}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {agent.pendingActions > 0 && (
                    <span className="bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                        {agent.pendingActions} pending
                    </span>
                )}
                <span>{lastActive}</span>
            </div>
        </button>
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
