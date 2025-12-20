#!/usr/bin/env bun
/**
 * Scenario Data Loader
 * 
 * Loads scenario data from SQLite database (preferred) or TOML files (fallback).
 * 
 * Usage:
 *   import { loadScenarioData, ScenarioData } from "./scenario-loader";
 *   const data = loadScenarioData("../common/scenarios/mmc");
 */

import { Database } from "bun:sqlite";
import { parse } from "@iarna/toml";
import { readFileSync, existsSync } from "fs";
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
    id?: number;
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
    id?: number;
    channel_id: string;
    person_id: string;
    joined_at?: string;
}

export interface ChatMessageRecord {
    id?: number;
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
    source: "sqlite" | "toml";
}

// ============================================================================
// SQLite Loader
// ============================================================================

function loadFromSqlite(scenarioDir: string): ScenarioData | null {
    const dbPath = join(scenarioDir, "builds", "mmc.sqlite");

    if (!existsSync(dbPath)) {
        console.log(`   ⚠️  SQLite database not found at ${dbPath}`);
        return null;
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
            source: "sqlite",
        };
    } catch (error) {
        console.error(`   ❌ Error loading from SQLite: ${error}`);
        return null;
    } finally {
        db.close();
    }
}

// ============================================================================
// TOML Loader (Legacy fallback)
// ============================================================================

function loadToml<T>(scenarioDir: string, filename: string): T | null {
    const path = join(scenarioDir, filename);
    if (!existsSync(path)) {
        return null;
    }
    const content = readFileSync(path, "utf-8");
    return parse(content) as unknown as T;
}

interface PersonnelToml {
    people?: PersonnelRecord[];
}

interface ProjectsToml {
    solutions?: SolutionRecord[];
    products?: ProductRecord[];
    services?: ServiceRecord[];
    projects?: ProjectRecord[];
    objectives?: ObjectiveRecord[];
    features?: FeatureRecord[];
    rules?: RuleRecord[];
    scenarios?: ScenarioRecord[];
    roles?: RoleRecord[];
}

interface EventsToml {
    events?: CalendarEventRecord[];
}

interface ChatToml {
    channels?: ChatChannelRecord[];
    memberships?: Array<{
        channel_id: string;
        person_id: string;
    }>;
    messages?: Array<{
        channel_id: string;
        sender_id: string;
        content: string;
        sent_at?: string;
    }>;
}

function loadFromToml(scenarioDir: string): ScenarioData {
    console.log(`   📄 Loading scenario data from TOML files`);

    const personnelData = loadToml<PersonnelToml>(scenarioDir, "personnel.toml");
    const projectsData = loadToml<ProjectsToml>(scenarioDir, "projects.toml");
    const eventsData = loadToml<EventsToml>(scenarioDir, "events.toml");
    const chatData = loadToml<ChatToml>(scenarioDir, "chat.toml");

    // Also load from collaboration.toml, access-control.toml, integration.toml for scattered data
    const collaborationData = loadToml<ProjectsToml>(scenarioDir, "collaboration.toml");
    const accessControlData = loadToml<ProjectsToml>(scenarioDir, "access-control.toml");
    const integrationData = loadToml<ProjectsToml>(scenarioDir, "integration.toml");

    // Merge objectives, features, rules, scenarios from all sources
    const allObjectives = [
        ...(projectsData?.objectives || []),
        ...(collaborationData?.objectives || []),
        ...(accessControlData?.objectives || []),
        ...(integrationData?.objectives || []),
    ];

    const allFeatures = [
        ...(projectsData?.features || []),
        ...(collaborationData?.features || []),
        ...(accessControlData?.features || []),
        ...(integrationData?.features || []),
    ];

    const allRules = [
        ...(projectsData?.rules || []),
        ...(collaborationData?.rules || []),
        ...(accessControlData?.rules || []),
        ...(integrationData?.rules || []),
    ];

    const allScenarios = [
        ...(projectsData?.scenarios || []),
        ...(collaborationData?.scenarios || []),
        ...(accessControlData?.scenarios || []),
        ...(integrationData?.scenarios || []),
    ];

    return {
        personnel: personnelData?.people || [],
        solutions: projectsData?.solutions || [],
        products: projectsData?.products || [],
        services: projectsData?.services || [],
        projects: projectsData?.projects || [],
        objectives: allObjectives,
        features: allFeatures,
        rules: allRules,
        scenarios: allScenarios,
        calendarEvents: eventsData?.events || [],
        chatChannels: chatData?.channels || [],
        chatMemberships: (chatData?.memberships || []).map((m, i) => ({ id: i + 1, ...m })),
        chatMessages: (chatData?.messages || []).map((m, i) => ({ id: i + 1, ...m })),
        roles: projectsData?.roles || [],
        source: "toml",
    };
}

// ============================================================================
// Main Loader Function
// ============================================================================

/**
 * Load scenario data from SQLite (preferred) or TOML (fallback).
 * 
 * @param scenarioDir Path to the scenario directory (e.g., "../common/scenarios/mmc")
 * @returns ScenarioData containing all entity arrays
 */
export function loadScenarioData(scenarioDir: string): ScenarioData {
    // Try SQLite first
    const sqliteData = loadFromSqlite(scenarioDir);
    if (sqliteData) {
        return sqliteData;
    }

    // Fall back to TOML
    console.log(`   ⚠️  Falling back to TOML loader`);
    return loadFromToml(scenarioDir);
}

/**
 * Force load scenario data from SQLite only (throws if not available).
 */
export function loadScenarioDataFromSqlite(scenarioDir: string): ScenarioData {
    const data = loadFromSqlite(scenarioDir);
    if (!data) {
        throw new Error(`SQLite database not found. Run 'bun run scenarios:build' first.`);
    }
    return data;
}

/**
 * Force load scenario data from TOML only.
 */
export function loadScenarioDataFromToml(scenarioDir: string): ScenarioData {
    return loadFromToml(scenarioDir);
}
