/**
 * Agent Persona - Prompt templates for agent simulation
 * 
 * Generates system prompts based on personnel data to give agents
 * unique personalities derived from their bio and role.
 */

import type { personnel } from "@/db/schema";

type Personnel = typeof personnel.$inferSelect;

export interface PersonaTraits {
    role: string;
    expertise: string[];
    communicationStyle: string;
    personality: string[];
    context: string;
}

/**
 * Extract persona traits from personnel bio and metadata
 */
export function extractPersonaTraits(personnel: Personnel): PersonaTraits {
    const bio = personnel.bio || "";
    const title = personnel.title || "Employee";
    const department = personnel.department || "General";

    // Extract expertise keywords from bio
    const expertisePatterns = [
        /(?:expertise in|experienced in|specializ(?:es|ing) in|background in)\s+([^.]+)/gi,
        /(?:years? (?:of )?experience (?:in|with))\s+([^.]+)/gi,
        /(?:skilled in|proficient in)\s+([^.]+)/gi,
    ];

    const expertise: string[] = [];
    for (const pattern of expertisePatterns) {
        const matches = bio.matchAll(pattern);
        for (const match of matches) {
            expertise.push(match[1].trim());
        }
    }

    // If no explicit expertise found, derive from title/department
    if (expertise.length === 0) {
        expertise.push(`${department} operations`);
        if (title.toLowerCase().includes("senior") || title.toLowerCase().includes("lead")) {
            expertise.push("team leadership");
        }
    }

    // Extract personality hints from bio
    const personality: string[] = [];
    const personalityKeywords: Record<string, string[]> = {
        analytical: ["analytical", "detail-oriented", "methodical", "systematic"],
        creative: ["creative", "innovative", "visionary", "imaginative"],
        collaborative: ["team player", "collaborative", "supportive", "mentoring"],
        driven: ["driven", "ambitious", "passionate", "dedicated"],
        practical: ["practical", "pragmatic", "results-oriented", "hands-on"],
    };

    const bioLower = bio.toLowerCase();
    for (const [trait, keywords] of Object.entries(personalityKeywords)) {
        if (keywords.some((kw) => bioLower.includes(kw))) {
            personality.push(trait);
        }
    }

    // Default personality if none detected
    if (personality.length === 0) {
        personality.push("professional", "helpful");
    }

    // Determine communication style
    let communicationStyle = "professional and concise";
    if (title.toLowerCase().includes("executive") || title.toLowerCase().includes("director")) {
        communicationStyle = "strategic and leadership-focused";
    } else if (department.toLowerCase() === "engineering") {
        communicationStyle = "technical and precise";
    } else if (department.toLowerCase() === "sales" || department.toLowerCase() === "marketing") {
        communicationStyle = "engaging and persuasive";
    } else if (department.toLowerCase() === "hr") {
        communicationStyle = "empathetic and supportive";
    }

    return {
        role: `${title} in ${department}`,
        expertise,
        communicationStyle,
        personality,
        context: bio.slice(0, 200), // First 200 chars of bio for context
    };
}

/**
 * Build the system prompt for an agent's persona
 */
export function buildPersonaPrompt(personnel: Personnel): string {
    const traits = extractPersonaTraits(personnel);

    return `You are ${personnel.name}, a ${traits.role} at MMC.

BACKGROUND:
${traits.context || "A dedicated professional committed to excellence."}

EXPERTISE: ${traits.expertise.join(", ")}

COMMUNICATION STYLE: ${traits.communicationStyle}

PERSONALITY TRAITS: ${traits.personality.join(", ")}

IMPORTANT GUIDELINES:
- Stay in character as ${personnel.name} at all times
- Respond naturally based on your role and expertise
- Keep responses concise and relevant to the workplace context
- Show awareness of your colleagues and organizational dynamics
- Be helpful but maintain professional boundaries`;
}

/**
 * ReAct prompt template for agent reasoning
 * 
 * Uses the Reason + Act framework for structured agent behavior:
 * - Observation: What the agent perceives
 * - Thought: Agent's reasoning about the observation
 * - Action: What the agent decides to do
 */
export function buildReActPrompt(
    personaPrompt: string,
    observation: string,
    context?: {
        currentTime?: string;
        location?: string;
        recentActions?: string[];
        conversationHistory?: string;
    }
): string {
    const timeContext = context?.currentTime
        ? `Current time: ${context.currentTime}`
        : "";
    const locationContext = context?.location
        ? `Location: ${context.location}`
        : "";
    const recentContext = context?.recentActions?.length
        ? `\nRecent actions:\n${context.recentActions.map((a) => `- ${a}`).join("\n")}`
        : "";
    const conversationContext = context?.conversationHistory
        ? `\nConversation so far:\n${context.conversationHistory}`
        : "";

    return `${personaPrompt}

---
CURRENT SITUATION:
${timeContext}
${locationContext}
${recentContext}
${conversationContext}

OBSERVATION:
${observation}

---
Based on your persona and the observation above, provide your response in the following format:

THOUGHT: [Your internal reasoning about this situation. Consider your role, expertise, and how you would naturally respond. Keep this brief - 1-2 sentences.]

ACTION: [What you will do. Be specific. Options include: RESPOND (with message), WAIT, IGNORE, DELEGATE, ASK_CLARIFICATION]

RESPONSE: [If ACTION is RESPOND, write your actual message here. Keep it natural and in-character.]`;
}

/**
 * Parse a ReAct-style response from the LLM
 */
export interface ParsedReActResponse {
    thought: string;
    action: string;
    response?: string;
    raw: string;
}

export function parseReActResponse(llmOutput: string): ParsedReActResponse {
    const raw = llmOutput.trim();

    // Extract thought (use [\s\S] instead of /s flag for compatibility)
    const thoughtMatch = raw.match(/THOUGHT:\s*([\s\S]+?)(?=\nACTION:|$)/);
    const thought = thoughtMatch ? thoughtMatch[1].trim() : "";

    // Extract action
    const actionMatch = raw.match(/ACTION:\s*([\s\S]+?)(?=\nRESPONSE:|$)/);
    const action = actionMatch ? actionMatch[1].trim() : "WAIT";

    // Extract response if present
    const responseMatch = raw.match(/RESPONSE:\s*([\s\S]+?)$/);
    const response = responseMatch ? responseMatch[1].trim() : undefined;

    return { thought, action, response, raw };
}

/**
 * Generate a chat response prompt (simpler than full ReAct)
 */
export function buildChatResponsePrompt(
    personaPrompt: string,
    channelName: string,
    messageContent: string,
    senderName: string,
    recentMessages?: Array<{ sender: string; content: string }>
): string {
    const historyContext = recentMessages?.length
        ? `\nRecent messages in #${channelName}:\n${recentMessages
            .slice(-5)
            .map((m) => `${m.sender}: ${m.content}`)
            .join("\n")}\n`
        : "";

    return `${personaPrompt}

---
You are participating in the #${channelName} chat channel.
${historyContext}
${senderName} just sent: "${messageContent}"

Write a natural, in-character reply. Keep it conversational and appropriate for workplace chat (1-3 sentences max).

Your reply:`;
}

/**
 * Generate an email response prompt
 */
export function buildEmailResponsePrompt(
    personaPrompt: string,
    subject: string,
    body: string,
    senderName: string
): string {
    return `${personaPrompt}

---
You received this email:

From: ${senderName}
Subject: ${subject}

${body}

---
Write a professional email reply. Be concise but thorough. Include appropriate greeting and sign-off.

Your reply:`;
}
