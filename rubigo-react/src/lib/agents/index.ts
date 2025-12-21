/**
 * Agent Simulation Module
 * 
 * Local, airgapped agent simulation using SQLite + Ollama.
 * Enables scenario personnel to act as autonomous AI agents.
 */

// Core client
export {
    OllamaClient,
    getOllamaClient,
    resetOllamaClient,
    type OllamaConfig,
    type OllamaHealthStatus,
    type GenerateOptions,
    type GenerateResult,
} from "./ollama-client";

// Persona and prompts
export {
    extractPersonaTraits,
    buildPersonaPrompt,
    buildReActPrompt,
    buildChatResponsePrompt,
    buildEmailResponsePrompt,
    parseReActResponse,
    type PersonaTraits,
    type ParsedReActResponse,
} from "./agent-persona";

// Types
export {
    type AgentEventType,
    type SyncContextType,
    type AgentRuntimeState,
    type ScheduledEvent,
    type AgentActionType,
    type AgentAction,
    type ActionResult,
    type SimulationConfig,
    type WorkerCommand,
    type WorkerResponse,
    DEFAULT_SIMULATION_CONFIG,
    calculateEventPriority,
    getMaxLatency,
    getEventTier,
    createEventId,
} from "./agent-types";
