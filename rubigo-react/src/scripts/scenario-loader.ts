#!/usr/bin/env bun
/**
 * Scenario Data Loader
 * 
 * Loads scenario data from SQLite database.
 * 
 * Usage:
 *   import { loadScenarioData, ScenarioData } from "./scenario-loader";
 *   const data = loadScenarioData("../common/scenarios/mmc");
 */

import { Database } from "bun:sqlite";
import { existsSync } from "fs";
import { join } from "path";

// ============================================================================
// Types
// ============================================================================

export interface PersonnelRecord {
    id: string;
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
    name: string;
    description?: string;
    status?: string;
}

export interface ProductRecord {
    id: string;
    solution_id: string;
    version?: string;
}

export interface ServiceRecord {
    id: string;
    name: string;
    solution_id: string;
    service_level?: string;
}

export interface ProjectRecord {
    id: string;
    name: string;
    description?: string;
    solution_id?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
}

export interface ObjectiveRecord {
    id: string;
    title: string;
    description?: string;
    project_id?: string;
    parent_id?: string;
    status?: string;
}

export interface FeatureRecord {
    id: string;
    name: string;
    description?: string;
    objective_id?: string;
    status?: string;
}

export interface RuleRecord {
    id: string;
    feature_id: string;
    role: string;
    requirement: string;
    reason: string;
    status?: string;
}

export interface ScenarioRecord {
    id: string;
    rule_id: string;
    name: string;
    narrative: string;
    status?: string;
}

export interface CalendarEventRecord {
    id?: string;
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

export interface ChatChannelRecord {
    id: string;
    name: string;
    description?: string;
    type?: string;
}

export interface ChatMembershipRecord {
    id?: string;
    channel_id: string;
    person_id: string;
    joined_at?: string;
}

export interface ChatMessageRecord {
    id?: string;
    channel_id: string;
    sender_id: string;
    content: string;
    sent_at?: string;
    message_type?: string;
}

export interface RoleRecord {
    id: string;
    name: string;
    description?: string;
}

export interface InfrastructureRecord {
    id: string;
    name: string;
    type: string;
    space?: string;
    capacity?: number;
    assigned_to?: string;
}

export interface ComponentRecord {
    id: string;
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

export interface ScenarioData {
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
    chatChannels: ChatChannelRecord[];
    chatMemberships: ChatMembershipRecord[];
    chatMessages: ChatMessageRecord[];
    roles: RoleRecord[];
    infrastructure: InfrastructureRecord[];
    components: ComponentRecord[];
    assets: AssetRecord[];
    source: "sqlite";
}

// ============================================================================
// SQLite Loader
// ============================================================================

/**
 * Load scenario data from SQLite database.
 * 
 * @param scenarioDir Path to the scenario directory (e.g., "../common/scenarios/mmc")
 * @returns ScenarioData containing all entity arrays
 * @throws Error if SQLite database not found
 */
export function loadScenarioData(scenarioDir: string): ScenarioData {
    const dbPath = join(scenarioDir, "builds", "mmc.sqlite");

    if (!existsSync(dbPath)) {
        throw new Error(
            `SQLite database not found at ${dbPath}. ` +
            `Run 'bun run scenarios:build' to generate the database.`
        );
    }

    console.log(`   📊 Loading scenario data from SQLite: ${dbPath}`);

    const db = new Database(dbPath, { readonly: true });

    try {
        const personnel = db.query("SELECT * FROM personnel").all() as PersonnelRecord[];
        const solutions = db.query("SELECT * FROM solutions").all() as SolutionRecord[];
        const products = db.query("SELECT * FROM products").all() as ProductRecord[];
        const services = db.query("SELECT * FROM services").all() as ServiceRecord[];
        const projects = db.query("SELECT * FROM projects").all() as ProjectRecord[];
        const objectives = db.query("SELECT * FROM objectives").all() as ObjectiveRecord[];
        const features = db.query("SELECT * FROM features").all() as FeatureRecord[];
        const rules = db.query("SELECT * FROM rules").all() as RuleRecord[];
        const scenarios = db.query("SELECT * FROM scenarios").all() as ScenarioRecord[];
        const calendarEvents = db.query("SELECT * FROM calendar_events").all() as CalendarEventRecord[];
        const chatChannels = db.query("SELECT * FROM chat_channels").all() as ChatChannelRecord[];
        const chatMemberships = db.query("SELECT * FROM chat_memberships").all() as ChatMembershipRecord[];
        const chatMessages = db.query("SELECT * FROM chat_messages").all() as ChatMessageRecord[];
        const roles = db.query("SELECT * FROM roles").all() as RoleRecord[];
        const infrastructure = db.query("SELECT * FROM infrastructure").all() as InfrastructureRecord[];
        const components = db.query("SELECT * FROM components").all() as ComponentRecord[];
        const assets = db.query("SELECT * FROM assets").all() as AssetRecord[];

        return {
            personnel,
            solutions,
            products,
            services,
            projects,
            objectives,
            features,
            rules,
            scenarios,
            calendarEvents,
            chatChannels,
            chatMemberships,
            chatMessages,
            roles,
            infrastructure,
            components,
            assets,
            source: "sqlite",
        };
    } finally {
        db.close();
    }
}

// Alias for backward compatibility
export const loadScenarioDataFromSqlite = loadScenarioData;
