/**
 * Agent Chat Integration - Handle chat message observations and responses
 * 
 * Provides functions for agents to interact with the chat system.
 */

import { getOllamaClient } from "./ollama-client";
import { buildPersonaPrompt, buildChatResponsePrompt } from "./agent-persona";
import type { AgentAction, ActionResult } from "./agent-types";

export interface ChatObservation {
    channelId: string;
    channelName: string;
    messageId: string;
    senderId: string;
    senderName: string;
    content: string;
    mentionsAgent: boolean;
    recentMessages?: Array<{
        sender: string;
        content: string;
    }>;
}

export interface AgentChatContext {
    agentId: string;
    agentName: string;
    persona: string;
    memberChannels: string[]; // Channel IDs the agent is a member of
}

/**
 * Determine if an agent should respond to a chat message
 */
export function shouldRespondToChat(observation: ChatObservation, context: AgentChatContext): boolean {
    // Always respond if directly mentioned
    if (observation.mentionsAgent) {
        return true;
    }

    // Don't respond to own messages
    if (observation.senderId === context.agentId) {
        return false;
    }

    // Only respond in channels the agent is a member of
    if (!context.memberChannels.includes(observation.channelId)) {
        return false;
    }

    // For non-mentions, use probability based on channel activity
    // Real implementation would consider context, conversation flow, etc.
    const respondProbability = 0.1; // 10% chance to chime in
    return Math.random() < respondProbability;
}

/**
 * Generate a chat response using the LLM
 */
export async function generateChatResponse(
    observation: ChatObservation,
    context: AgentChatContext
): Promise<ActionResult> {
    const startTime = Date.now();
    const client = getOllamaClient();

    // Check Ollama availability
    const health = await client.isAvailable();
    if (!health.available) {
        return {
            success: false,
            action: { type: "wait" },
            error: `Ollama unavailable: ${health.error}`,
            durationMs: Date.now() - startTime,
        };
    }

    // Build prompt
    const prompt = buildChatResponsePrompt(
        context.persona,
        observation.channelName,
        observation.content,
        observation.senderName,
        observation.recentMessages
    );

    // Generate response
    const result = await client.generate(prompt, {
        temperature: 0.8, // Slightly more creative for chat
        maxTokens: 150, // Keep chat responses short
    });

    if (!result.success) {
        return {
            success: false,
            action: { type: "wait" },
            error: result.error,
            durationMs: Date.now() - startTime,
        };
    }

    const action: AgentAction = {
        type: "send_chat_message",
        targetEntity: `channel:${observation.channelId}`,
        content: result.response?.trim() || "",
        metadata: {
            replyToMessageId: observation.messageId,
            channelName: observation.channelName,
        },
    };

    return {
        success: true,
        action,
        thought: `Responding to ${observation.senderName} in #${observation.channelName}`,
        response: result.response,
        durationMs: Date.now() - startTime,
    };
}

/**
 * Create a chat observation from raw event data
 */
export function createChatObservation(eventPayload: Record<string, unknown>): ChatObservation {
    return {
        channelId: String(eventPayload.channelId || ""),
        channelName: String(eventPayload.channelName || "general"),
        messageId: String(eventPayload.messageId || ""),
        senderId: String(eventPayload.senderId || ""),
        senderName: String(eventPayload.senderName || "Someone"),
        content: String(eventPayload.content || ""),
        mentionsAgent: Boolean(eventPayload.mentionsAgent),
        recentMessages: eventPayload.recentMessages as ChatObservation["recentMessages"],
    };
}
