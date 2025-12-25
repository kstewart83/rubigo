"use server";

/**
 * Teams Server Actions
 * 
 * CRUD operations for ad-hoc teams within the Personnel module.
 * Supports hierarchical team nesting with cycle detection.
 */

import { db } from "@/db";
import { teams, teamMembers, teamTeams, teamOwners, personnel, Team, TeamMember } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

const MAX_TEAM_DEPTH = 5;

// ============================================================================
// Types
// ============================================================================

export interface TeamWithMembers extends Team {
    members: Array<{
        id: string;
        personnelId: string;
        personnelName: string;
        personnelPhoto: string | null;
        joinedAt: string;
    }>;
    childTeams: Array<{
        id: string;
        childTeamId: string;
        childTeamName: string;
        addedAt: string;
    }>;
    owners: Array<{
        id: string;
        personnelId: string;
        personnelName: string;
        addedAt: string;
    }>;
    memberCount: number;
    childTeamCount: number;
    totalPersonnelCount: number;  // Includes all nested team members
}

// ============================================================================
// Read Operations
// ============================================================================

/**
 * Get all teams with member counts and child teams
 */
export async function getTeams(): Promise<{ success: boolean; data?: TeamWithMembers[]; error?: string }> {
    try {
        const allTeams = await db.select().from(teams).orderBy(desc(teams.createdAt));

        // Helper to recursively count all personnel in a team (including nested)
        async function countTotalPersonnel(teamId: string, visited = new Set<string>()): Promise<number> {
            if (visited.has(teamId)) return 0;
            visited.add(teamId);

            // Count direct members
            const directMembers = await db
                .select({ personnelId: teamMembers.personnelId })
                .from(teamMembers)
                .where(eq(teamMembers.teamId, teamId));

            const personnelIds = new Set(directMembers.map(m => m.personnelId));

            // Get child teams and recurse
            const childTeamsResult = await db
                .select({ childTeamId: teamTeams.childTeamId })
                .from(teamTeams)
                .where(eq(teamTeams.parentTeamId, teamId));

            for (const child of childTeamsResult) {
                const childPersonnelCount = await countTotalPersonnelIds(child.childTeamId, visited);
                for (const id of childPersonnelCount) {
                    personnelIds.add(id);
                }
            }

            return personnelIds.size;
        }

        // Returns set of personnel IDs for deduplication
        async function countTotalPersonnelIds(teamId: string, visited = new Set<string>()): Promise<Set<string>> {
            if (visited.has(teamId)) return new Set();
            visited.add(teamId);

            const directMembers = await db
                .select({ personnelId: teamMembers.personnelId })
                .from(teamMembers)
                .where(eq(teamMembers.teamId, teamId));

            const personnelIds = new Set(directMembers.map(m => m.personnelId));

            const childTeamsResult = await db
                .select({ childTeamId: teamTeams.childTeamId })
                .from(teamTeams)
                .where(eq(teamTeams.parentTeamId, teamId));

            for (const child of childTeamsResult) {
                const childIds = await countTotalPersonnelIds(child.childTeamId, visited);
                for (const id of childIds) {
                    personnelIds.add(id);
                }
            }

            return personnelIds;
        }

        const teamsWithMembers: TeamWithMembers[] = await Promise.all(
            allTeams.map(async (team) => {
                // Get personnel members
                const members = await db
                    .select({
                        id: teamMembers.id,
                        personnelId: teamMembers.personnelId,
                        personnelName: personnel.name,
                        personnelPhoto: personnel.photo,
                        joinedAt: teamMembers.joinedAt,
                    })
                    .from(teamMembers)
                    .innerJoin(personnel, eq(teamMembers.personnelId, personnel.id))
                    .where(eq(teamMembers.teamId, team.id));

                // Get child teams
                const childTeamsData = await db
                    .select({
                        id: teamTeams.id,
                        childTeamId: teamTeams.childTeamId,
                        childTeamName: teams.name,
                        addedAt: teamTeams.addedAt,
                    })
                    .from(teamTeams)
                    .innerJoin(teams, eq(teamTeams.childTeamId, teams.id))
                    .where(eq(teamTeams.parentTeamId, team.id));

                // Get owners
                const owners = await db
                    .select({
                        id: teamOwners.id,
                        personnelId: teamOwners.personnelId,
                        personnelName: personnel.name,
                        addedAt: teamOwners.addedAt,
                    })
                    .from(teamOwners)
                    .innerJoin(personnel, eq(teamOwners.personnelId, personnel.id))
                    .where(eq(teamOwners.teamId, team.id));

                // Calculate total personnel including nested teams
                const totalPersonnelIds = await countTotalPersonnelIds(team.id, new Set());

                return {
                    ...team,
                    members,
                    childTeams: childTeamsData,
                    owners,
                    memberCount: members.length,
                    childTeamCount: childTeamsData.length,
                    totalPersonnelCount: totalPersonnelIds.size,
                };
            })
        );

        return { success: true, data: teamsWithMembers };
    } catch (error) {
        console.error("Failed to get teams:", error);
        return { success: false, error: "Failed to get teams" };
    }
}

/**
 * Get team by ID with full member and child team details
 */
export async function getTeam(id: string): Promise<{ success: boolean; data?: TeamWithMembers; error?: string }> {
    try {
        const [team] = await db.select().from(teams).where(eq(teams.id, id));
        if (!team) {
            return { success: false, error: "Team not found" };
        }

        // Get personnel members
        const members = await db
            .select({
                id: teamMembers.id,
                personnelId: teamMembers.personnelId,
                personnelName: personnel.name,
                personnelPhoto: personnel.photo,
                joinedAt: teamMembers.joinedAt,
            })
            .from(teamMembers)
            .innerJoin(personnel, eq(teamMembers.personnelId, personnel.id))
            .where(eq(teamMembers.teamId, id));

        // Get child teams
        const childTeamsData = await db
            .select({
                id: teamTeams.id,
                childTeamId: teamTeams.childTeamId,
                childTeamName: teams.name,
                addedAt: teamTeams.addedAt,
            })
            .from(teamTeams)
            .innerJoin(teams, eq(teamTeams.childTeamId, teams.id))
            .where(eq(teamTeams.parentTeamId, id));

        // Get owners
        const owners = await db
            .select({
                id: teamOwners.id,
                personnelId: teamOwners.personnelId,
                personnelName: personnel.name,
                addedAt: teamOwners.addedAt,
            })
            .from(teamOwners)
            .innerJoin(personnel, eq(teamOwners.personnelId, personnel.id))
            .where(eq(teamOwners.teamId, id));

        // Calculate total personnel including nested teams (reuse logic from getTeams)
        async function countTotalPersonnelIds(teamId: string, visited = new Set<string>()): Promise<Set<string>> {
            if (visited.has(teamId)) return new Set();
            visited.add(teamId);

            const directMembers = await db
                .select({ personnelId: teamMembers.personnelId })
                .from(teamMembers)
                .where(eq(teamMembers.teamId, teamId));

            const personnelIds = new Set(directMembers.map(m => m.personnelId));

            const childTeamsResult = await db
                .select({ childTeamId: teamTeams.childTeamId })
                .from(teamTeams)
                .where(eq(teamTeams.parentTeamId, teamId));

            for (const child of childTeamsResult) {
                const childIds = await countTotalPersonnelIds(child.childTeamId, visited);
                for (const pid of childIds) {
                    personnelIds.add(pid);
                }
            }

            return personnelIds;
        }

        const totalPersonnelIds = await countTotalPersonnelIds(id, new Set());

        return {
            success: true,
            data: {
                ...team,
                members,
                childTeams: childTeamsData,
                owners,
                memberCount: members.length,
                childTeamCount: childTeamsData.length,
                totalPersonnelCount: totalPersonnelIds.size,
            },
        };
    } catch (error) {
        console.error("Failed to get team:", error);
        return { success: false, error: "Failed to get team" };
    }
}

/**
 * Get all teams a personnel belongs to (as member or owner)
 */
export async function getTeamsForPersonnel(personnelId: string): Promise<{
    success: boolean;
    data?: Array<{
        id: string;
        name: string;
        description: string | null;
        isOwner: boolean;
    }>;
    error?: string;
}> {
    try {
        // Get teams where personnel is a member
        const memberTeams = await db
            .select({
                id: teams.id,
                name: teams.name,
                description: teams.description,
            })
            .from(teamMembers)
            .innerJoin(teams, eq(teamMembers.teamId, teams.id))
            .where(eq(teamMembers.personnelId, personnelId));

        // Get teams where personnel is an owner
        const ownerTeamIds = await db
            .select({ teamId: teamOwners.teamId })
            .from(teamOwners)
            .where(eq(teamOwners.personnelId, personnelId));

        const ownerIdSet = new Set(ownerTeamIds.map(o => o.teamId));

        // Combine and dedupe
        const teamsMap = new Map<string, { id: string; name: string; description: string | null; isOwner: boolean }>();

        for (const t of memberTeams) {
            teamsMap.set(t.id, {
                ...t,
                isOwner: ownerIdSet.has(t.id),
            });
        }

        // Also add teams where they're owner but not member
        if (ownerTeamIds.length > 0) {
            const ownerOnlyTeams = await db
                .select({
                    id: teams.id,
                    name: teams.name,
                    description: teams.description,
                })
                .from(teams)
                .where(eq(teams.id, ownerTeamIds[0]?.teamId || ''));

            // Fetch all owner teams
            for (const ownerTeamId of ownerTeamIds) {
                if (!teamsMap.has(ownerTeamId.teamId)) {
                    const [team] = await db
                        .select({
                            id: teams.id,
                            name: teams.name,
                            description: teams.description,
                        })
                        .from(teams)
                        .where(eq(teams.id, ownerTeamId.teamId));

                    if (team) {
                        teamsMap.set(team.id, {
                            ...team,
                            isOwner: true,
                        });
                    }
                }
            }
        }

        return {
            success: true,
            data: Array.from(teamsMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
        };
    } catch (error) {
        console.error("Failed to get teams for personnel:", error);
        return { success: false, error: "Failed to get teams for personnel" };
    }
}

// ============================================================================
// Create Operations
// ============================================================================

/**
 * Create a new team
 */
export async function createTeam(data: {
    name: string;
    description?: string;
    createdBy?: string;
    memberIds?: string[];
    aco?: string;
}): Promise<{ success: boolean; data?: Team; error?: string }> {
    try {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        const [team] = await db.insert(teams).values({
            id,
            name: data.name,
            description: data.description || null,
            createdBy: data.createdBy || null,
            createdAt: now,
            aco: data.aco || JSON.stringify({ sensitivity: "low" }),
        }).returning();

        // Add initial members if provided
        if (data.memberIds && data.memberIds.length > 0) {
            await db.insert(teamMembers).values(
                data.memberIds.map(personnelId => ({
                    id: crypto.randomUUID(),
                    teamId: id,
                    personnelId,
                    joinedAt: now,
                }))
            );
        }

        // Add creator as owner automatically
        if (data.createdBy) {
            await db.insert(teamOwners).values({
                id: crypto.randomUUID(),
                teamId: id,
                personnelId: data.createdBy,
                addedAt: now,
            });
        }

        return { success: true, data: team };
    } catch (error) {
        console.error("Failed to create team:", error);
        return { success: false, error: "Failed to create team" };
    }
}

// ============================================================================
// Update Operations
// ============================================================================

/**
 * Update team details
 */
export async function updateTeam(
    id: string,
    data: { name?: string; description?: string; aco?: string }
): Promise<{ success: boolean; error?: string }> {
    try {
        await db.update(teams).set(data).where(eq(teams.id, id));
        return { success: true };
    } catch (error) {
        console.error("Failed to update team:", error);
        return { success: false, error: "Failed to update team" };
    }
}

/**
 * Add member to team
 */
export async function addTeamMember(
    teamId: string,
    personnelId: string
): Promise<{ success: boolean; data?: TeamMember; error?: string }> {
    try {
        const [member] = await db.insert(teamMembers).values({
            id: crypto.randomUUID(),
            teamId,
            personnelId,
            joinedAt: new Date().toISOString(),
        }).returning();

        return { success: true, data: member };
    } catch (error) {
        console.error("Failed to add team member:", error);
        return { success: false, error: "Failed to add team member" };
    }
}

/**
 * Remove member from team
 */
export async function removeTeamMember(
    teamId: string,
    personnelId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        await db
            .delete(teamMembers)
            .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.personnelId, personnelId)));

        return { success: true };
    } catch (error) {
        console.error("Failed to remove team member:", error);
        return { success: false, error: "Failed to remove team member" };
    }
}

/**
 * Set all members for a team (replaces existing)
 */
export async function setTeamMembers(
    teamId: string,
    personnelIds: string[]
): Promise<{ success: boolean; error?: string }> {
    try {
        const now = new Date().toISOString();

        // Delete existing members
        await db.delete(teamMembers).where(eq(teamMembers.teamId, teamId));

        // Add new members
        if (personnelIds.length > 0) {
            await db.insert(teamMembers).values(
                personnelIds.map(personnelId => ({
                    id: crypto.randomUUID(),
                    teamId,
                    personnelId,
                    joinedAt: now,
                }))
            );
        }

        return { success: true };
    } catch (error) {
        console.error("Failed to set team members:", error);
        return { success: false, error: "Failed to set team members" };
    }
}

// ============================================================================
// Delete Operations
// ============================================================================

/**
 * Delete a team (members cascade delete)
 */
export async function deleteTeam(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await db.delete(teams).where(eq(teams.id, id));
        return { success: true };
    } catch (error) {
        console.error("Failed to delete team:", error);
        return { success: false, error: "Failed to delete team" };
    }
}

// ============================================================================
// Hierarchical Team Operations
// ============================================================================

/**
 * Check if adding childTeamId under parentTeamId would create a cycle
 * Uses BFS to check if parentTeamId exists anywhere in childTeamId's subtree
 */
async function wouldCreateCycle(parentTeamId: string, childTeamId: string): Promise<boolean> {
    if (parentTeamId === childTeamId) return true;

    const visited = new Set<string>();
    const queue = [childTeamId];

    while (queue.length > 0) {
        const current = queue.shift()!;
        if (current === parentTeamId) return true;
        if (visited.has(current)) continue;
        visited.add(current);

        // Get teams that current team contains
        const children = await db
            .select({ childTeamId: teamTeams.childTeamId })
            .from(teamTeams)
            .where(eq(teamTeams.parentTeamId, current));

        queue.push(...children.map(c => c.childTeamId));
    }

    return false;
}

/**
 * Get depth of team in hierarchy (0 = root)
 */
async function getTeamDepth(teamId: string): Promise<number> {
    let depth = 0;
    let currentId = teamId;
    const visited = new Set<string>();

    while (depth < MAX_TEAM_DEPTH + 1) {
        if (visited.has(currentId)) break;
        visited.add(currentId);

        const [parent] = await db
            .select({ parentTeamId: teamTeams.parentTeamId })
            .from(teamTeams)
            .where(eq(teamTeams.childTeamId, currentId));

        if (!parent) break;
        depth++;
        currentId = parent.parentTeamId;
    }

    return depth;
}

/**
 * Add a child team to a parent team (with cycle and depth checking)
 */
export async function addChildTeam(
    parentTeamId: string,
    childTeamId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Check for self-reference
        if (parentTeamId === childTeamId) {
            return { success: false, error: "A team cannot contain itself" };
        }

        // Check for cycles
        if (await wouldCreateCycle(parentTeamId, childTeamId)) {
            return { success: false, error: "This would create a circular reference" };
        }

        // Check depth limit
        const parentDepth = await getTeamDepth(parentTeamId);
        if (parentDepth >= MAX_TEAM_DEPTH - 1) {
            return { success: false, error: `Maximum nesting depth of ${MAX_TEAM_DEPTH} exceeded` };
        }

        // Check if relationship already exists
        const [existing] = await db
            .select()
            .from(teamTeams)
            .where(and(
                eq(teamTeams.parentTeamId, parentTeamId),
                eq(teamTeams.childTeamId, childTeamId)
            ));

        if (existing) {
            return { success: false, error: "Team is already a member" };
        }

        await db.insert(teamTeams).values({
            id: crypto.randomUUID(),
            parentTeamId,
            childTeamId,
            addedAt: new Date().toISOString(),
        });

        return { success: true };
    } catch (error) {
        console.error("Failed to add child team:", error);
        return { success: false, error: "Failed to add child team" };
    }
}

/**
 * Remove a child team from a parent team
 */
export async function removeChildTeam(
    parentTeamId: string,
    childTeamId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        await db
            .delete(teamTeams)
            .where(and(
                eq(teamTeams.parentTeamId, parentTeamId),
                eq(teamTeams.childTeamId, childTeamId)
            ));

        return { success: true };
    } catch (error) {
        console.error("Failed to remove child team:", error);
        return { success: false, error: "Failed to remove child team" };
    }
}

/**
 * Get root-level teams (teams that are not contained in any other team)
 */
export async function getRootTeams(): Promise<{ success: boolean; data?: TeamWithMembers[]; error?: string }> {
    try {
        // Get all team IDs that are children of some other team
        const childTeamIds = await db
            .select({ childTeamId: teamTeams.childTeamId })
            .from(teamTeams);

        const childIds = new Set(childTeamIds.map(c => c.childTeamId));

        // Get all teams
        const result = await getTeams();
        if (!result.success || !result.data) return result;

        // Filter to only root teams
        const rootTeams = result.data.filter(team => !childIds.has(team.id));

        return { success: true, data: rootTeams };
    } catch (error) {
        console.error("Failed to get root teams:", error);
        return { success: false, error: "Failed to get root teams" };
    }
}

/**
 * Expand a team to get all personnel (including from nested teams)
 */
export async function expandTeamToPersonnel(
    teamId: string,
    maxDepth = MAX_TEAM_DEPTH
): Promise<{ success: boolean; data?: string[]; error?: string }> {
    try {
        const personnelIds = new Set<string>();
        const visitedTeams = new Set<string>();

        async function expand(currentTeamId: string, depth: number) {
            if (depth > maxDepth || visitedTeams.has(currentTeamId)) return;
            visitedTeams.add(currentTeamId);

            // Get direct personnel members
            const members = await db
                .select({ personnelId: teamMembers.personnelId })
                .from(teamMembers)
                .where(eq(teamMembers.teamId, currentTeamId));

            members.forEach(m => personnelIds.add(m.personnelId));

            // Get child teams and recurse
            const children = await db
                .select({ childTeamId: teamTeams.childTeamId })
                .from(teamTeams)
                .where(eq(teamTeams.parentTeamId, currentTeamId));

            for (const child of children) {
                await expand(child.childTeamId, depth + 1);
            }
        }

        await expand(teamId, 0);
        return { success: true, data: Array.from(personnelIds) };
    } catch (error) {
        console.error("Failed to expand team:", error);
        return { success: false, error: "Failed to expand team" };
    }
}

// ============================================================================
// Owner Management
// ============================================================================

/**
 * Check if a person is an owner of a team
 */
export async function isTeamOwner(teamId: string, personnelId: string): Promise<boolean> {
    try {
        const [owner] = await db
            .select()
            .from(teamOwners)
            .where(and(
                eq(teamOwners.teamId, teamId),
                eq(teamOwners.personnelId, personnelId)
            ));
        return !!owner;
    } catch {
        return false;
    }
}

/**
 * Set team owners (replaces existing)
 */
export async function setTeamOwners(
    teamId: string,
    ownerIds: string[]
): Promise<{ success: boolean; error?: string }> {
    try {
        // Delete existing owners
        await db.delete(teamOwners).where(eq(teamOwners.teamId, teamId));

        // Add new owners
        if (ownerIds.length > 0) {
            const now = new Date().toISOString();
            await db.insert(teamOwners).values(
                ownerIds.map(personnelId => ({
                    id: crypto.randomUUID(),
                    teamId,
                    personnelId,
                    addedAt: now,
                }))
            );
        }

        return { success: true };
    } catch (error) {
        console.error("Failed to set team owners:", error);
        return { success: false, error: "Failed to set team owners" };
    }
}

/**
 * Add a single owner to a team
 */
export async function addTeamOwner(
    teamId: string,
    personnelId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Check if already an owner
        const exists = await isTeamOwner(teamId, personnelId);
        if (exists) {
            return { success: true };
        }

        await db.insert(teamOwners).values({
            id: crypto.randomUUID(),
            teamId,
            personnelId,
            addedAt: new Date().toISOString(),
        });

        return { success: true };
    } catch (error) {
        console.error("Failed to add team owner:", error);
        return { success: false, error: "Failed to add team owner" };
    }
}

/**
 * Remove an owner from a team
 */
export async function removeTeamOwner(
    teamId: string,
    personnelId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        await db
            .delete(teamOwners)
            .where(and(
                eq(teamOwners.teamId, teamId),
                eq(teamOwners.personnelId, personnelId)
            ));

        return { success: true };
    } catch (error) {
        console.error("Failed to remove team owner:", error);
        return { success: false, error: "Failed to remove team owner" };
    }
}
