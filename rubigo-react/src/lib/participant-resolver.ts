"use server";

/**
 * Participant Resolver
 * 
 * Resolves calendar event participants from the hybrid model
 * (individuals + teams) into a flat list of personnel with roles.
 */

import { db } from "@/db";
import { calendarParticipants, calendarDeviations, personnel, teams, teamMembers, teamTeams } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// ============================================================================
// Types
// ============================================================================

export type ParticipantRole = "organizer" | "required" | "optional" | "excluded";

export interface ResolvedParticipant {
    personnelId: string;
    name: string;
    email: string;
    title: string | null;
    department: string | null;
    photo: string | null;
    role: ParticipantRole;
    source: "individual" | "team";
    sourceTeamId?: string;
    sourceTeamName?: string;
}

export interface ParticipantGroup {
    id: string;
    name: string;
    isTeam: boolean;
    teamId?: string;
    role: ParticipantRole;
    memberCount?: number;
    isOrphaned?: boolean; // Team no longer exists
}

// Role priority for conflict resolution (higher index = higher priority)
const ROLE_PRIORITY: Record<ParticipantRole, number> = {
    excluded: 0,
    optional: 1,
    required: 2,
    organizer: 3,
};

// ============================================================================
// Core Resolution
// ============================================================================

/**
 * Resolves all participants for an event, expanding teams and handling deviations.
 * Returns a flat list of personnel with their effective roles.
 */
export async function resolveParticipants(
    eventId: string,
    instanceDate?: string
): Promise<{ success: boolean; data?: ResolvedParticipant[]; error?: string }> {
    try {
        // 1. Fetch base participants from master event
        const baseParticipants = await db
            .select()
            .from(calendarParticipants)
            .where(eq(calendarParticipants.eventId, eventId));

        // 2. Check for instance-specific deviations
        let deviationAdds: Array<{ personnelId?: string; teamId?: string; role: ParticipantRole }> = [];
        let deviationRemoves: string[] = [];

        if (instanceDate) {
            const deviation = await db
                .select()
                .from(calendarDeviations)
                .where(
                    and(
                        eq(calendarDeviations.eventId, eventId),
                        eq(calendarDeviations.originalDate, instanceDate)
                    )
                )
                .limit(1);

            if (deviation.length > 0 && deviation[0]) {
                if (deviation[0].participantsAdd) {
                    try {
                        deviationAdds = JSON.parse(deviation[0].participantsAdd);
                    } catch { /* ignore parse errors */ }
                }
                if (deviation[0].participantsRemove) {
                    try {
                        deviationRemoves = JSON.parse(deviation[0].participantsRemove);
                    } catch { /* ignore parse errors */ }
                }
            }
        }

        // 3. Build resolution map: personnelId -> resolved participant
        const resolved = new Map<string, ResolvedParticipant>();

        // Process base participants
        for (const p of baseParticipants) {
            if (p.personnelId) {
                // Individual participant
                await addIndividual(resolved, p.personnelId, (p.role as ParticipantRole) || "required");
            } else if (p.teamId) {
                // Team participant - expand
                await expandTeam(resolved, p.teamId, (p.role as ParticipantRole) || "required");
            }
        }

        // Process deviation adds
        for (const add of deviationAdds) {
            if (add.personnelId) {
                await addIndividual(resolved, add.personnelId, add.role);
            } else if (add.teamId) {
                await expandTeam(resolved, add.teamId, add.role);
            }
        }

        // Process deviation removes (mark as excluded)
        for (const removeId of deviationRemoves) {
            if (resolved.has(removeId)) {
                const existing = resolved.get(removeId)!;
                existing.role = "excluded";
            }
        }

        // 4. Filter out excluded and return
        const result = Array.from(resolved.values())
            .filter(p => p.role !== "excluded")
            .sort((a, b) => {
                // Sort by role priority (organizers first), then by name
                const roleDiff = ROLE_PRIORITY[b.role] - ROLE_PRIORITY[a.role];
                if (roleDiff !== 0) return roleDiff;
                return a.name.localeCompare(b.name);
            });

        return { success: true, data: result };
    } catch (error) {
        console.error("Error resolving participants:", error);
        return { success: false, error: String(error) };
    }
}

/**
 * Gets participant groups (for display before expansion).
 * Shows teams as single entries with member counts.
 */
export async function getParticipantGroups(
    eventId: string
): Promise<{ success: boolean; data?: ParticipantGroup[]; error?: string }> {
    try {
        const participants = await db
            .select()
            .from(calendarParticipants)
            .where(eq(calendarParticipants.eventId, eventId));

        const groups: ParticipantGroup[] = [];

        for (const p of participants) {
            if (p.personnelId) {
                // Individual
                const person = await db
                    .select({ name: personnel.name })
                    .from(personnel)
                    .where(eq(personnel.id, p.personnelId))
                    .limit(1);

                groups.push({
                    id: p.id,
                    name: person[0]?.name || "Unknown",
                    isTeam: false,
                    role: (p.role as ParticipantRole) || "required",
                });
            } else if (p.teamId) {
                // Team
                const team = await db
                    .select({ name: teams.name })
                    .from(teams)
                    .where(eq(teams.id, p.teamId))
                    .limit(1);

                const memberCount = await countTeamMembers(p.teamId);

                groups.push({
                    id: p.id,
                    name: team[0]?.name || "Deleted Team",
                    isTeam: true,
                    teamId: p.teamId,
                    role: (p.role as ParticipantRole) || "required",
                    memberCount,
                    isOrphaned: !team[0],
                });
            }
        }

        return { success: true, data: groups };
    } catch (error) {
        console.error("Error getting participant groups:", error);
        return { success: false, error: String(error) };
    }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Add an individual participant to the resolution map.
 * Uses highest-privilege-wins for role conflicts.
 */
async function addIndividual(
    resolved: Map<string, ResolvedParticipant>,
    personnelId: string,
    role: ParticipantRole,
    sourceTeamId?: string,
    sourceTeamName?: string
): Promise<void> {
    const person = await db
        .select()
        .from(personnel)
        .where(eq(personnel.id, personnelId))
        .limit(1);

    if (!person[0]) return;

    const existing = resolved.get(personnelId);

    if (existing) {
        // Highest privilege wins
        if (ROLE_PRIORITY[role] > ROLE_PRIORITY[existing.role]) {
            existing.role = role;
            // Keep source as individual if promoted
            if (!sourceTeamId) {
                existing.source = "individual";
                existing.sourceTeamId = undefined;
                existing.sourceTeamName = undefined;
            }
        }
    } else {
        resolved.set(personnelId, {
            personnelId,
            name: person[0].name,
            email: person[0].email,
            title: person[0].title,
            department: person[0].department,
            photo: person[0].photo,
            role,
            source: sourceTeamId ? "team" : "individual",
            sourceTeamId,
            sourceTeamName,
        });
    }
}

/**
 * Expand a team and add all members to the resolution map.
 * Recursively expands nested teams.
 */
async function expandTeam(
    resolved: Map<string, ResolvedParticipant>,
    teamId: string,
    role: ParticipantRole,
    visited = new Set<string>()
): Promise<void> {
    if (visited.has(teamId)) return; // Cycle detection
    visited.add(teamId);

    // Get team name
    const team = await db
        .select({ name: teams.name })
        .from(teams)
        .where(eq(teams.id, teamId))
        .limit(1);

    const teamName = team[0]?.name || "Unknown Team";

    // Get direct members
    const members = await db
        .select({ personnelId: teamMembers.personnelId })
        .from(teamMembers)
        .where(eq(teamMembers.teamId, teamId));

    for (const m of members) {
        await addIndividual(resolved, m.personnelId, role, teamId, teamName);
    }

    // Get child teams and recurse
    const childTeams = await db
        .select({ childTeamId: teamTeams.childTeamId })
        .from(teamTeams)
        .where(eq(teamTeams.parentTeamId, teamId));

    for (const child of childTeams) {
        await expandTeam(resolved, child.childTeamId, role, visited);
    }
}

/**
 * Count members in a team (including nested).
 */
async function countTeamMembers(
    teamId: string,
    visited = new Set<string>()
): Promise<number> {
    if (visited.has(teamId)) return 0;
    visited.add(teamId);

    const directMembers = await db
        .select({ personnelId: teamMembers.personnelId })
        .from(teamMembers)
        .where(eq(teamMembers.teamId, teamId));

    const personnelIds = new Set(directMembers.map(m => m.personnelId));

    const childTeams = await db
        .select({ childTeamId: teamTeams.childTeamId })
        .from(teamTeams)
        .where(eq(teamTeams.parentTeamId, teamId));

    for (const child of childTeams) {
        const childCount = await countTeamMembersWithIds(child.childTeamId, visited);
        for (const id of childCount) {
            personnelIds.add(id);
        }
    }

    return personnelIds.size;
}

async function countTeamMembersWithIds(
    teamId: string,
    visited: Set<string>
): Promise<Set<string>> {
    if (visited.has(teamId)) return new Set();
    visited.add(teamId);

    const directMembers = await db
        .select({ personnelId: teamMembers.personnelId })
        .from(teamMembers)
        .where(eq(teamMembers.teamId, teamId));

    const personnelIds = new Set(directMembers.map(m => m.personnelId));

    const childTeams = await db
        .select({ childTeamId: teamTeams.childTeamId })
        .from(teamTeams)
        .where(eq(teamTeams.parentTeamId, teamId));

    for (const child of childTeams) {
        const childIds = await countTeamMembersWithIds(child.childTeamId, visited);
        for (const id of childIds) {
            personnelIds.add(id);
        }
    }

    return personnelIds;
}
