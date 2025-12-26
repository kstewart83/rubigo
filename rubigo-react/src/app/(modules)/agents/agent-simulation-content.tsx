/**
 * Agent Simulation Content - Client component
 * Dev/demo interface for managing agent simulation
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SimulationControlPanel, type OllamaModel } from "@/components/ui/simulation-control-panel";
import { AgentListPanel, type AgentInfo } from "@/components/ui/agent-list-panel";
import { AgentThoughtViewer } from "@/components/ui/agent-thought-viewer";
import { EventQueuePanel, type ScheduledEvent } from "@/components/ui/event-queue-panel";
import { EventDetailsPanel } from "@/components/ui/event-details-panel";
import { AgentActivityFeed } from "@/components/ui/agent-activity-feed";
import type { SimulationState } from "@/components/ui/simulation-control-panel";
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
    const [selectedEvent, setSelectedEvent] = useState<ScheduledEvent | null>(null);
    const [processingEventId, setProcessingEventId] = useState<string | null>(null);
    const [thoughts, setThoughts] = useState<ThoughtEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [availableModels, setAvailableModels] = useState<OllamaModel[]>([]);
    const [selectedModel, setSelectedModel] = useState<string | undefined>(undefined);

    // Fetch agents, Ollama status, and loop status
    const fetchStatus = useCallback(async () => {
        try {
            // Fetch Ollama health
            const healthRes = await fetch("/api/agents/ollama/health");
            const health = await healthRes.json();

            // Fetch agents
            const agentsRes = await fetch("/api/agents");
            const agentsData = await agentsRes.json();

            // Fetch loop status
            const loopRes = await fetch("/api/agents/loop/status");
            const loopData = await loopRes.json();

            // Fetch available models
            const modelsRes = await fetch("/api/agents/ollama/models");
            const modelsData = await modelsRes.json();
            if (modelsData.success && modelsData.models) {
                setAvailableModels(modelsData.models);
            }

            // Fetch persisted model setting
            const settingRes = await fetch("/api/settings?key=ollama_model");
            const settingData = await settingRes.json();
            if (settingData.success && settingData.setting?.value) {
                setSelectedModel(settingData.setting.value);
            } else if (modelsData.models && modelsData.models.length > 0) {
                // Default to first available model if no setting exists
                setSelectedModel(modelsData.models[0].name);
            }

            setSimulation(prev => ({
                ...prev,
                ollamaAvailable: health.available,
                ollamaModel: health.model,
                running: loopData.running || false,
                totalTicks: loopData.tickCount || prev.totalTicks,
            }));

            setAgents(
                (agentsData.agents || []).map((a: { id: string; name: string; department?: string; status: AgentStatus; aco?: string }) => ({
                    id: a.id,
                    name: a.name,
                    department: a.department,
                    status: a.status as AgentStatus,
                    pendingActions: 0,
                    lastActivity: new Date().toISOString(),
                    aco: a.aco,
                }))
            );
        } catch (error) {
            console.error("Error fetching status:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch selected agent's events
    // Use ref for agents to prevent callback recreation
    const agentsRef = useRef(agents);
    agentsRef.current = agents;

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
                    aco?: string;
                }) => ({
                    id: e.id,
                    timestamp: e.timestamp,
                    agentName: agentsRef.current.find(a => a.id === agentId)?.name || agentId,
                    eventType: e.eventType,
                    content: e.content,
                    targetEntity: e.targetEntity,
                    aco: e.aco,
                }))
            );
        } catch (error) {
            console.error("Error fetching events:", error);
        }
    }, []);

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

    // Execute a tick - call the backend API
    const executeTick = useCallback(async () => {
        try {
            // Get the first ready event to mark as processing
            const eventsRes = await fetch("/api/agents/events?page=1&limit=1");
            const eventsData = await eventsRes.json();
            const firstEvent = eventsData.events?.[0];

            if (firstEvent?.isReady) {
                setProcessingEventId(firstEvent.id);
            }

            const response = await fetch("/api/agents/tick", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ model: selectedModel }),
            });
            const data = await response.json();
            console.log("Tick result:", data);

            // Clear processing state
            setProcessingEventId(null);

            // Refresh status after tick
            await fetchStatus();

            // Refresh events if we have a selected agent
            if (selectedAgentId) {
                await fetchEvents(selectedAgentId);
            }

            setSimulation(prev => ({ ...prev, totalTicks: prev.totalTicks + 1 }));
        } catch (error) {
            console.error("Tick error:", error);
            setProcessingEventId(null);
        }
    }, [fetchStatus, fetchEvents, selectedAgentId, selectedModel]);

    // Poll for status updates when loop is running
    useEffect(() => {
        if (simulation.running) {
            // Poll status every 3 seconds to get tick count updates
            const interval = setInterval(fetchStatus, 3000);
            return () => clearInterval(interval);
        }
    }, [simulation.running, fetchStatus]);

    const handleStart = async () => {
        try {
            const res = await fetch("/api/agents/loop/start", { method: "POST" });
            const data = await res.json();
            console.log("Loop started:", data);
            if (data.success) {
                setSimulation(prev => ({ ...prev, running: true, totalTicks: 0 }));
            }
        } catch (error) {
            console.error("Error starting loop:", error);
        }
    };

    const handleStop = async () => {
        try {
            const res = await fetch("/api/agents/loop/stop", { method: "POST" });
            const data = await res.json();
            console.log("Loop stopped:", data);
            if (data.success) {
                setSimulation(prev => ({ ...prev, running: false }));
            }
        } catch (error) {
            console.error("Error stopping loop:", error);
        }
    };

    const handleModelChange = async (model: string) => {
        setSelectedModel(model);
        // Persist to API
        try {
            await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key: "ollama_model", value: model }),
            });
        } catch (error) {
            console.error("Error persisting model selection:", error);
        }
    };

    const handleTick = () => {
        executeTick();
    };

    const handleReset = async () => {
        try {
            // Stop the loop first if running
            if (simulation.running) {
                await fetch("/api/agents/loop/stop", { method: "POST" });
            }

            const response = await fetch("/api/agents/reset", { method: "POST" });
            const data = await response.json();
            console.log("Reset result:", data);

            // Clear local state
            setThoughts([]);
            setSelectedAgentId(null);
            setSelectedEvent(null);
            setSimulation(prev => ({ ...prev, running: false, totalTicks: 0 }));

            // Refresh status
            await fetchStatus();
        } catch (error) {
            console.error("Reset error:", error);
        }
    };

    const handleActivate = async (agentId: string) => {
        try {
            const response = await fetch(`/api/agents/${agentId}/activate`, { method: "POST" });
            const data = await response.json();
            console.log("Activate result:", data);

            // Refresh status to show the event in queue
            await fetchStatus();
        } catch (error) {
            console.error("Activate error:", error);
        }
    };

    const handleSelectAgent = (agentId: string) => {
        setSelectedAgentId(agentId);
        setSelectedEvent(null); // Clear event selection
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
                {/* Left Sidebar - Control Panel */}
                <div className="w-1/3 min-w-48 shrink border-r overflow-y-auto py-4 pr-4 space-y-4">
                    {/* Simulation Controls - Static LOW classification */}
                    <SimulationControlPanel
                        simulation={simulation}
                        activeAgents={agents.filter(a => a.status === "active").length}
                        totalAgents={agents.length}
                        availableModels={availableModels}
                        selectedModel={selectedModel}
                        onModelChange={handleModelChange}
                        onStart={handleStart}
                        onStop={handleStop}
                        onTick={handleTick}
                        onReset={handleReset}
                    />

                    {/* Agent List - Dynamic classification based on ACO */}
                    <AgentListPanel
                        agents={agents}
                        onActivate={handleActivate}
                        onSelectAgent={handleSelectAgent}
                    />

                    {/* Event Queue */}
                    <div>
                        <EventQueuePanel
                            refreshTrigger={simulation.totalTicks}
                            onSelectEvent={(event) => {
                                setSelectedEvent(event);
                                setSelectedAgentId(null); // Clear agent selection
                            }}
                            onEventsRefresh={(events) => {
                                // Update selected event with fresh timing data
                                if (selectedEvent) {
                                    const updated = events.find(e => e.id === selectedEvent.id);
                                    if (updated) {
                                        setSelectedEvent(updated);
                                    } else {
                                        // Event was processed, clear selection
                                        setSelectedEvent(null);
                                    }
                                }
                            }}
                            selectedEventId={selectedEvent?.id}
                            processingEventId={processingEventId}
                        />
                    </div>
                </div>

                {/* Right Content - Details Panel */}
                <div className="flex-1 min-w-0 overflow-y-auto p-4">
                    {selectedEvent ? (
                        <EventDetailsPanel
                            event={selectedEvent}
                            onClose={() => setSelectedEvent(null)}
                        />
                    ) : selectedAgent ? (
                        <AgentThoughtViewer
                            agentId={selectedAgent.id}
                            agentName={selectedAgent.name}
                            status={selectedAgent.status}
                            thoughts={thoughts}
                            maxHeight="calc(100vh - 12rem)"
                            onClose={() => setSelectedAgentId(null)}
                        />
                    ) : (
                        <AgentActivityFeed
                            className="h-full border rounded-lg overflow-hidden"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
