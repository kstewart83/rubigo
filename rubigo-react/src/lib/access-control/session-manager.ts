/**
 * Session Manager
 *
 * Manages server-side security sessions with pre-validated ACO sets.
 * Sessions cache which ACO IDs the user can access for efficient query filtering.
 */

import { db } from "@/db";
import { securitySessions, acoObjects, personnel } from "@/db/schema";
import { eq, gt, inArray } from "drizzle-orm";
import { cookies } from "next/headers";
import type { SensitivityLevel } from "./types";
import { SENSITIVITY_ORDER, sensitivityIndex } from "./types";

// ============================================================================
// Constants
// ============================================================================

const SESSION_COOKIE_NAME = "rubigo_security_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// ============================================================================
// Types
// ============================================================================

export interface SecuritySession {
    id: string;
    personnelId: string | null;
    sessionLevel: SensitivityLevel;
    activeTenants: string[];
    validatedAcoIds: number[];
    highestAcoId: number;
}

// ============================================================================
// Session CRUD
// ============================================================================

/**
 * Get or create a security session for the current request.
 * Uses HttpOnly cookie to track session ID.
 */
export async function getOrCreateSession(
    personnelId: string | null,
    sessionLevel: SensitivityLevel,
    activeTenants: string[]
): Promise<SecuritySession> {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (sessionId) {
        // Try to find existing session
        const existing = await db
            .select()
            .from(securitySessions)
            .where(eq(securitySessions.id, sessionId))
            .limit(1);

        if (existing.length > 0) {
            const session = existing[0];
            // Check if session parameters match current request
            if (
                session.personnelId === personnelId &&
                session.sessionLevel === sessionLevel &&
                JSON.stringify(JSON.parse(session.activeTenants).sort()) ===
                JSON.stringify([...activeTenants].sort())
            ) {
                return {
                    id: session.id,
                    personnelId: session.personnelId,
                    sessionLevel: session.sessionLevel as SensitivityLevel,
                    activeTenants: JSON.parse(session.activeTenants),
                    validatedAcoIds: JSON.parse(session.validatedAcoIds),
                    highestAcoId: session.highestAcoId,
                };
            }
            // Parameters changed - delete old session
            await db.delete(securitySessions).where(eq(securitySessions.id, sessionId));
        }
    }

    // Create new session
    const newSessionId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Pre-validate ACOs for this session
    const { validatedIds, highestId } = await validateAllAcos(
        sessionLevel,
        activeTenants
    );

    await db.insert(securitySessions).values({
        id: newSessionId,
        personnelId,
        sessionLevel,
        activeTenants: JSON.stringify(activeTenants),
        validatedAcoIds: JSON.stringify(validatedIds),
        highestAcoId: highestId,
        createdAt: now,
        updatedAt: now,
    });

    // Set cookie
    cookieStore.set(SESSION_COOKIE_NAME, newSessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: SESSION_MAX_AGE,
        path: "/",
    });

    return {
        id: newSessionId,
        personnelId,
        sessionLevel,
        activeTenants,
        validatedAcoIds: validatedIds,
        highestAcoId: highestId,
    };
}

// ============================================================================
// ACO Validation
// ============================================================================

/**
 * Validate all ACOs against session parameters.
 * Returns list of ACO IDs the session can access.
 */
async function validateAllAcos(
    sessionLevel: SensitivityLevel,
    activeTenants: string[]
): Promise<{ validatedIds: number[]; highestId: number }> {
    const allAcos = await db.select().from(acoObjects);

    const sessionLevelIndex = sensitivityIndex(sessionLevel);
    const validatedIds: number[] = [];
    let highestId = 0;

    for (const aco of allAcos) {
        if (aco.id > highestId) {
            highestId = aco.id;
        }

        // Check sensitivity level
        const acoLevelIndex = sensitivityIndex(aco.sensitivity as SensitivityLevel);
        if (acoLevelIndex > sessionLevelIndex) {
            continue; // ACO is higher than session level
        }

        // Check tenant compartments
        const acoTenants: string[] = JSON.parse(aco.tenants);
        if (acoTenants.length > 0) {
            const hasAllTenants = acoTenants.every((t) => activeTenants.includes(t));
            if (!hasAllTenants) {
                continue; // Missing required tenant
            }
        }

        // ACO passes validation
        validatedIds.push(aco.id);
    }

    return { validatedIds, highestId };
}

/**
 * Check if session's ACO cache is stale (new ACOs exist).
 */
export async function isSessionStale(session: SecuritySession): Promise<boolean> {
    const maxAco = await db
        .select({ id: acoObjects.id })
        .from(acoObjects)
        .orderBy(acoObjects.id)
        .limit(1);

    // No ACOs exist yet
    if (maxAco.length === 0) return false;

    // Check if there are ACOs with higher IDs than what session has seen
    const newerAcos = await db
        .select({ id: acoObjects.id })
        .from(acoObjects)
        .where(gt(acoObjects.id, session.highestAcoId))
        .limit(1);

    return newerAcos.length > 0;
}

/**
 * Refresh session's validated ACO list with new ACOs.
 * Only validates ACOs newer than what session has already seen.
 */
export async function refreshSessionAcos(
    session: SecuritySession
): Promise<SecuritySession> {
    // Get new ACOs
    const newAcos = await db
        .select()
        .from(acoObjects)
        .where(gt(acoObjects.id, session.highestAcoId));

    if (newAcos.length === 0) {
        return session; // Nothing to refresh
    }

    const sessionLevelIndex = sensitivityIndex(session.sessionLevel);
    const newValidatedIds: number[] = [];
    let newHighestId = session.highestAcoId;

    for (const aco of newAcos) {
        if (aco.id > newHighestId) {
            newHighestId = aco.id;
        }

        // Check sensitivity level
        const acoLevelIndex = sensitivityIndex(aco.sensitivity as SensitivityLevel);
        if (acoLevelIndex > sessionLevelIndex) {
            continue;
        }

        // Check tenant compartments
        const acoTenants: string[] = JSON.parse(aco.tenants);
        if (acoTenants.length > 0) {
            const hasAllTenants = acoTenants.every((t) =>
                session.activeTenants.includes(t)
            );
            if (!hasAllTenants) {
                continue;
            }
        }

        newValidatedIds.push(aco.id);
    }

    // Merge with existing validated IDs
    const allValidatedIds = [...session.validatedAcoIds, ...newValidatedIds];
    const now = new Date().toISOString();

    // Update session in database
    await db
        .update(securitySessions)
        .set({
            validatedAcoIds: JSON.stringify(allValidatedIds),
            highestAcoId: newHighestId,
            updatedAt: now,
        })
        .where(eq(securitySessions.id, session.id));

    return {
        ...session,
        validatedAcoIds: allValidatedIds,
        highestAcoId: newHighestId,
    };
}

/**
 * Ensure session has fresh ACO cache, refreshing if stale.
 */
export async function ensureFreshSession(
    session: SecuritySession
): Promise<SecuritySession> {
    if (await isSessionStale(session)) {
        return refreshSessionAcos(session);
    }
    return session;
}
