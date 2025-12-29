/**
 * Presence Tracking - Track user online/away/offline status
 * 
 * Status rules:
 * - online: heartbeat within last 2 minutes
 * - away: heartbeat within last 5 minutes
 * - offline: no heartbeat for 5+ minutes
 */

import { db } from "@/db";
import { userPresence, personnel } from "@/db/schema";
import { eq, lt, and } from "drizzle-orm";
import { emitBroadcast } from "./emit-event";

// Thresholds in milliseconds
const ONLINE_THRESHOLD = 2 * 60 * 1000; // 2 minutes
const AWAY_THRESHOLD = 5 * 60 * 1000; // 5 minutes

export type PresenceStatus = "online" | "away" | "offline";

/**
 * Update heartbeat for a personnel
 * Called from client on activity or periodic ping
 * 
 * Only emits presence.update event if status actually changed
 */
export async function updatePresence(
    personnelId: string,
    sessionId: string
): Promise<PresenceStatus> {
    const now = new Date().toISOString();

    // Check current status before update
    const existing = await db
        .select({ lastSeen: userPresence.lastSeen })
        .from(userPresence)
        .where(eq(userPresence.personnelId, personnelId))
        .get();

    const previousStatus = existing ? calculateStatus(existing.lastSeen) : "offline";

    // Upsert presence record
    await db
        .insert(userPresence)
        .values({
            personnelId,
            sessionId,
            status: "online",
            lastSeen: now,
        })
        .onConflictDoUpdate({
            target: userPresence.personnelId,
            set: {
                sessionId,
                status: "online",
                lastSeen: now,
            },
        });

    // Only emit event if status changed (e.g., offline → online, away → online)
    if (previousStatus !== "online") {
        await emitBroadcast("presence.update", {
            personnelId,
            status: "online",
            lastSeen: now,
        });
    }

    return "online";
}

/**
 * Get presence status for a personnel
 */
export async function getPresenceStatus(personnelId: string): Promise<PresenceStatus> {
    const presence = await db
        .select()
        .from(userPresence)
        .where(eq(userPresence.personnelId, personnelId))
        .get();

    if (!presence) {
        return "offline";
    }

    return calculateStatus(presence.lastSeen);
}

/**
 * Calculate status from lastSeen timestamp
 */
function calculateStatus(lastSeen: string): PresenceStatus {
    const lastSeenTime = new Date(lastSeen).getTime();
    const now = Date.now();
    const elapsed = now - lastSeenTime;

    if (elapsed < ONLINE_THRESHOLD) {
        return "online";
    } else if (elapsed < AWAY_THRESHOLD) {
        return "away";
    } else {
        return "offline";
    }
}

/**
 * Get all online/away users
 * Returns stored status directly (preserves manual overrides)
 */
export async function getActiveUsers(): Promise<Array<{
    personnelId: string;
    status: PresenceStatus;
    lastSeen: string;
}>> {
    // Get all presence records
    const presences = await db
        .select()
        .from(userPresence)
        .all();

    // Return stored status (don't recalculate - preserves manual overrides)
    // Filter out offline entries (they shouldn't be in the table anyway, but just in case)
    return presences
        .filter(p => p.status !== "offline")
        .map(p => ({
            personnelId: p.personnelId,
            status: p.status as PresenceStatus,
            lastSeen: p.lastSeen,
        }));
}

/**
 * Mark personnel as offline (explicit sign-out)
 */
export async function markOffline(personnelId: string): Promise<void> {
    await db
        .delete(userPresence)
        .where(eq(userPresence.personnelId, personnelId));

    await emitBroadcast("presence.update", {
        personnelId,
        status: "offline",
        lastSeen: new Date().toISOString(),
    });
}

/**
 * Cleanup stale presence records
 * Should be called periodically (e.g., from a cron job)
 */
export async function cleanupStalePresence(): Promise<number> {
    const staleThreshold = new Date(Date.now() - AWAY_THRESHOLD * 2).toISOString();

    const staleRecords = await db
        .select()
        .from(userPresence)
        .where(lt(userPresence.lastSeen, staleThreshold))
        .all();

    for (const record of staleRecords) {
        await db
            .delete(userPresence)
            .where(eq(userPresence.personnelId, record.personnelId));

        await emitBroadcast("presence.update", {
            personnelId: record.personnelId,
            status: "offline",
            lastSeen: record.lastSeen,
        });
    }

    return staleRecords.length;
}
