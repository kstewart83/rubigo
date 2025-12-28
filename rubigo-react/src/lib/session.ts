/**
 * Session Helper for API Routes
 * 
 * Simple helper to get session info from cookies for SSE and presence endpoints.
 * Checks both security session and persona cookies.
 */

import { db } from "@/db";
import { securitySessions, personnel } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "rubigo_security_session";
const PERSONA_COOKIE_NAME = "rubigo_persona_id";

export interface SessionInfo {
    id: string;
    personnelId: string | null;
}

/**
 * Get session from request cookies
 * Tries security session first, falls back to persona cookie
 * Returns null if no valid session found
 */
export async function getSession(request?: Request): Promise<SessionInfo | null> {
    // Get cookie values
    let sessionId: string | undefined;
    let personaId: string | undefined;

    if (request) {
        // Try to get from request Cookie header (for SSE which can't use next/headers)
        const cookieHeader = request.headers.get("cookie");
        if (cookieHeader) {
            const sessionMatch = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
            sessionId = sessionMatch?.[1];

            const personaMatch = cookieHeader.match(new RegExp(`${PERSONA_COOKIE_NAME}=([^;]+)`));
            personaId = personaMatch?.[1] ? decodeURIComponent(personaMatch[1]) : undefined;
        }
    } else {
        // Use next/headers for normal Route Handlers
        const cookieStore = await cookies();
        sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
        const personaCookie = cookieStore.get(PERSONA_COOKIE_NAME)?.value;
        personaId = personaCookie ? decodeURIComponent(personaCookie) : undefined;
    }

    // Try security session first
    if (sessionId) {
        const session = await db
            .select({
                id: securitySessions.id,
                personnelId: securitySessions.personnelId,
            })
            .from(securitySessions)
            .where(eq(securitySessions.id, sessionId))
            .get();

        if (session) {
            return {
                id: session.id,
                personnelId: session.personnelId,
            };
        }
    }

    // Fallback to persona cookie
    if (personaId) {
        // Verify personnel exists
        const person = await db
            .select({ id: personnel.id })
            .from(personnel)
            .where(eq(personnel.id, personaId))
            .get();

        if (person) {
            // Generate a synthetic session ID based on persona
            return {
                id: `persona_${personaId}`,
                personnelId: personaId,
            };
        }
    }

    return null;
}

