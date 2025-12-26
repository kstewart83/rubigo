#!/usr/bin/env bun
/**
 * Profile Data Loader
 * 
 * Loads profile data from profiles.sqlite database for a specific profile.
 * 
 * Usage:
 *   import { loadScenarioData, ScenarioData } from "./scenario-loader";
 *   const data = loadScenarioData("../common/seed", "mmc");
 */

import { Database } from "bun:sqlite";
import { existsSync } from "fs";
import { join } from "path";

// ============================================================================
// Types
// ============================================================================

export interface PersonnelRecord {
    id: string;
    profile_id: string;
    name: string;
    email: string;
    title?: string;
    department: string;
    site?: string;
    building?: string;
    level?: number;
    space?: string;
    manager?: string;
    photo?: string;
    desk_phone?: string;
    cell_phone?: string;
    bio?: string;
}

export interface SolutionRecord {
    id: string;
    profile_id: string;
    name: string;
    description?: string;
    status?: string;
}

export interface ProductRecord {
    id: string;
    profile_id: string;
    solution_id: string;
    version?: string;
}

export interface ServiceRecord {
    id: string;
    profile_id: string;
    name: string;
    solution_id: string;
    service_level?: string;
}

export interface ProjectRecord {
    id: string;
    profile_id: string;
    name: string;
    description?: string;
    solution_id?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
}

export interface ObjectiveRecord {
    id: string;
    profile_id: string;
    title: string;
    description?: string;
    project_id?: string;
    parent_id?: string;
    status?: string;
}

export interface FeatureRecord {
    id: string;
    profile_id: string;
    name: string;
    description?: string;
    objective_id?: string;
    status?: string;
}

export interface RuleRecord {
    id: string;
    profile_id: string;
    feature_id: string;
    role: string;
    requirement: string;
    reason: string;
    status?: string;
}

export interface ScenarioRecord {
    id: string;
    profile_id: string;
    rule_id: string;
    name: string;
    narrative: string;
    status?: string;
}

export interface CalendarEventRecord {
    id: string;
    profile_id: string;
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    all_day?: number;
    event_type?: string;
    recurrence?: string;
    recurrence_interval?: number;
    recurrence_days?: string;
    recurrence_until?: string;
    organizer_id?: string;
    location?: string;
    virtual_url?: string;
    timezone?: string;
}

export interface CalendarDeviationRecord {
    id: string;
    profile_id: string;
    event_id: string;
    original_date?: string;
    new_date?: string;
    cancelled?: number;
    override_start_time?: string;
    override_end_time?: string;
    override_title?: string;
    override_description?: string;
    override_location?: string;
    override_timezone?: string;
}

export interface ChatChannelRecord {
    id: string;
    profile_id: string;
    name: string;
    description?: string;
    type?: string;
}

export interface ChatMembershipRecord {
    id: string;
    profile_id: string;
    channel_id: string;
    person_id: string;
    joined_at?: string;
}

export interface ChatMessageRecord {
    id: string;
    profile_id: string;
    channel_id: string;
    sender_id: string;
    content: string;
    sent_at?: string;
}

export interface EmailThreadRecord {
    id: string;
    profile_id: string;
    subject: string;
    created_at?: string;
    updated_at?: string;
}

export interface EmailRecord {
    id: string;
    profile_id: string;
    thread_id: string;
    from_id: string;
    subject: string;
    body: string;
    parent_email_id?: string;
    sent_at?: string;
    is_draft?: number;
    created_at?: string;
}

export interface EmailRecipientRecord {
    id: string;
    profile_id: string;
    email_id: string;
    personnel_id?: string;
    email_address?: string;
    type?: string;
    folder?: string;
    read?: number;
}

export interface RoleRecord {
    id: string;
    profile_id: string;
    name: string;
    description?: string;
}

export interface InfrastructureRecord {
    id: string;
    profile_id: string;
    name: string;
    type: string;
    space?: string;
    capacity?: number;
    assigned_to?: string;
}

export interface ComponentRecord {
    id: string;
    profile_id: string;
    name: string;
    type: string;
    placement_type?: string;
    rack_id?: string;
    desk_id?: string;
    u_position?: number;
    status?: string;
}

export interface AssetRecord {
    id: string;
    profile_id: string;
    name: string;
    category?: string;
    manufacturer?: string;
    model?: string;
    serial_number?: string;
    mac_address?: string;
    status?: string;
    rack?: string;
    position_u?: number;
    height_u?: number;
    space?: string;
    storage_location?: string;
    notes?: string;
}

export interface TeamRecord {
    id: string;
    profile_id: string;
    name: string;
    description?: string;
    created_by_email?: string;
    aco?: string;
}

export interface TeamMemberRecord {
    id: string;
    profile_id: string;
    team_name: string;
    personnel_email: string;
    joined_at: string;
}

export interface TeamTeamRecord {
    id: string;
    profile_id: string;
    parent_team_name: string;
    child_team_name: string;
    added_at: string;
}

export interface TeamOwnerRecord {
    id: string;
    profile_id: string;
    team_name: string;
    personnel_email: string;
    added_at: string;
}

export interface ScenarioData {
    profileId: string;
    personnel: PersonnelRecord[];
    solutions: SolutionRecord[];
    products: ProductRecord[];
    services: ServiceRecord[];
    projects: ProjectRecord[];
    objectives: ObjectiveRecord[];
    features: FeatureRecord[];
    rules: RuleRecord[];
    scenarios: ScenarioRecord[];
    calendarEvents: CalendarEventRecord[];
    calendarDeviations: CalendarDeviationRecord[];
    chatChannels: ChatChannelRecord[];
    chatMemberships: ChatMembershipRecord[];
    chatMessages: ChatMessageRecord[];
    roles: RoleRecord[];
    infrastructure: InfrastructureRecord[];
    components: ComponentRecord[];
    assets: AssetRecord[];
    emailThreads: EmailThreadRecord[];
    emails: EmailRecord[];
    emailRecipients: EmailRecipientRecord[];
    teams: TeamRecord[];
    teamMembers: TeamMemberRecord[];
    teamTeams: TeamTeamRecord[];
    teamOwners: TeamOwnerRecord[];
}

// ============================================================================
// Loader Function
// ============================================================================

/**
 * Load profile data from profiles.sqlite database.
 * 
 * @param scenarioDir Path to the seed directory (e.g., "../common/seed")
 * @param profileId Profile ID to load (e.g., "mmc")
 * @returns ScenarioData containing all entity arrays for the profile
 * @throws Error if database not found or profile doesn't exist
 */
export function loadScenarioData(scenarioDir: string, profileId: string = "mmc"): ScenarioData {
    const dbPath = join(scenarioDir, "builds", "profiles.sqlite");

    if (!existsSync(dbPath)) {
        throw new Error(
            `Profiles database not found at ${dbPath}. ` +
            `Run 'bun run scenarios:build' to generate the database.`
        );
    }

    console.log(`   📊 Loading profile '${profileId}' from: ${dbPath}`);

    const db = new Database(dbPath, { readonly: true });

    try {
        // Verify profile exists
        const profile = db.query("SELECT id FROM profile WHERE id = ?").get(profileId);
        if (!profile) {
            const available = db.query("SELECT id FROM profile").all() as { id: string }[];
            throw new Error(
                `Profile '${profileId}' not found. ` +
                `Available profiles: ${available.map(p => p.id).join(", ")}`
            );
        }

        const q = (table: string) =>
            db.query(`SELECT * FROM ${table} WHERE profile_id = ?`).all(profileId);

        return {
            profileId,
            personnel: q("personnel") as PersonnelRecord[],
            solutions: q("solutions") as SolutionRecord[],
            products: q("products") as ProductRecord[],
            services: q("services") as ServiceRecord[],
            projects: q("projects") as ProjectRecord[],
            objectives: q("objectives") as ObjectiveRecord[],
            features: q("features") as FeatureRecord[],
            rules: q("rules") as RuleRecord[],
            scenarios: q("scenarios") as ScenarioRecord[],
            calendarEvents: q("calendar_events") as CalendarEventRecord[],
            calendarDeviations: q("calendar_deviations") as CalendarDeviationRecord[],
            chatChannels: q("chat_channels") as ChatChannelRecord[],
            chatMemberships: q("chat_memberships") as ChatMembershipRecord[],
            chatMessages: q("chat_messages") as ChatMessageRecord[],
            roles: q("roles") as RoleRecord[],
            infrastructure: q("infrastructure") as InfrastructureRecord[],
            components: q("components") as ComponentRecord[],
            assets: q("assets") as AssetRecord[],
            emailThreads: q("email_threads") as EmailThreadRecord[],
            emails: q("emails") as EmailRecord[],
            emailRecipients: q("email_recipients") as EmailRecipientRecord[],
            teams: q("teams") as TeamRecord[],
            teamMembers: q("team_members") as TeamMemberRecord[],
            teamTeams: q("team_teams") as TeamTeamRecord[],
            teamOwners: q("team_owners") as TeamOwnerRecord[],
        };
    } finally {
        db.close();
    }
}

/**
 * List all available profile IDs.
 */
export function listProfiles(scenarioDir: string): string[] {
    const dbPath = join(scenarioDir, "builds", "profiles.sqlite");
    if (!existsSync(dbPath)) return [];

    const db = new Database(dbPath, { readonly: true });
    try {
        const profiles = db.query("SELECT id FROM profile").all() as { id: string }[];
        return profiles.map(p => p.id);
    } finally {
        db.close();
    }
}

// Backward compatibility alias
export const loadScenarioDataFromSqlite = loadScenarioData;
