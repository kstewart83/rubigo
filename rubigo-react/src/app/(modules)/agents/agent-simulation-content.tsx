/**
 * Agent Simulation Content - Client component
 * Dev/demo interface for managing agent simulation
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { AgentControlPanel } from "@/components/ui/agent-control-panel";
import { AgentThoughtViewer } from "@/components/ui/agent-thought-viewer";
import type { AgentInfo, SimulationState } from "@/components/ui/agent-control-panel";
import type { ThoughtEntry } from "@/components/ui/agent-thought-viewer";
import type { AgentStatus } from "@/db/schema";

export function AgentSimulationContent() {
    const [agents, setAgents] = useState<AgentInfo[]>([]);
    const [simulation, setSimulation] = useState<SimulationState>({
        running: false,
        ollamaAvailable: false,
        tickRateMs: 1000,
        totalTicks: 0,
    });
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [thoughts, setThoughts] = useState<ThoughtEntry[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch agents and Ollama status
    const fetchStatus = useCallback(async () => {
        try {
            // Fetch Ollama health
            const healthRes = await fetch("/api/agents/ollama/health");
            const health = await healthRes.json();

            // Fetch agents
            const agentsRes = await fetch("/api/agents");
            const agentsData = await agentsRes.json();

            setSimulation(prev => ({
                ...prev,
                ollamaAvailable: health.available,
                ollamaModel: health.model,
            }));

            setAgents(
                (agentsData.agents || []).map((a: { id: string; name: string; status: AgentStatus }) => ({
                    id: a.id,
                    name: a.name,
                    status: a.status as AgentStatus,
                    pendingActions: 0,
                    lastActivity: new Date().toISOString(),
                }))
            );
        } catch (error) {
            console.error("Error fetching status:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch selected agent's events
    const fetchEvents = useCallback(async (agentId: string) => {
        try {
            const res = await fetch(`/api/agents/${agentId}/events?limit=50`);
            const data = await res.json();

            setThoughts(
                (data.events || []).map((e: {
                    id: string;
                    timestamp: string;
                    eventType: ThoughtEntry["eventType"];
                    content: string;
                    targetEntity?: string;
                }) => ({
                    id: e.id,
                    timestamp: e.timestamp,
                    agentName: agents.find(a => a.id === agentId)?.name || agentId,
                    eventType: e.eventType,
                    content: e.content,
                    targetEntity: e.targetEntity,
                }))
            );
        } catch (error) {
            console.error("Error fetching events:", error);
        }
    }, [agents]);

    // Initial load
    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    // Fetch events when agent selected
    useEffect(() => {
        if (selectedAgentId) {
            fetchEvents(selectedAgentId);
        }
    }, [selectedAgentId, fetchEvents]);

    // Polling when running
    useEffect(() => {
        if (simulation.running) {
            const interval = setInterval(fetchStatus, 2000);
            return () => clearInterval(interval);
        }
    }, [simulation.running, fetchStatus]);

    const handleStart = () => {
        setSimulation(prev => ({ ...prev, running: true }));
    };

    const handleStop = () => {
        setSimulation(prev => ({ ...prev, running: false }));
    };

    const handleTick = () => {
        setSimulation(prev => ({ ...prev, totalTicks: prev.totalTicks + 1 }));
        fetchStatus();
    };

    const selectedAgent = agents.find(a => a.id === selectedAgentId);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <div className="text-muted-foreground">Loading agent simulation...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            {/* Header */}
            <div className="flex-shrink-0 border-b px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Agent Simulation</h1>
                        <p className="text-muted-foreground text-sm">
                            Control and monitor AI agent behavior
                        </p>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <span className={simulation.ollamaAvailable ? "text-green-500" : "text-red-500"}>
                            {simulation.ollamaAvailable ? "● Ollama Connected" : "○ Ollama Unavailable"}
                        </span>
                        <span className="text-muted-foreground">
                            {simulation.ollamaModel || "No model"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Content - Full height flex */}
            <div className="flex-1 flex min-h-0">
                {/* Left Sidebar - Control Panel (fixed width) */}
                <div className="w-80 flex-shrink-0 border-r overflow-y-auto p-4">
                    <AgentControlPanel
                        agents={agents}
                        simulation={simulation}
                        onStart={handleStart}
                        onStop={handleStop}
                        onTick={handleTick}
                        onSelectAgent={setSelectedAgentId}
                        className="border-0 shadow-none"
                    />
                </div>

                {/* Right Content - Thought Viewer (fills remaining space) */}
                <div className="flex-1 min-w-0 overflow-y-auto p-6">
                    {selectedAgent ? (
                        <AgentThoughtViewer
                            agentId={selectedAgent.id}
                            agentName={selectedAgent.name}
                            status={selectedAgent.status}
                            thoughts={thoughts}
                            maxHeight="calc(100vh - 12rem)"
                            onClose={() => setSelectedAgentId(null)}
                        />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground border rounded-lg bg-muted/20">
                            <div className="text-4xl mb-4">💭</div>
                            <p className="text-lg">Select an agent to view their thought stream</p>
                            <p className="text-sm mt-2">
                                {agents.length === 0
                                    ? "No agents configured. Mark personnel as agents to begin."
                                    : `${agents.length} agent${agents.length !== 1 ? "s" : ""} available`
                                }
                            </p>
                            {!simulation.ollamaAvailable && (
                                <p className="text-amber-500 text-sm mt-4">
                                    💡 Start Ollama: <code className="bg-muted px-2 py-1 rounded">ollama pull gemma3:4b</code>
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
