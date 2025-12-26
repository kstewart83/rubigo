/**
 * Agent Tick API - DES Event Processor
 * 
 * POST /api/agents/tick
 * 
 * Processes the next event from the priority queue.
 * Events are only processed if scheduled_for <= now.
 * After processing, handlers schedule the next event.
 */

import { NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import {
    getNextReadyEvent,
    markEventProcessed,
    scheduleNextContextCheck,
    getTimeUntilNextEvent,
    getPendingEvents,
    TIER_DELAYS,
} from "@/lib/agent-events";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const FALLBACK_MODEL = process.env.OLLAMA_MODEL || "gemma3:4b";

/**
 * Get the persisted model from app_settings, falling back to env/default
 */
async function getPersistedModel(): Promise<string> {
    try {
        const settings = await db
            .select()
            .from(schema.appSettings)
            .where(eq(schema.appSettings.key, schema.SETTING_KEYS.OLLAMA_MODEL))
            .limit(1);

        if (settings.length > 0 && settings[0].value) {
            return settings[0].value;
        }
    } catch (error) {
        console.error("Error fetching persisted model:", error);
    }
    return FALLBACK_MODEL;
}

/**
 * Generate a unique ID
 */
function generateId(): string {
    return Math.random().toString(36).substring(2, 10);
}

/**
 * Get model info including digest from Ollama
 */
async function getModelInfo(modelName: string): Promise<{ model: string; digest?: string }> {
    try {
        const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
            cache: 'no-store',
        });
        if (res.ok) {
            const data = await res.json();
            const modelInfo = (data.models || []).find(
                (m: { name: string; digest: string }) => m.name === modelName
            );
            if (modelInfo) {
                return { model: modelName, digest: modelInfo.digest };
            }
        }
    } catch {
        // Fall back to just model name
    }
    return { model: modelName };
}

/**
 * Handle check_chat event
 * Calls the respond-chat logic inline
 */
async function handleCheckChat(
    agentId: string,
    contextId: string | null,
    payload: Record<string, unknown> | null,
    model: string
): Promise<{ responded: boolean; response?: string; channel?: string }> {
    // Get agent info
    const agents = await db
        .select()
        .from(schema.personnel)
        .where(eq(schema.personnel.id, agentId))
        .limit(1);

    if (agents.length === 0) {
        return { responded: false };
    }

    const agent = agents[0];

    // Get the channel ID from context or payload
    let channelId: string | null = null;

    if (contextId) {
        const contexts = await db
            .select()
            .from(schema.syncContexts)
            .where(eq(schema.syncContexts.id, contextId))
            .limit(1);

        if (contexts.length > 0) {
            channelId = contexts[0].relatedEntityId;
        }
    }

    if (!channelId && payload?.relatedEntityId) {
        channelId = payload.relatedEntityId as string;
    }

    if (!channelId) {
        return { responded: false };
    }

    // Get recent messages (newest first, then reverse for chronological order)
    const recentMessagesRaw = await db
        .select({
            id: schema.chatMessages.id,
            content: schema.chatMessages.content,
            senderId: schema.chatMessages.senderId,
            senderName: schema.personnel.name,
            senderIsAgent: schema.personnel.isAgent,
            sentAt: schema.chatMessages.sentAt,
        })
        .from(schema.chatMessages)
        .innerJoin(
            schema.personnel,
            eq(schema.chatMessages.senderId, schema.personnel.id)
        )
        .where(eq(schema.chatMessages.channelId, channelId))
        .orderBy(desc(schema.chatMessages.sentAt))
        .limit(15);

    // Reverse to get chronological order (oldest first for context)
    const recentMessages = recentMessagesRaw.reverse();

    // Filter to messages from HUMANS only (not from any agent, including self)
    const humanMessages = recentMessages.filter(m => !m.senderIsAgent);

    console.log(`[AGENT DEBUG] ${agent.name} check_chat:`, {
        channelId,
        totalMessages: recentMessages.length,
        humanMessages: humanMessages.length,
        agentMessages: recentMessages.filter(m => m.senderId === agentId).length,
    });

    if (humanMessages.length === 0) {
        console.log(`[AGENT DEBUG] ${agent.name}: No human messages, skipping`);
        return { responded: false };
    }

    // Get the most recent HUMAN message to potentially respond to
    const targetMessage = humanMessages[humanMessages.length - 1];

    // Check if agent already responded after this human message
    const agentMessages = recentMessages.filter(m => m.senderId === agentId);
    const lastAgentMessage = agentMessages[agentMessages.length - 1];

    console.log(`[AGENT DEBUG] ${agent.name} target:`, {
        targetMessageId: targetMessage.id,
        targetSender: targetMessage.senderName,
        targetContent: targetMessage.content.substring(0, 50),
        targetSentAt: targetMessage.sentAt,
        lastAgentMessageId: lastAgentMessage?.id,
        lastAgentSentAt: lastAgentMessage?.sentAt,
    });

    if (lastAgentMessage) {
        // Compare as Date objects to handle different timestamp formats
        const lastAgentTime = new Date(lastAgentMessage.sentAt).getTime();
        const targetTime = new Date(targetMessage.sentAt).getTime();
        const now = Date.now();

        console.log(`[AGENT DEBUG] ${agent.name} timing:`, {
            lastAgentTime,
            targetTime,
            now,
            agentAfterTarget: lastAgentTime > targetTime,
            timeSinceAgentResponse: now - lastAgentTime,
            cooldownMs: 30000,
            cooldownActive: now - lastAgentTime < 30000,
        });

        // Skip if agent already responded after this human message
        if (lastAgentTime > targetTime) {
            console.log(`[AGENT DEBUG] ${agent.name}: Already responded after target message, skipping`);
            return { responded: false };
        }

        // Cooldown: Skip if agent responded within last 30 seconds
        if (now - lastAgentTime < 30000) {
            console.log(`[AGENT DEBUG] ${agent.name}: Cooldown active (${Math.round((now - lastAgentTime) / 1000)}s since last response), skipping`);
            return { responded: false };
        }
    }

    // Response probability: Only respond 30% of the time to avoid spam
    // (unless this message mentions the agent by name)
    const mentionsAgent = targetMessage.content.toLowerCase().includes(agent.name.toLowerCase());
    const randomRoll = Math.random();
    console.log(`[AGENT DEBUG] ${agent.name} probability:`, {
        mentionsAgent,
        randomRoll,
        threshold: 0.3,
        willRespond: mentionsAgent || randomRoll <= 0.3,
    });

    if (!mentionsAgent && randomRoll > 0.3) {
        return { responded: false };
    }

    // Build context for Ollama
    const messageHistory = recentMessages
        .slice(-5)
        .map(m => `${m.senderName}: ${m.content}`)
        .join("\n");

    const systemPrompt = `You are ${agent.name}, a ${agent.title || "Employee"} at a company called MMC.
You are chatting with coworkers in a work chat channel.
Respond naturally as yourself - just write what you would say.
Be professional but friendly. Keep responses concise (1-3 sentences).
Do NOT include any preamble like "Here's my response" or quotes around your message.
Do NOT describe what you're doing - just write your actual response.
Don't use emojis excessively.`;

    const userPrompt = `Recent conversation:
${messageHistory}

${targetMessage.senderName} just said: "${targetMessage.content}"

Write your response (just the message text, nothing else):`;

    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: model,
                prompt: userPrompt,
                system: systemPrompt,
                stream: false,
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama error: ${response.status}`);
        }

        const data = await response.json();
        const responseContent = data.response.trim();

        // Post the response
        const messageId = generateId();
        await db.insert(schema.chatMessages).values({
            id: messageId,
            channelId,
            senderId: agentId,
            content: responseContent,
            sentAt: new Date().toISOString(),
        });

        // Get model info including digest
        const modelInfo = await getModelInfo(model);

        // Record as agent event (inherit ACO from agent)
        await db.insert(schema.agentEvents).values({
            id: generateId(),
            personnelId: agentId,
            timestamp: new Date().toISOString(),
            eventType: "action",
            content: `Responded: "${responseContent}"`,
            targetEntity: `chat:${channelId}`,
            contextId,
            aco: agent.aco, // Inherit classification from agent
            metadata: JSON.stringify({ type: "message", ...modelInfo }),
        });

        // Get channel name for response
        const channels = await db
            .select()
            .from(schema.chatChannels)
            .where(eq(schema.chatChannels.id, channelId))
            .limit(1);

        return {
            responded: true,
            response: responseContent,
            channel: channels[0]?.name || channelId,
        };
    } catch (error) {
        console.error("Chat response error:", error);
        return { responded: false };
    }
}

/**
 * Process an event based on its type
 */
async function processEvent(event: schema.AgentScheduledEvent, model: string): Promise<{
    action: string;
    details: Record<string, unknown>;
    scheduleNext: boolean;
    nextTier: keyof typeof TIER_DELAYS;
}> {
    const payload = event.payload ? JSON.parse(event.payload) : null;

    switch (event.eventType) {
        case "activate": {
            // Set agent status to active
            await db
                .update(schema.personnel)
                .set({ agentStatus: "active" })
                .where(eq(schema.personnel.id, event.agentId));

            // Get agent's channel memberships
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
                .where(eq(schema.chatMembers.personnelId, event.agentId));

            // Create sync contexts and schedule check events for each channel
            const contexts: string[] = [];
            for (const membership of memberships) {
                // Import the context creation function
                const { createChatContextForAgent } = await import("@/lib/agent-context");
                const result = await createChatContextForAgent(
                    event.agentId,
                    membership.channelId,
                    "sync",
                    membership.channelName || undefined
                );
                contexts.push(membership.channelName || membership.channelId);
            }

            return {
                action: "activated",
                details: {
                    status: "active",
                    contextsJoined: contexts,
                    channelsMonitoring: contexts.length,
                },
                scheduleNext: false, // Context creation schedules the events
                nextTier: "sync",
            };
        }

        case "check_chat": {
            const result = await handleCheckChat(event.agentId, event.contextId, payload, model);
            return {
                action: result.responded ? "responded_to_chat" : "checked_chat_no_response",
                details: result,
                scheduleNext: true,
                nextTier: (payload?.tier as keyof typeof TIER_DELAYS) || "sync",
            };
        }

        case "think": {
            // Generate a random thought (existing logic)
            return {
                action: "thought",
                details: { thought: "Thinking..." },
                scheduleNext: true,
                nextTier: "async",
            };
        }

        default:
            return {
                action: "unknown_event_type",
                details: { eventType: event.eventType },
                scheduleNext: false,
                nextTier: "sync",
            };
    }
}

export async function POST(request: Request) {
    try {
        // Parse request body for model selection, or use persisted model
        let model: string | undefined;
        try {
            const body = await request.json();
            if (body.model) {
                model = body.model;
            }
        } catch {
            // No body or invalid JSON, use persisted model
        }

        // If no model provided in request, get persisted model from settings
        if (!model) {
            model = await getPersistedModel();
        }

        // Get next ready event
        const event = await getNextReadyEvent();

        if (!event) {
            // No events ready - return info about next scheduled event
            const msUntilNext = await getTimeUntilNextEvent();
            const pending = await getPendingEvents(5);

            return NextResponse.json({
                success: true,
                action: "no_events_ready",
                message: msUntilNext === null
                    ? "No events in queue"
                    : `Next event in ${Math.ceil(msUntilNext / 1000)} seconds`,
                pendingCount: pending.total,
                nextEvents: pending.events.map(e => ({
                    id: e.id,
                    type: e.eventType,
                    scheduledFor: e.scheduledFor,
                    agentId: e.agentId,
                })),
            });
        }

        // Get agent name for response
        const agents = await db
            .select({ name: schema.personnel.name })
            .from(schema.personnel)
            .where(eq(schema.personnel.id, event.agentId))
            .limit(1);

        const agentName = agents[0]?.name || event.agentId;

        // Process the event with selected model
        const result = await processEvent(event, model);

        // Mark as processed
        await markEventProcessed(event.id);

        // Schedule next event if needed
        let nextEventId: string | null = null;
        if (result.scheduleNext && event.contextId) {
            // Carry forward the context info from original event
            let payload: Record<string, unknown> | undefined;
            if (event.payload) {
                try {
                    const parsed = JSON.parse(event.payload);
                    // Only include fields that are defined
                    const fields: Record<string, unknown> = {};
                    if (parsed.contextType) fields.contextType = parsed.contextType;
                    if (parsed.relatedEntityId) fields.relatedEntityId = parsed.relatedEntityId;
                    if (parsed.targetName) fields.targetName = parsed.targetName;

                    // Only set payload if we have at least one field
                    if (Object.keys(fields).length > 0) {
                        payload = fields;
                    }
                } catch { /* ignore */ }
            }

            nextEventId = await scheduleNextContextCheck(
                event.agentId,
                event.contextId,
                event.eventType,
                result.nextTier,
                payload
            );
        }

        return NextResponse.json({
            success: true,
            eventId: event.id,
            agentId: event.agentId,
            agentName,
            eventType: event.eventType,
            action: result.action,
            details: result.details,
            nextEventId,
            nextEventIn: result.scheduleNext
                ? `${TIER_DELAYS[result.nextTier].min}-${TIER_DELAYS[result.nextTier].max} seconds`
                : null,
        });
    } catch (error) {
        console.error("Tick error:", error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
