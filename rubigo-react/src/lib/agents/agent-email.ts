/**
 * Agent Email Integration - Handle email observations and responses
 * 
 * Provides functions for agents to interact with the email system.
 */

import { generateText, getOllamaModel, checkOllamaHealth } from "./ai-sdk";
import { buildEmailResponsePrompt } from "./agent-persona";
import type { AgentAction, ActionResult } from "./agent-types";

export interface EmailObservation {
    emailId: string;
    threadId: string;
    fromId: string;
    fromName: string;
    subject: string;
    body: string;
    isReply: boolean;
    receivedAt: string;
}

export interface AgentEmailContext {
    agentId: string;
    agentName: string;
    persona: string;
    email: string; // Agent's email address
}

/**
 * Determine if an agent should respond to an email
 */
export function shouldRespondToEmail(observation: EmailObservation, context: AgentEmailContext): boolean {
    // Don't respond to own emails
    if (observation.fromId === context.agentId) {
        return false;
    }

    // Analyze subject/body for urgency keywords
    const urgentKeywords = ["urgent", "asap", "immediately", "critical", "important"];
    const textToCheck = `${observation.subject} ${observation.body}`.toLowerCase();
    const isUrgent = urgentKeywords.some(kw => textToCheck.includes(kw));

    // Check if it's a question that needs response
    const isQuestion = observation.body.includes("?") ||
        textToCheck.includes("please") ||
        textToCheck.includes("could you") ||
        textToCheck.includes("can you");

    // Respond to urgent emails and direct questions
    return isUrgent || isQuestion;
}

/**
 * Generate an email response using the LLM
 */
export async function generateEmailResponse(
    observation: EmailObservation,
    context: AgentEmailContext
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

    // Build prompt
    const prompt = buildEmailResponsePrompt(
        context.persona,
        observation.subject,
        observation.body,
        observation.fromName
    );

    try {
        // Generate response using AI SDK
        const { text } = await generateText({
            model: getOllamaModel(),
            prompt,
            temperature: 0.6, // More formal for email
            maxOutputTokens: 400, // Emails can be longer
        });

        const action: AgentAction = {
            type: "send_email",
            targetEntity: `email:${observation.emailId}`,
            content: text?.trim() || "",
            metadata: {
                replyToEmailId: observation.emailId,
                threadId: observation.threadId,
                subject: observation.subject.startsWith("Re:")
                    ? observation.subject
                    : `Re: ${observation.subject}`,
                toId: observation.fromId,
            },
        };

        return {
            success: true,
            action,
            thought: `Replying to email from ${observation.fromName}: "${observation.subject}"`,
            response: text,
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
 * Check inbox for unread emails that need attention
 */
export async function checkInbox(
    emails: EmailObservation[],
    context: AgentEmailContext
): Promise<EmailObservation[]> {
    // Filter to emails that need response
    return emails.filter(email => shouldRespondToEmail(email, context));
}

/**
 * Create an email observation from raw event data
 */
export function createEmailObservation(eventPayload: Record<string, unknown>): EmailObservation {
    return {
        emailId: String(eventPayload.emailId || ""),
        threadId: String(eventPayload.threadId || ""),
        fromId: String(eventPayload.fromId || ""),
        fromName: String(eventPayload.fromName || "Someone"),
        subject: String(eventPayload.subject || "No Subject"),
        body: String(eventPayload.body || ""),
        isReply: Boolean(eventPayload.isReply),
        receivedAt: String(eventPayload.receivedAt || new Date().toISOString()),
    };
}

/**
 * Generate a draft email (not a reply)
 */
export async function generateDraftEmail(
    context: AgentEmailContext,
    recipientName: string,
    topic: string
): Promise<ActionResult> {
    const startTime = Date.now();

    const health = await checkOllamaHealth();
    if (!health.available) {
        return {
            success: false,
            action: { type: "wait" },
            error: `Ollama unavailable: ${health.error}`,
            durationMs: Date.now() - startTime,
        };
    }

    const prompt = `${context.persona}

---
You need to write an email to ${recipientName} about: ${topic}

Write a professional email including subject line and body. Be concise but thorough.

Format:
Subject: [Your subject line]

[Email body with greeting and sign-off]`;

    try {
        const { text } = await generateText({
            model: getOllamaModel(),
            prompt,
            temperature: 0.6,
            maxOutputTokens: 400,
        });

        // Parse subject from response
        const subjectMatch = text?.match(/Subject:\s*(.+?)(?:\n|$)/i);
        const subject = subjectMatch ? subjectMatch[1].trim() : topic;
        const body = text?.replace(/Subject:\s*.+?\n/i, "").trim() || "";

        const action: AgentAction = {
            type: "send_email",
            content: body,
            metadata: {
                subject,
                isDraft: true,
            },
        };

        return {
            success: true,
            action,
            thought: `Drafting email to ${recipientName} about: ${topic}`,
            response: text,
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
