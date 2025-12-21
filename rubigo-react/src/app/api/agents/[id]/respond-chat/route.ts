/**
 * Agent Chat Response API
 * 
 * POST /api/agents/[id]/respond-chat
 * 
 * Makes an agent respond to pending chat messages in their channels.
 * Uses Ollama to generate contextually appropriate responses.
 */

import { NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, desc, ne, inArray } from "drizzle-orm";
import { getAgentToken } from "@/lib/agent-tokens";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma3:4b";

interface RouteParams {
    params: Promise<{ id: string }>;
}

interface OllamaResponse {
    response: string;
    done: boolean;
}

/**
 * Generate a chat response using Ollama
 */
async function generateChatResponse(
    agentName: string,
    agentTitle: string,
    channelName: string,
    recentMessages: { sender: string; content: string }[],
    targetMessage: { sender: string; content: string }
): Promise<string> {
    // Build conversation context
    const messageHistory = recentMessages
        .map(m => `${m.sender}: ${m.content}`)
        .join("\n");

    const systemPrompt = `You are ${agentName}, a ${agentTitle} at work.
You are responding to a message in the #${channelName} chat channel.
Be professional but friendly. Keep responses concise (1-3 sentences).
Don't use emojis excessively. Stay in character.`;

    const userPrompt = `Recent conversation:
${messageHistory}

The latest message from ${targetMessage.sender} is:
"${targetMessage.content}"

Respond naturally as ${agentName}:`;

    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: userPrompt,
                system: systemPrompt,
                stream: false,
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama error: ${response.status}`);
        }

        const data = (await response.json()) as OllamaResponse;
        return data.response.trim();
    } catch (error) {
        console.error("Ollama generation error:", error);
        throw error;
    }
}

/**
 * Generate a short ID
 */
function generateId(): string {
    return Math.random().toString(36).substring(2, 10);
}

/**
 * POST - Make agent respond to chat messages
 */
export async function POST(request: Request, { params }: RouteParams) {
    const { id } = await params;

    // Get the agent's info
    const agents = await db
        .select()
        .from(schema.personnel)
        .where(
            and(
                eq(schema.personnel.id, id),
                eq(schema.personnel.isAgent, true)
            )
        )
        .limit(1);

    if (agents.length === 0) {
        return NextResponse.json(
            { success: false, error: "Agent not found" },
            { status: 404 }
        );
    }

    const agent = agents[0];

    try {
        // Get channels the agent is a member of
        const memberships = await db
            .select({
                channelId: schema.chatMembers.channelId,
                channelName: schema.chatChannels.name,
            })
            .from(schema.chatMembers)
            .innerJoin(
                schema.chatChannels,
                eq(schema.chatMembers.channelId, schema.chatChannels.id)
            )
            .where(eq(schema.chatMembers.personnelId, id));

        if (memberships.length === 0) {
            return NextResponse.json({
                success: false,
                error: "Agent is not a member of any chat channels",
            });
        }

        const channelIds = memberships.map(m => m.channelId);

        // Get the most recent message in agent's channels that wasn't sent by the agent
        const recentMessages = await db
            .select({
                id: schema.chatMessages.id,
                channelId: schema.chatMessages.channelId,
                senderId: schema.chatMessages.senderId,
                content: schema.chatMessages.content,
                timestamp: schema.chatMessages.timestamp,
                senderName: schema.personnel.name,
            })
            .from(schema.chatMessages)
            .innerJoin(
                schema.personnel,
                eq(schema.chatMessages.senderId, schema.personnel.id)
            )
            .where(
                and(
                    inArray(schema.chatMessages.channelId, channelIds),
                    ne(schema.chatMessages.senderId, id)
                )
            )
            .orderBy(desc(schema.chatMessages.timestamp))
            .limit(10);

        if (recentMessages.length === 0) {
            return NextResponse.json({
                success: true,
                action: "none",
                message: "No messages to respond to",
            });
        }

        // Get the most recent message to respond to
        const targetMessage = recentMessages[0];
        const channelName = memberships.find(
            m => m.channelId === targetMessage.channelId
        )?.channelName || "channel";

        // Build context from recent messages (reverse to chronological order)
        const context = recentMessages
            .slice(0, 5)
            .reverse()
            .map(m => ({
                sender: m.senderName,
                content: m.content,
            }));

        // Generate response using Ollama
        const responseContent = await generateChatResponse(
            agent.name,
            agent.title || "Employee",
            channelName,
            context,
            {
                sender: targetMessage.senderName,
                content: targetMessage.content,
            }
        );

        // Post the response to the chat
        const messageId = generateId();
        await db.insert(schema.chatMessages).values({
            id: messageId,
            channelId: targetMessage.channelId,
            senderId: id,
            content: responseContent,
            timestamp: new Date().toISOString(),
        });

        // Record this as an agent event
        await db.insert(schema.agentEvents).values({
            id: generateId(),
            personnelId: id,
            timestamp: new Date().toISOString(),
            eventType: "action",
            content: `Responded in #${channelName}: "${responseContent}"`,
            targetEntity: `chat:${targetMessage.channelId}`,
            metadata: JSON.stringify({
                replyTo: targetMessage.id,
                replyToSender: targetMessage.senderName,
            }),
        });

        return NextResponse.json({
            success: true,
            action: "responded",
            channel: channelName,
            replyTo: targetMessage.senderName,
            originalMessage: targetMessage.content,
            response: responseContent,
            messageId,
        });
    } catch (error) {
        console.error("Chat response error:", error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
