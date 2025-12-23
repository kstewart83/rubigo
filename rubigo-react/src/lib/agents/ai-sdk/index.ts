/**
 * AI SDK Integration for Agent Simulation
 * 
 * Re-exports configured providers and utilities for AI SDK integration.
 */

// Provider configuration
export {
    getOllamaModel,
    getOllamaEmbeddingModel,
    checkOllamaHealth,
    getModelName,
    getBaseUrl,
    type OllamaHealthStatus,
} from './ollama-provider';

// Re-export AI SDK core functions
export { generateText, streamText, generateObject, tool, ollama } from './ollama-provider';

// Tool definitions (Phase 2)
export {
    agentTools,
    sendChatMessageTool,
    sendEmailTool,
    checkCalendarTool,
    waitTool,
    requestClarificationTool,
    type AgentToolResult,
} from './tools';

// ChatAgent with ToolLoopAgent support (Phase 2)
export {
    generateChatWithTools,
    shouldUseToolLoopAgent,
    type ChatAgentConfig,
    type ChatContext,
} from './chat-agent';

