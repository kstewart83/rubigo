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
