/**
 * AI SDK Chat Agent
 * 
 * Uses ToolLoopAgent pattern for multi-step chat conversations.
 * This provides more sophisticated tool-based reasoning compared to
 * the simple generateText() approach in agent-chat.ts.
 */

import { generateText } from 'ai';
import { getOllamaModel, checkOllamaHealth } from './ollama-provider';
import { agentTools, type AgentToolResult } from './tools';
import type { ActionResult, AgentAction } from '../agent-types';

export interface ChatAgentConfig {
    /** Agent's persona/system prompt */
    persona: string;
    /** Maximum number of tool calls in a single interaction */
    maxSteps?: number;
    /** Temperature for generation (0-2) */
    temperature?: number;
    /** Enable verbose logging */
    verbose?: boolean;
}

export interface ChatContext {
    channelId: string;
    channelName: string;
    messageContent: string;
    senderName: string;
    recentMessages?: Array<{ sender: string; content: string }>;
}

/**
 * Generate a chat response using the ToolLoopAgent pattern
 * 
 * This allows the agent to:
 * 1. Reason about the conversation
 * 2. Decide which tool to use (respond, wait, clarify, etc.)
 * 3. Execute the tool with proper parameters
 */
export async function generateChatWithTools(
    context: ChatContext,
    config: ChatAgentConfig
): Promise<ActionResult> {
    const startTime = Date.now();

    // Check Ollama availability
    const health = await checkOllamaHealth();
    if (!health.available) {
        return {
            success: false,
            action: { type: "wait" },
            error: `Ollama unavailable: ${health.error}`,
            durationMs: Date.now() - startTime,
        };
    }

    // Build the observation prompt
    const observation = buildChatObservation(context);

    // Build the full prompt with persona and context
    const systemPrompt = `${config.persona}

You are participating in a workplace chat conversation. Based on the observation below, decide what action to take.

Available actions:
- sendChatMessage: Send a response to the channel
- wait: Choose not to respond (if the message doesn't require your input)
- requestClarification: Ask for more information if something is unclear

Be concise and professional. Only respond if it's appropriate for your role.`;

    try {
        // Use generateText with tools for multi-step reasoning
        const result = await generateText({
            model: getOllamaModel(),
            system: systemPrompt,
            prompt: observation,
            tools: {
                sendChatMessage: agentTools.sendChatMessage,
                wait: agentTools.wait,
                requestClarification: agentTools.requestClarification,
            },
            temperature: config.temperature ?? 0.7,
        });

        const { text, toolCalls, finishReason } = result;
        // Extract tool results from steps if available
        const toolResults = result.steps?.flatMap(step =>
            step.toolResults?.map(r => ({ result: 'output' in r ? r.output : undefined })) ?? []
        ) ?? [];

        if (config.verbose) {
            console.log('[ChatAgent] Finish reason:', finishReason);
            console.log('[ChatAgent] Tool calls:', toolCalls?.length || 0);
        }

        // Process tool results to determine the action
        const action = extractActionFromToolResults(toolResults, text);

        return {
            success: true,
            action,
            thought: `Processed chat observation with ${toolCalls?.length || 0} tool calls`,
            response: action.content || text,
            durationMs: Date.now() - startTime,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        // Check if this is a tool calling not supported error
        if (errorMessage.includes('does not support tool') || errorMessage.includes('tool_choice')) {
            // Fallback to simple generation without tools
            return await fallbackToSimpleGeneration(context, config, startTime);
        }

        return {
            success: false,
            action: { type: "wait" },
            error: errorMessage,
            durationMs: Date.now() - startTime,
        };
    }
}

/**
 * Fallback to simple text generation when tools aren't supported
 */
async function fallbackToSimpleGeneration(
    context: ChatContext,
    config: ChatAgentConfig,
    startTime: number
): Promise<ActionResult> {
    const observation = buildChatObservation(context);

    const prompt = `${config.persona}

---
${observation}

Respond naturally and concisely. If you choose not to respond, just say "WAIT".`;

    try {
        const { text } = await generateText({
            model: getOllamaModel(),
            prompt,
            temperature: config.temperature ?? 0.7,
            maxOutputTokens: 150,
        });

        const trimmedText = text?.trim() || "";

        if (trimmedText.toUpperCase() === "WAIT" || trimmedText === "") {
            return {
                success: true,
                action: { type: "wait" },
                thought: "Decided not to respond",
                durationMs: Date.now() - startTime,
            };
        }

        return {
            success: true,
            action: {
                type: "send_chat_message",
                targetEntity: `channel:${context.channelId}`,
                content: trimmedText,
            },
            thought: "Generated response (fallback mode)",
            response: trimmedText,
            durationMs: Date.now() - startTime,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return {
            success: false,
            action: { type: "wait" },
            error: errorMessage,
            durationMs: Date.now() - startTime,
        };
    }
}

/**
 * Build a natural language observation from chat context
 */
function buildChatObservation(context: ChatContext): string {
    let observation = `New message in #${context.channelName} from ${context.senderName}:\n"${context.messageContent}"`;

    if (context.recentMessages && context.recentMessages.length > 0) {
        observation += "\n\nRecent conversation:";
        for (const msg of context.recentMessages.slice(-5)) {
            observation += `\n- ${msg.sender}: "${msg.content}"`;
        }
    }

    return observation;
}

/**
 * Extract the primary action from tool results
 */
function extractActionFromToolResults(
    toolResults: Array<{ result: unknown }> | undefined,
    fallbackText: string | undefined
): AgentAction {
    if (!toolResults || toolResults.length === 0) {
        // No tools were called - use the text response if any
        if (fallbackText && fallbackText.trim()) {
            return {
                type: "send_chat_message",
                content: fallbackText.trim(),
            };
        }
        return { type: "wait" };
    }

    // Find the first actionable result
    for (const { result } of toolResults) {
        const toolResult = result as AgentToolResult;
        if (!toolResult?.success) continue;

        switch (toolResult.action) {
            case 'send_chat_message':
                return {
                    type: "send_chat_message",
                    targetEntity: `channel:${toolResult.channelId}`,
                    content: String(toolResult.content || ""),
                    metadata: toolResult.replyToMessageId
                        ? { replyToMessageId: String(toolResult.replyToMessageId) }
                        : undefined,
                };
            case 'request_clarification':
                return {
                    type: "send_chat_message",
                    content: String(toolResult.question || "Could you please clarify?"),
                };
            case 'wait':
                return { type: "wait" };
        }
    }

    return { type: "wait" };
}

/**
 * Feature flag check for ToolLoopAgent usage
 */
export function shouldUseToolLoopAgent(): boolean {
    return process.env.RUBIGO_AGENT_USE_TOOLS === 'true';
}
