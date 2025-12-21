/**
 * Agent Types - Core type definitions for agent simulation
 * 
 * Defines the data structures for agent state, events, and scheduling.
 */

import type { AgentStatus, ReactionTier } from "@/db/schema";

// Re-export schema types for convenience
export type { AgentStatus, ReactionTier };

/**
 * Event types that can be logged to agent_events
 */
export type AgentEventType = "thought" | "action" | "observation" | "decision";

/**
 * Context types for sync_contexts
 */
export type SyncContextType = "meeting" | "chat_active" | "hallway" | "phone_call";

/**
 * Runtime state for an agent (in-memory)
 */
export interface AgentRuntimeState {
    personnelId: string;
    name: string;
    status: AgentStatus;
    activeContextIds: string[];
    lastActivityAt: string; // ISO 8601
    pendingActionCount: number;
}

/**
 * Scheduled event in the priority queue
 */
export interface ScheduledEvent {
    id: string;
    agentId: string;
    scheduledFor: number; // Unix timestamp ms
    tier: ReactionTier;
    eventType: "chat_message" | "email_received" | "meeting_start" | "calendar_check" | "idle_check";
    payload: Record<string, unknown>;
    createdAt: number;
}

/**
 * Action that an agent can take
 */
export type AgentActionType =
    | "send_chat_message"
    | "send_email"
    | "read_email"
    | "check_calendar"
    | "join_meeting"
    | "leave_meeting"
    | "think"
    | "wait";

export interface AgentAction {
    type: AgentActionType;
    targetEntity?: string; // e.g., "channel:abc", "email:123"
    content?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Result from processing an agent action
 */
export interface ActionResult {
    success: boolean;
    action: AgentAction;
    thought?: string;
    response?: string;
    error?: string;
    durationMs: number;
}

/**
 * Configuration for the agent simulation
 */
export interface SimulationConfig {
    tickRateMs: number; // How often to process events
    maxConcurrentAgents: number;
    ollamaUrl: string;
    ollamaModel: string;
    enabled: boolean;
}

export const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
    tickRateMs: 1000, // 1 second
    maxConcurrentAgents: 5,
    ollamaUrl: "http://localhost:11434",
    ollamaModel: "gemma3:4b",
    enabled: false, // Disabled by default
};

/**
 * Message types for worker communication
 */
export type WorkerCommand =
    | { type: "start"; config: Partial<SimulationConfig> }
    | { type: "stop" }
    | { type: "tick" }
    | { type: "trigger"; agentId: string; event: Omit<ScheduledEvent, "id" | "agentId" | "createdAt"> }
    | { type: "status" };

export type WorkerResponse =
    | { type: "started"; agentCount: number }
    | { type: "stopped" }
    | { type: "tick_complete"; processed: number; pending: number }
    | { type: "status"; running: boolean; agents: AgentRuntimeState[] }
    | { type: "error"; message: string };

/**
 * Priority calculation for events based on tier
 */
export function calculateEventPriority(event: ScheduledEvent): number {
    const tierPriority: Record<ReactionTier, number> = {
        sync: 1,
        near_sync: 2,
        async: 3,
    };

    // Lower number = higher priority
    // Primary sort by tier, secondary by scheduled time
    return tierPriority[event.tier] * 1000000000 + event.scheduledFor;
}

/**
 * Get the maximum latency for a reaction tier
 */
export function getMaxLatency(tier: ReactionTier): number {
    const latencies: Record<ReactionTier, number> = {
        sync: 2000,       // 2 seconds
        near_sync: 60000, // 1 minute
        async: 3600000,   // 1 hour
    };
    return latencies[tier];
}

/**
 * Determine appropriate reaction tier for an event type
 */
export function getEventTier(eventType: ScheduledEvent["eventType"]): ReactionTier {
    switch (eventType) {
        case "meeting_start":
            return "sync";
        case "chat_message":
            return "near_sync";
        case "email_received":
        case "calendar_check":
        case "idle_check":
            return "async";
        default:
            return "async";
    }
}

/**
 * Create a unique event ID
 */
export function createEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
