/**
 * Agent Simulation Content - Client component
 * Dev/demo interface for managing agent simulation
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AgentControlPanel } from "@/components/ui/agent-control-panel";
import { AgentThoughtViewer } from "@/components/ui/agent-thought-viewer";
import { EventQueuePanel, type ScheduledEvent } from "@/components/ui/event-queue-panel";
import { EventDetailsPanel } from "@/components/ui/event-details-panel";
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
    const [selectedEvent, setSelectedEvent] = useState<ScheduledEvent | null>(null);
    const [processingEventId, setProcessingEventId] = useState<string | null>(null);
    const [thoughts, setThoughts] = useState<ThoughtEntry[]>([]);
    const [loading, setLoading] = useState(true);

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

            setSimulation(prev => ({
                ...prev,
                ollamaAvailable: health.available,
                ollamaModel: health.model,
                running: loopData.running || false,
                totalTicks: loopData.tickCount || prev.totalTicks,
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
                }) => ({
                    id: e.id,
                    timestamp: e.timestamp,
                    agentName: agentsRef.current.find(a => a.id === agentId)?.name || agentId,
                    eventType: e.eventType,
                    content: e.content,
                    targetEntity: e.targetEntity,
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

            const response = await fetch("/api/agents/tick", { method: "POST" });
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
    }, [fetchStatus, fetchEvents, selectedAgentId]);

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
                {/* Left Sidebar - Control Panel (1/3 width) */}
                <div className="w-1/3 flex-shrink-0 border-r overflow-y-auto p-4 space-y-6">
                    <AgentControlPanel
                        agents={agents}
                        simulation={simulation}
                        onStart={handleStart}
                        onStop={handleStop}
                        onTick={handleTick}
                        onReset={handleReset}
                        onActivate={handleActivate}
                        onSelectAgent={handleSelectAgent}
                        className="border-0 shadow-none"
                    />

                    {/* Event Queue */}
                    <div className="border-t pt-4">
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

                {/* Right Content - Details Panel (2/3 width) */}
                <div className="w-2/3 overflow-y-auto p-6">
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
