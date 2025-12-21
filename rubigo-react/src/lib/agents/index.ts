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

// Scheduler
export {
    AgentScheduler,
    type SchedulerCallbacks,
} from "./agent-scheduler";

// Manager (main thread interface)
export {
    AgentManager,
    getAgentManager,
    resetAgentManager,
    type AgentManagerOptions,
    type SimulationStatus,
} from "./agent-manager";

// Collaboration: Chat
export {
    shouldRespondToChat,
    generateChatResponse,
    createChatObservation,
    type ChatObservation,
    type AgentChatContext,
} from "./agent-chat";

// Collaboration: Email
export {
    shouldRespondToEmail,
    generateEmailResponse,
    generateDraftEmail,
    checkInbox,
    createEmailObservation,
    type EmailObservation,
    type AgentEmailContext,
} from "./agent-email";

// Collaboration: Calendar
export {
    getUpcomingEvents,
    isEventActive,
    shouldJoinMeeting,
    generateMeetingPrep,
    createJoinMeetingAction,
    createLeaveMeetingAction,
    processCalendarCheck,
    createCalendarEvent,
    type CalendarEvent,
    type AgentCalendarContext,
} from "./agent-calendar";

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
