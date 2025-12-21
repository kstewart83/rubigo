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
            <div className="flex items-center justify-center h-full">
                <div className="text-muted-foreground">Loading agent simulation...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Agent Simulation</h1>
                    <p className="text-muted-foreground">
                        Control and monitor AI agent behavior
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Control Panel */}
                <AgentControlPanel
                    agents={agents}
                    simulation={simulation}
                    onStart={handleStart}
                    onStop={handleStop}
                    onTick={handleTick}
                    onSelectAgent={setSelectedAgentId}
                />

                {/* Thought Viewer */}
                {selectedAgent ? (
                    <AgentThoughtViewer
                        agentId={selectedAgent.id}
                        agentName={selectedAgent.name}
                        status={selectedAgent.status}
                        thoughts={thoughts}
                        onClose={() => setSelectedAgentId(null)}
                    />
                ) : (
                    <div className="border rounded-lg p-8 flex items-center justify-center text-muted-foreground">
                        Select an agent to view their thought stream
                    </div>
                )}
            </div>

            {/* Status Info */}
            <div className="text-sm text-muted-foreground">
                <p>
                    Ollama: {simulation.ollamaAvailable ? "✅ Connected" : "❌ Unavailable"} |
                    Agents: {agents.length} |
                    Model: {simulation.ollamaModel || "N/A"}
                </p>
                {!simulation.ollamaAvailable && (
                    <p className="text-amber-500 mt-1">
                        💡 Start Ollama and run: <code>ollama pull gemma3:4b</code>
                    </p>
                )}
            </div>
        </div>
    );
}
