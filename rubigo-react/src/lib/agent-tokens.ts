/**
 * Agent Token Management
 * 
 * Provides per-agent API authentication tokens so agent actions
 * are logged under their identity, not the Global Administrator.
 */

import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Generate a random API token (32 hex characters)
 */
function generateToken(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate a short unique ID
 */
function generateId(): string {
    return Math.random().toString(36).substring(2, 10);
}

/**
 * Create an API session for an agent
 * Returns the token that the agent should use for API requests
 */
export async function createAgentSession(personnelId: string): Promise<string> {
    // Check if there's already an active session for this agent
    const existing = await db
        .select()
        .from(schema.agentSessions)
        .where(
            and(
                eq(schema.agentSessions.personnelId, personnelId),
                eq(schema.agentSessions.isActive, 1)
            )
        )
        .limit(1);

    // If active session exists, return its token
    if (existing.length > 0) {
        return existing[0].token;
    }

    // Create new session
    const token = generateToken();
    const session: schema.NewAgentSession = {
        id: generateId(),
        personnelId,
        token,
        createdAt: new Date().toISOString(),
        isActive: 1,
    };

    await db.insert(schema.agentSessions).values(session);

    return token;
}

/**
 * Validate an agent token and return the agent's info if valid
 */
export interface AgentAuthResult {
    valid: boolean;
    personnelId?: string;
    personnelName?: string;
    error?: string;
}

export async function validateAgentToken(token: string | null): Promise<AgentAuthResult> {
    if (!token) {
        return { valid: false, error: "No token provided" };
    }

    // Find the session
    const sessions = await db
        .select({
            session: schema.agentSessions,
            personnel: schema.personnel,
        })
        .from(schema.agentSessions)
        .innerJoin(
            schema.personnel,
            eq(schema.agentSessions.personnelId, schema.personnel.id)
        )
        .where(
            and(
                eq(schema.agentSessions.token, token),
                eq(schema.agentSessions.isActive, 1)
            )
        )
        .limit(1);

    if (sessions.length === 0) {
        return { valid: false, error: "Invalid or expired token" };
    }

    const { personnel } = sessions[0];

    return {
        valid: true,
        personnelId: personnel.id,
        personnelName: personnel.name,
    };
}

/**
 * Revoke an agent session (deactivate without deleting)
 */
export async function revokeAgentSession(sessionId: string): Promise<boolean> {
    const result = await db
        .update(schema.agentSessions)
        .set({ isActive: 0 })
        .where(eq(schema.agentSessions.id, sessionId));

    return true;
}

/**
 * Revoke all sessions for a specific agent
 */
export async function revokeAllAgentSessions(personnelId: string): Promise<number> {
    const result = await db
        .update(schema.agentSessions)
        .set({ isActive: 0 })
        .where(eq(schema.agentSessions.personnelId, personnelId));

    return 1; // Drizzle doesn't return affected count easily, placeholder
}

/**
 * Get or create a session for an agent
 * This is the main function to call when an agent needs to make API requests
 */
export async function getAgentToken(personnelId: string): Promise<string> {
    return createAgentSession(personnelId);
}
