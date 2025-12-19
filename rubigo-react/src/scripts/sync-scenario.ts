#!/usr/bin/env bun
/**
 * Scenario Sync CLI
 *
 * Syncs TOML scenario data to a running Rubigo instance via API.
 *
 * Usage:
 *   bun run sync:scenario -- --mode=create --url=http://localhost:3000 --token=xxx
 *
 * Modes:
 *   create - Create missing entities only (default)
 *   upsert - Create missing + update existing to match seed
 *   full   - Create + update + delete entities not in seed
 */

import { parse } from "@iarna/toml";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { RubigoClient, type CalendarEventInput } from "../lib/rubigo-client";

// ============================================================================
// CLI Argument Parsing
// ============================================================================

interface CliArgs {
    mode: "create" | "upsert" | "full";
    url: string;
    token: string;
    scenario: string;
    dryRun: boolean;
}

function parseArgs(): CliArgs {
    const args = process.argv.slice(2);
    const result: CliArgs = {
        mode: "create",
        url: "http://localhost:3000",
        token: "",
        scenario: "../common/scenarios/mmc",
        dryRun: false,
    };

    for (const arg of args) {
        if (arg.startsWith("--mode=")) {
            const mode = arg.split("=")[1];
            if (mode === "create" || mode === "upsert" || mode === "full") {
                result.mode = mode;
            } else {
                console.error(`❌ Invalid mode: ${mode}. Use create, upsert, or full.`);
                process.exit(1);
            }
        } else if (arg.startsWith("--url=")) {
            result.url = arg.split("=")[1];
        } else if (arg.startsWith("--token=")) {
            result.token = arg.split("=")[1];
        } else if (arg.startsWith("--scenario=")) {
            result.scenario = arg.split("=")[1];
        } else if (arg === "--dry-run") {
            result.dryRun = true;
        }
    }

    // Also check environment variables
    result.token = result.token || process.env.RUBIGO_API_TOKEN || "";
    result.url = result.url || process.env.RUBIGO_API_URL || "http://localhost:3000";
    result.scenario = result.scenario || process.env.RUBIGO_SEED_DIR || "../common/scenarios/mmc";

    if (!result.token) {
        console.error("❌ API token required. Use --token=xxx or set RUBIGO_API_TOKEN.");
        process.exit(1);
    }

    return result;
}

// ============================================================================
// Types for TOML Parsing
// ============================================================================

interface SyncStats {
    created: number;
    updated: number;
    deleted: number;
    skipped: number;
    failed: number;
}

interface EntityStats {
    [entityType: string]: SyncStats;
}

// ============================================================================
// Helper Functions
// ============================================================================

function loadToml<T>(scenarioDir: string, filename: string): T | null {
    const path = join(scenarioDir, filename);
    if (!existsSync(path)) {
        return null;
    }
    const content = readFileSync(path, "utf-8");
    return parse(content) as unknown as T;
}

function initStats(): SyncStats {
    return { created: 0, updated: 0, deleted: 0, skipped: 0, failed: 0 };
}

// Convert snake_case to camelCase
function toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Compare two objects for equality (shallow comparison of specified fields)
// Handles snake_case (TOML) vs camelCase (DB) field name differences
function hasChanges(existing: Record<string, unknown>, seed: Record<string, unknown>, fields: string[]): boolean {
    for (const field of fields) {
        // Try both snake_case and camelCase versions for existing (DB uses camelCase)
        const camelField = toCamelCase(field);
        const existingVal = existing[camelField] ?? existing[field];
        const seedVal = seed[field];
        // Normalize undefined and null to empty string for comparison
        const a = existingVal === undefined || existingVal === null ? "" : existingVal;
        const b = seedVal === undefined || seedVal === null ? "" : seedVal;
        if (String(a) !== String(b)) {
            return true;
        }
    }
    return false;
}

// ============================================================================
// Entity Sync Functions
// ============================================================================

interface PersonnelToml {
    people?: Array<{
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
    }>;
}

async function syncPersonnel(
    client: RubigoClient,
    scenarioDir: string,
    mode: CliArgs["mode"],
    dryRun: boolean
): Promise<{ stats: SyncStats; idMapping: Map<string, string> }> {
    const stats = initStats();
    const data = loadToml<PersonnelToml>(scenarioDir, "personnel.toml");

    if (!data?.people?.length) {
        console.log("⏭️  No personnel data found");
        return { stats, idMapping: new Map() };
    }

    console.log(`\n👥 Syncing ${data.people.length} personnel records...`);

    // Get existing personnel for comparison
    const existingResult = await client.listPersonnel({ pageSize: 1000 });
    const existingMap = new Map<string, Record<string, unknown>>();

    if (existingResult.success && existingResult.data) {
        for (const p of existingResult.data as Array<{ id: string; email: string;[key: string]: unknown }>) {
            existingMap.set(p.email, p); // Personnel identified by email
        }
    }

    const seedEmails = new Set<string>();

    for (const person of data.people) {
        seedEmails.add(person.email);
        const existing = existingMap.get(person.email);

        if (!existing) {
            // Create
            if (dryRun) {
                console.log(`   🆕 [DRY-RUN] Would create: ${person.name}`);
                stats.created++;
            } else {
                const result = await client.createPersonnel({
                    name: person.name,
                    email: person.email,
                    title: person.title,
                    department: person.department,
                    site: person.site,
                    building: person.building,
                    level: person.level,
                    space: person.space,
                    manager: person.manager,
                    deskPhone: person.desk_phone,
                    cellPhone: person.cell_phone,
                    bio: person.bio,
                });
                if (result.success) {
                    stats.created++;
                    console.log(`   ✅ Created: ${person.name}`);
                } else {
                    stats.failed++;
                    console.log(`   ❌ Failed to create ${person.name}: ${result.error}`);
                }
            }
        } else if (mode === "upsert" || mode === "full") {
            // Check for changes
            const fields = ["name", "title", "department", "site", "building", "level", "space", "manager", "bio"];
            const seedData: Record<string, unknown> = {
                name: person.name,
                title: person.title || "",
                department: person.department,
                site: person.site || "",
                building: person.building || "",
                level: person.level || "",
                space: person.space || "",
                manager: person.manager || "",
                bio: person.bio || "",
            };

            if (hasChanges(existing, seedData, fields)) {
                if (dryRun) {
                    console.log(`   📝 [DRY-RUN] Would update: ${person.name}`);
                    stats.updated++;
                } else {
                    const result = await client.updatePersonnel(existing.id as string, {
                        name: person.name,
                        title: person.title,
                        department: person.department,
                        site: person.site,
                        building: person.building,
                        level: person.level,
                        space: person.space,
                        manager: person.manager,
                        deskPhone: person.desk_phone,
                        cellPhone: person.cell_phone,
                        bio: person.bio,
                    });
                    if (result.success) {
                        stats.updated++;
                        console.log(`   📝 Updated: ${person.name}`);
                    } else {
                        stats.failed++;
                        console.log(`   ❌ Failed to update ${person.name}: ${result.error}`);
                    }
                }
            } else {
                stats.skipped++;
            }
        } else {
            stats.skipped++;
        }
    }

    // Delete extras in full mode
    if (mode === "full") {
        for (const [email, person] of existingMap) {
            if (!seedEmails.has(email)) {
                if (dryRun) {
                    console.log(`   🗑️  [DRY-RUN] Would delete: ${person.name}`);
                    stats.deleted++;
                } else {
                    const result = await client.deletePersonnel(person.id as string);
                    if (result.success) {
                        stats.deleted++;
                        console.log(`   🗑️  Deleted: ${person.name}`);
                    } else {
                        stats.failed++;
                        console.log(`   ❌ Failed to delete ${person.name}: ${result.error}`);
                    }
                }
            }
        }
    }

    // Build TOML ID → database ID mapping
    // Re-fetch personnel to get current state with DB IDs
    const idMapping = new Map<string, string>();
    const refreshedResult = await client.listPersonnel({ pageSize: 1000 });
    if (refreshedResult.success && refreshedResult.data) {
        const emailToDbId = new Map<string, string>();
        for (const p of refreshedResult.data as Array<{ id: string; email: string }>) {
            emailToDbId.set(p.email.toLowerCase(), p.id);
        }
        // Map TOML id → email → DB id
        for (const person of data.people) {
            const dbId = emailToDbId.get(person.email.toLowerCase());
            if (dbId) {
                idMapping.set(person.id, dbId);
            }
        }
    }

    return { stats, idMapping };
}

// ============================================================================
// Solution Space Sync
// ============================================================================

interface ProjectsToml {
    solutions?: Array<{
        id: string;
        name: string;
        description?: string;
        status?: string;
    }>;
    products?: Array<{
        id: string;
        solution_id: string;
        version?: string;
    }>;
    services?: Array<{
        id: string;
        name: string;
        solution_id: string;
        service_level?: string;
    }>;
    releases?: Array<{
        id: string;
        product_id: string;
        version: string;
        release_date?: string;
        status?: string;
    }>;
    projects?: Array<{
        id: string;
        name: string;
        description?: string;
        solution_id?: string;
        status?: string;
        start_date?: string;
        end_date?: string;
    }>;
    objectives?: Array<{
        id: string;
        title: string;
        description?: string;
        project_id?: string;
        parent_id?: string;
        status?: string;
    }>;
    metrics?: Array<{
        id: string;
        name: string;
        description?: string;
        unit: string;
        current_value?: number;
        source?: string;
    }>;
    kpis?: Array<{
        id: string;
        metric_id: string;
        objective_id?: string;
        target_value: number;
        direction: string;
        threshold_warning?: number;
        threshold_critical?: number;
    }>;
    features?: Array<{
        id: string;
        name: string;
        description?: string;
        objective_id?: string;
        status?: string;
    }>;
    rules?: Array<{
        id: string;
        feature_id: string;
        role: string;
        requirement: string;
        reason: string;
        status?: string;
    }>;
    scenarios?: Array<{
        id: string;
        rule_id: string;
        name: string;
        narrative: string;
        status?: string;
    }>;
    specifications?: Array<{
        id: string;
        feature_id: string;
        name: string;
        narrative: string;
        category: string;
        status?: string;
    }>;
    initiatives?: Array<{
        id: string;
        name: string;
        description?: string;
        kpi_id?: string;
        status?: string;
        start_date?: string;
        end_date?: string;
    }>;
    activities?: Array<{
        id: string;
        name: string;
        description?: string;
        parent_id?: string;
        initiative_id?: string;
        blocked_by?: string[];
        status?: string;
    }>;
    roles?: Array<{
        id: string;
        name: string;
        description?: string;
    }>;
    assignments?: Array<{
        id: string;
        activity_id: string;
        role_id: string;
        quantity: number;
        unit?: string;
        raci_type?: string;
    }>;
    allocations?: Array<{
        id: string;
        assignment_id: string;
        person_id: string;
        quantity_contributed: number;
        start_date?: string;
        end_date?: string;
    }>;
}

// Events TOML structure
interface EventsToml {
    description?: { overview?: string };
    events?: Array<{
        title: string;
        description?: string;
        start_time: string;
        end_time: string;
        event_type?: string;
        recurrence?: string;
        recurrence_interval?: number;
        recurrence_days?: string[];
        recurrence_until?: string;
        organizer_id?: string;
        participant_ids?: string[];
        location?: string;
        virtual_url?: string;
        timezone?: string;
        // Fields not yet synced (TODO):
        // - all_day
        // - participant_ids (requires CalendarParticipant sync)
    }>;
}

// Generic sync function for simple entities
async function syncSimpleEntity<T extends { id: string }>(
    entityName: string,
    items: T[] | undefined,
    mode: CliArgs["mode"],
    dryRun: boolean,
    listFn: () => Promise<{ success: boolean; data?: unknown[] }>,
    createFn: (item: T) => Promise<{ success: boolean; error?: string }>,
    updateFn: (id: string, item: Partial<T>) => Promise<{ success: boolean; error?: string }>,
    deleteFn: (id: string) => Promise<{ success: boolean; error?: string }>,
    compareFields: string[],
    formatName: (item: T) => string
): Promise<SyncStats> {
    const stats = initStats();

    if (!items?.length) {
        return stats;
    }

    console.log(`\n📦 Syncing ${items.length} ${entityName}...`);

    // Get existing items
    const existingResult = await listFn();
    const existingMap = new Map<string, Record<string, unknown>>();

    if (existingResult.success && existingResult.data) {
        for (const item of existingResult.data as Array<{ id: string;[key: string]: unknown }>) {
            existingMap.set(item.id, item);
        }
    }

    const seedIds = new Set<string>();

    for (const item of items) {
        seedIds.add(item.id);
        const existing = existingMap.get(item.id);

        if (!existing) {
            if (dryRun) {
                console.log(`   🆕 [DRY-RUN] Would create: ${formatName(item)}`);
                stats.created++;
            } else {
                const result = await createFn(item);
                if (result.success) {
                    stats.created++;
                    console.log(`   ✅ Created: ${formatName(item)}`);
                } else {
                    stats.failed++;
                    console.log(`   ❌ Failed to create ${formatName(item)}: ${result.error}`);
                }
            }
        } else if (mode === "upsert" || mode === "full") {
            if (hasChanges(existing, item as unknown as Record<string, unknown>, compareFields)) {
                if (dryRun) {
                    console.log(`   📝 [DRY-RUN] Would update: ${formatName(item)}`);
                    stats.updated++;
                } else {
                    const result = await updateFn(item.id, item);
                    if (result.success) {
                        stats.updated++;
                        console.log(`   📝 Updated: ${formatName(item)}`);
                    } else {
                        stats.failed++;
                        console.log(`   ❌ Failed to update ${formatName(item)}: ${result.error}`);
                    }
                }
            } else {
                stats.skipped++;
            }
        } else {
            stats.skipped++;
        }
    }

    if (mode === "full") {
        for (const [id, item] of existingMap) {
            if (!seedIds.has(id)) {
                const name = (item as Record<string, unknown>).name || (item as Record<string, unknown>).title || id;
                if (dryRun) {
                    console.log(`   🗑️  [DRY-RUN] Would delete: ${name}`);
                    stats.deleted++;
                } else {
                    const result = await deleteFn(id);
                    if (result.success) {
                        stats.deleted++;
                        console.log(`   🗑️  Deleted: ${name}`);
                    } else {
                        stats.failed++;
                        console.log(`   ❌ Failed to delete ${name}: ${result.error}`);
                    }
                }
            }
        }
    }

    return stats;
}

// ============================================================================
// Calendar Events Sync
// ============================================================================

type EventEntry = NonNullable<EventsToml["events"]>[number];

async function syncCalendarEvents(
    client: RubigoClient,
    events: EventEntry[],
    mode: CliArgs["mode"],
    dryRun: boolean
): Promise<SyncStats> {
    const stats = initStats();

    if (!events.length) {
        return stats;
    }

    console.log(`\n📅 Syncing ${events.length} calendar events...`);

    // Get existing events (use a wide date range to capture all)
    // Note: This is a simplified approach - in production you might want pagination
    const existingResult = await client.listCalendarEvents("2024-01-01", "2030-01-01");
    const existingMap = new Map<string, Record<string, unknown>>();

    if (existingResult.success && existingResult.events) {
        for (const event of existingResult.events as Array<{ id: string; title: string; startTime: string;[key: string]: unknown }>) {
            // Key by title + start_time for matching
            const key = `${event.title}|${event.startTime}`;
            existingMap.set(key, event);
        }
    }

    const seedKeys = new Set<string>();

    for (const event of events) {
        const key = `${event.title}|${event.start_time}`;
        seedKeys.add(key);
        const existing = existingMap.get(key);

        // Map TOML snake_case to API camelCase
        const apiEvent = {
            title: event.title,
            description: event.description,
            startTime: event.start_time,
            endTime: event.end_time,
            eventType: event.event_type as CalendarEventInput["eventType"],
            recurrence: event.recurrence as CalendarEventInput["recurrence"] || "none",
            recurrenceDays: event.recurrence_days,
            recurrenceUntil: event.recurrence_until,
            timezone: event.timezone || "America/New_York",
            location: event.location,
            virtualUrl: event.virtual_url,
            // TODO: participant_ids not synced yet
        };

        if (!existing) {
            if (dryRun) {
                console.log(`   🆕 [DRY-RUN] Would create: ${event.title}`);
                stats.created++;
            } else {
                const result = await client.createCalendarEvent(apiEvent);
                if (result.success) {
                    stats.created++;
                    console.log(`   ✅ Created: ${event.title}`);
                } else {
                    stats.failed++;
                    console.log(`   ❌ Failed to create ${event.title}: ${result.error}`);
                }
            }
        } else if (mode === "upsert" || mode === "full") {
            // Check for changes
            const compareFields = ["title", "description", "eventType", "recurrence", "location", "timezone"];
            if (hasChanges(existing, apiEvent as unknown as Record<string, unknown>, compareFields)) {
                if (dryRun) {
                    console.log(`   📝 [DRY-RUN] Would update: ${event.title}`);
                    stats.updated++;
                } else {
                    const result = await client.updateCalendarEvent(existing.id as string, apiEvent);
                    if (result.success) {
                        stats.updated++;
                        console.log(`   📝 Updated: ${event.title}`);
                    } else {
                        stats.failed++;
                        console.log(`   ❌ Failed to update ${event.title}: ${result.error}`);
                    }
                }
            } else {
                stats.skipped++;
            }
        } else {
            stats.skipped++;
        }
    }

    // Delete extras in full mode
    if (mode === "full") {
        for (const [key, event] of existingMap) {
            if (!seedKeys.has(key)) {
                const title = event.title as string;
                if (dryRun) {
                    console.log(`   🗑️  [DRY-RUN] Would delete: ${title}`);
                    stats.deleted++;
                } else {
                    const result = await client.deleteCalendarEvent(event.id as string);
                    if (result.success) {
                        stats.deleted++;
                        console.log(`   🗑️  Deleted: ${title}`);
                    } else {
                        stats.failed++;
                        console.log(`   ❌ Failed to delete ${title}: ${result.error}`);
                    }
                }
            }
        }
    }

    return stats;
}

// ============================================================================
// Chat Sync
// ============================================================================

interface ChatToml {
    description?: { overview?: string };
    channels?: Array<{
        id: string;
        name: string;
        description?: string;
        type: "channel" | "dm";
    }>;
    memberships?: Array<{
        channel_id: string;
        person_id: string;
    }>;
    messages?: Array<{
        channel_id: string;
        sender_id: string;
        content: string;
        sent_at: string;
    }>;
}

async function syncChatChannels(
    client: RubigoClient,
    channels: NonNullable<ChatToml["channels"]>,
    mode: CliArgs["mode"],
    dryRun: boolean
): Promise<SyncStats> {
    const stats = initStats();

    if (!channels.length) {
        return stats;
    }

    console.log(`\n💬 Syncing ${channels.length} chat channels...`);

    // Get existing channels
    const existingResult = await client.listChatChannels();
    const existingMap = new Map<string, Record<string, unknown>>();

    if (existingResult.success && existingResult.data) {
        for (const channel of existingResult.data as Array<{ id: string;[key: string]: unknown }>) {
            existingMap.set(channel.id, channel);
        }
    }

    const seedIds = new Set<string>();

    for (const channel of channels) {
        seedIds.add(channel.id);
        const existing = existingMap.get(channel.id);

        if (!existing) {
            if (dryRun) {
                console.log(`   🆕 [DRY-RUN] Would create channel: #${channel.name}`);
                stats.created++;
            } else {
                const result = await client.createChatChannel({
                    id: channel.id,
                    name: channel.name,
                    description: channel.description,
                    type: channel.type,
                });
                if (result.success) {
                    stats.created++;
                    console.log(`   ✅ Created channel: #${channel.name}`);
                } else {
                    stats.failed++;
                    console.log(`   ❌ Failed to create #${channel.name}: ${result.error}`);
                }
            }
        } else {
            stats.skipped++;
        }
    }

    // Delete extras in full mode
    if (mode === "full") {
        for (const [id, channel] of existingMap) {
            if (!seedIds.has(id)) {
                const name = channel.name as string;
                if (dryRun) {
                    console.log(`   🗑️  [DRY-RUN] Would delete channel: #${name}`);
                    stats.deleted++;
                } else {
                    const result = await client.deleteChatChannel(id);
                    if (result.success) {
                        stats.deleted++;
                        console.log(`   🗑️  Deleted channel: #${name}`);
                    } else {
                        stats.failed++;
                        console.log(`   ❌ Failed to delete #${name}: ${result.error}`);
                    }
                }
            }
        }
    }

    return stats;
}

async function syncChatMemberships(
    client: RubigoClient,
    memberships: NonNullable<ChatToml["memberships"]>,
    personnelIdMap: Map<string, string>,
    dryRun: boolean
): Promise<SyncStats> {
    const stats = initStats();

    if (!memberships.length) {
        return stats;
    }

    console.log(`\n👥 Syncing ${memberships.length} chat memberships...`);

    for (const membership of memberships) {
        // Translate TOML person_id to database ID
        const dbPersonnelId = personnelIdMap.get(membership.person_id) || membership.person_id;

        if (dryRun) {
            console.log(`   🆕 [DRY-RUN] Would add member: ${membership.person_id} to ${membership.channel_id}`);
            stats.created++;
        } else {
            const result = await client.addChatMember({
                channelId: membership.channel_id,
                personnelId: dbPersonnelId,
            });
            if (result.success) {
                stats.created++;
            } else {
                stats.failed++;
                console.log(`   ❌ Failed to add member: ${result.error}`);
            }
        }
    }

    console.log(`   ✅ Added ${stats.created} memberships`);
    return stats;
}

async function syncChatMessages(
    client: RubigoClient,
    messages: NonNullable<ChatToml["messages"]>,
    personnelIdMap: Map<string, string>,
    dryRun: boolean
): Promise<SyncStats> {
    const stats = initStats();

    if (!messages.length) {
        return stats;
    }

    console.log(`\n📝 Syncing ${messages.length} chat messages...`);

    for (const message of messages) {
        // Translate TOML sender_id to database ID
        const dbSenderId = personnelIdMap.get(message.sender_id) || message.sender_id;

        if (dryRun) {
            console.log(`   🆕 [DRY-RUN] Would send message in ${message.channel_id}`);
            stats.created++;
        } else {
            const result = await client.sendChatMessage({
                channelId: message.channel_id,
                senderId: dbSenderId,
                content: message.content,
                sentAt: message.sent_at,
            });
            if (result.success) {
                stats.created++;
            } else {
                stats.failed++;
                console.log(`   ❌ Failed to send message: ${result.error}`);
            }
        }
    }

    console.log(`   ✅ Sent ${stats.created} messages`);
    return stats;
}

// ============================================================================
// Main Sync Orchestrator
// ============================================================================

async function main() {
    const args = parseArgs();

    console.log("\n" + "=".repeat(60));
    console.log("🔄 Rubigo Scenario Sync");
    console.log("=".repeat(60));
    console.log(`   Mode: ${args.mode}`);
    console.log(`   URL: ${args.url}`);
    console.log(`   Scenario: ${args.scenario}`);
    console.log(`   Dry Run: ${args.dryRun}`);
    console.log("=".repeat(60));

    const client = new RubigoClient({
        baseUrl: args.url,
        apiToken: args.token,
    });

    const allStats: EntityStats = {};

    // Load TOML files
    const projectsData = loadToml<ProjectsToml>(args.scenario, "projects.toml");
    const collaborationData = loadToml<ProjectsToml>(args.scenario, "collaboration.toml");

    // Merge objectives, features, rules, scenarios from both files
    const mergedObjectives = [
        ...(projectsData?.objectives || []),
        ...(collaborationData?.objectives || []),
    ];
    const mergedFeatures = [
        ...(projectsData?.features || []),
        ...(collaborationData?.features || []),
    ];
    const mergedRules = [
        ...(projectsData?.rules || []),
        ...(collaborationData?.rules || []),
    ];
    const mergedScenarios = [
        ...(projectsData?.scenarios || []),
        ...(collaborationData?.scenarios || []),
    ];
    const mergedSpecifications = [
        ...(projectsData?.specifications || []),
        ...(collaborationData?.specifications || []),
    ];

    // 1. Personnel (no deps) - also builds TOML ID → DB ID mapping
    const personnelResult = await syncPersonnel(client, args.scenario, args.mode, args.dryRun);
    allStats.personnel = personnelResult.stats;
    const personnelIdMap = personnelResult.idMapping;

    // 2. Solutions (no deps)
    allStats.solutions = await syncSimpleEntity(
        "solutions",
        projectsData?.solutions,
        args.mode,
        args.dryRun,
        () => client.listSolutions(),
        (s) => client.createSolution({ id: s.id, name: s.name, description: s.description, status: s.status as "pipeline" | "catalog" | "retired" | undefined }),
        (id, s) => client.updateSolution(id, { name: s.name, description: s.description, status: s.status as "pipeline" | "catalog" | "retired" | undefined }),
        (id) => client.deleteSolution(id),
        ["name", "description", "status"],
        (s) => s.name
    );

    // 3. Products (depends on Solutions)
    allStats.products = await syncSimpleEntity(
        "products",
        projectsData?.products,
        args.mode,
        args.dryRun,
        () => client.listProducts(),
        (p) => client.createProduct({ id: p.id, solution_id: p.solution_id, version: p.version }),
        (id, p) => client.updateProduct(id, { solution_id: p.solution_id, version: p.version }),
        (id) => client.deleteProduct(id),
        ["solution_id", "version"],
        (p) => p.id
    );

    // 4. Services (depends on Solutions)
    allStats.services = await syncSimpleEntity(
        "services",
        projectsData?.services,
        args.mode,
        args.dryRun,
        () => client.listServices(),
        (s) => client.createService({ id: s.id, name: s.name, solution_id: s.solution_id, service_level: s.service_level }),
        (id, s) => client.updateService(id, { name: s.name, solution_id: s.solution_id, service_level: s.service_level }),
        (id) => client.deleteService(id),
        ["name", "solution_id", "service_level"],
        (s) => s.name
    );

    // 5. Releases (depends on Products)
    allStats.releases = await syncSimpleEntity(
        "releases",
        projectsData?.releases,
        args.mode,
        args.dryRun,
        () => client.listReleases(),
        (r) => client.createRelease({ id: r.id, product_id: r.product_id, version: r.version, release_date: r.release_date, status: r.status }),
        (id, r) => client.updateRelease(id, { product_id: r.product_id, version: r.version, release_date: r.release_date, status: r.status }),
        (id) => client.deleteRelease(id),
        ["product_id", "version", "release_date", "status"],
        (r) => `${r.product_id}@${r.version}`
    );

    // 6. Projects (depends on Solutions)
    allStats.projects = await syncSimpleEntity(
        "projects",
        projectsData?.projects,
        args.mode,
        args.dryRun,
        () => client.listProjects(),
        (p) => client.createProject({
            id: p.id,
            name: p.name,
            description: p.description,
            solution_id: p.solution_id,
            status: p.status as "planning" | "active" | "on_hold" | "complete" | "cancelled" | undefined,
            start_date: p.start_date,
            end_date: p.end_date,
        }),
        (id, p) => client.updateProject(id, {
            name: p.name,
            description: p.description,
            solution_id: p.solution_id,
            status: p.status as "planning" | "active" | "on_hold" | "complete" | "cancelled" | undefined,
            start_date: p.start_date,
            end_date: p.end_date,
        }),
        (id) => client.deleteProject(id),
        ["name", "description", "solution_id", "status", "start_date", "end_date"],
        (p) => p.name
    );

    // 7. Objectives (depends on Projects)
    allStats.objectives = await syncSimpleEntity(
        "objectives",
        mergedObjectives,
        args.mode,
        args.dryRun,
        () => client.listObjectives(),
        (o) => client.createObjective({
            id: o.id,
            title: o.title,
            description: o.description,
            project_id: o.project_id,
            parent_id: o.parent_id,
            status: o.status as "draft" | "active" | "achieved" | "deferred" | undefined,
        }),
        (id, o) => client.updateObjective(id, {
            title: o.title,
            description: o.description,
            project_id: o.project_id,
            parent_id: o.parent_id,
            status: o.status as "draft" | "active" | "achieved" | "deferred" | undefined,
        }),
        (id) => client.deleteObjective(id),
        ["title", "description", "project_id", "parent_id", "status"],
        (o) => o.title
    );

    // 8. Metrics (no deps)
    allStats.metrics = await syncSimpleEntity(
        "metrics",
        projectsData?.metrics,
        args.mode,
        args.dryRun,
        () => client.listMetrics(),
        (m) => client.createMetric({ id: m.id, name: m.name, description: m.description, unit: m.unit, current_value: m.current_value }),
        (id, m) => client.updateMetric(id, { name: m.name, description: m.description, unit: m.unit, current_value: m.current_value }),
        (id) => client.deleteMetric(id),
        ["name", "description", "unit", "current_value"],
        (m) => m.name
    );

    // 9. KPIs (depends on Metrics, Objectives)
    allStats.kpis = await syncSimpleEntity(
        "kpis",
        projectsData?.kpis,
        args.mode,
        args.dryRun,
        () => client.listKpis(),
        (k) => client.createKpi({
            id: k.id,
            metric_id: k.metric_id,
            objective_id: k.objective_id,
            target_value: k.target_value,
            direction: k.direction as "increase" | "decrease" | "maintain",
            threshold_warning: k.threshold_warning,
            threshold_critical: k.threshold_critical,
        }),
        (id, k) => client.updateKpi(id, {
            metric_id: k.metric_id,
            objective_id: k.objective_id,
            target_value: k.target_value,
            direction: k.direction as "increase" | "decrease" | "maintain",
            threshold_warning: k.threshold_warning,
            threshold_critical: k.threshold_critical,
        }),
        (id) => client.deleteKpi(id),
        ["metric_id", "objective_id", "target_value", "direction"],
        (k) => k.id
    );

    // 10. Features (depends on Objectives)
    allStats.features = await syncSimpleEntity(
        "features",
        mergedFeatures,
        args.mode,
        args.dryRun,
        () => client.listFeatures(),
        (f) => client.createFeature({
            id: f.id,
            name: f.name,
            description: f.description,
            objective_id: f.objective_id,
            status: f.status as "planned" | "in_progress" | "complete" | "cancelled" | undefined,
        }),
        (id, f) => client.updateFeature(id, {
            name: f.name,
            description: f.description,
            objective_id: f.objective_id,
            status: f.status as "planned" | "in_progress" | "complete" | "cancelled" | undefined,
        }),
        (id) => client.deleteFeature(id),
        ["name", "description", "objective_id", "status"],
        (f) => f.name
    );

    // 11. Rules (depends on Features)
    allStats.rules = await syncSimpleEntity(
        "rules",
        mergedRules,
        args.mode,
        args.dryRun,
        () => client.listRules(),
        (r) => client.createRule({
            id: r.id,
            feature_id: r.feature_id,
            role: r.role,
            requirement: r.requirement,
            reason: r.reason,
            status: r.status as "draft" | "active" | "deprecated" | undefined,
        }),
        (id, r) => client.updateRule(id, {
            feature_id: r.feature_id,
            role: r.role,
            requirement: r.requirement,
            reason: r.reason,
            status: r.status as "draft" | "active" | "deprecated" | undefined,
        }),
        (id) => client.deleteRule(id),
        ["feature_id", "role", "requirement", "reason", "status"],
        (r) => r.id
    );

    // 12. Scenarios (depends on Rules)
    allStats.scenarios = await syncSimpleEntity(
        "scenarios",
        mergedScenarios,
        args.mode,
        args.dryRun,
        () => client.listScenarios(),
        (s) => client.createScenario({
            id: s.id,
            rule_id: s.rule_id,
            name: s.name,
            narrative: s.narrative,
            status: s.status as "draft" | "active" | "deprecated" | undefined,
        }),
        (id, s) => client.updateScenario(id, {
            rule_id: s.rule_id,
            name: s.name,
            narrative: s.narrative,
            status: s.status as "draft" | "active" | "deprecated" | undefined,
        }),
        (id) => client.deleteScenario(id),
        ["rule_id", "name", "narrative", "status"],
        (s) => s.name
    );

    // 13. Specifications (depends on Features)
    allStats.specifications = await syncSimpleEntity(
        "specifications",
        mergedSpecifications,
        args.mode,
        args.dryRun,
        () => client.listSpecifications(),
        (s) => client.createSpecification({
            id: s.id,
            feature_id: s.feature_id,
            name: s.name,
            narrative: s.narrative,
            category: s.category as "performance" | "security" | "usability" | "reliability" | "accessibility" | "maintainability",
            status: s.status as "draft" | "active" | "deprecated" | undefined,
        }),
        (id, s) => client.updateSpecification(id, {
            feature_id: s.feature_id,
            name: s.name,
            narrative: s.narrative,
            category: s.category as "performance" | "security" | "usability" | "reliability" | "accessibility" | "maintainability",
            status: s.status as "draft" | "active" | "deprecated" | undefined,
        }),
        (id) => client.deleteSpecification(id),
        ["feature_id", "name", "narrative", "category", "status"],
        (s) => s.name
    );

    // 14. Initiatives (depends on KPIs)
    allStats.initiatives = await syncSimpleEntity(
        "initiatives",
        projectsData?.initiatives,
        args.mode,
        args.dryRun,
        () => client.listInitiatives(),
        (i) => client.createInitiative({
            id: i.id,
            name: i.name,
            description: i.description,
            kpi_id: i.kpi_id,
            status: i.status as "planned" | "active" | "complete" | "cancelled" | undefined,
            start_date: i.start_date,
            end_date: i.end_date,
        }),
        (id, i) => client.updateInitiative(id, {
            name: i.name,
            description: i.description,
            kpi_id: i.kpi_id,
            status: i.status as "planned" | "active" | "complete" | "cancelled" | undefined,
            start_date: i.start_date,
            end_date: i.end_date,
        }),
        (id) => client.deleteInitiative(id),
        ["name", "description", "kpi_id", "status", "start_date", "end_date"],
        (i) => i.name
    );

    // 15. Activities (depends on Initiatives)
    allStats.activities = await syncSimpleEntity(
        "activities",
        projectsData?.activities,
        args.mode,
        args.dryRun,
        () => client.listActivities(),
        (a) => client.createActivity({
            id: a.id,
            name: a.name,
            description: a.description,
            parent_id: a.parent_id,
            initiative_id: a.initiative_id,
            blocked_by: a.blocked_by ? JSON.stringify(a.blocked_by) : undefined,
            status: a.status as "backlog" | "ready" | "in_progress" | "blocked" | "complete" | undefined,
        }),
        (id, a) => client.updateActivity(id, {
            name: a.name,
            description: a.description,
            parent_id: a.parent_id,
            initiative_id: a.initiative_id,
            blocked_by: a.blocked_by ? JSON.stringify(a.blocked_by) : undefined,
            status: a.status as "backlog" | "ready" | "in_progress" | "blocked" | "complete" | undefined,
        }),
        (id) => client.deleteActivity(id),
        ["name", "description", "parent_id", "initiative_id", "status"],
        (a) => a.name
    );

    // 16. Roles (no deps)
    allStats.roles = await syncSimpleEntity(
        "roles",
        projectsData?.roles,
        args.mode,
        args.dryRun,
        () => client.listRoles(),
        (r) => client.createRole({ id: r.id, name: r.name, description: r.description }),
        (id, r) => client.updateRole(id, { name: r.name, description: r.description }),
        (id) => client.deleteRole(id),
        ["name", "description"],
        (r) => r.name
    );

    // 17. Assignments (depends on Activities, Roles)
    allStats.assignments = await syncSimpleEntity(
        "assignments",
        projectsData?.assignments,
        args.mode,
        args.dryRun,
        () => client.listAssignments(),
        (a) => client.createAssignment({
            id: a.id,
            activity_id: a.activity_id,
            role_id: a.role_id,
            quantity: a.quantity,
            unit: a.unit,
            raci_type: a.raci_type as "responsible" | "accountable" | "consulted" | "informed" | undefined,
        }),
        (id, a) => client.updateAssignment(id, {
            activity_id: a.activity_id,
            role_id: a.role_id,
            quantity: a.quantity,
            unit: a.unit,
            raci_type: a.raci_type as "responsible" | "accountable" | "consulted" | "informed" | undefined,
        }),
        (id) => client.deleteAssignment(id),
        ["activity_id", "role_id", "quantity", "unit", "raci_type"],
        (a) => a.id
    );

    // 18. Allocations (depends on Assignments, Personnel)
    allStats.allocations = await syncSimpleEntity(
        "allocations",
        projectsData?.allocations,
        args.mode,
        args.dryRun,
        () => client.listAllocations(),
        (a) => client.createAllocation({
            id: a.id,
            assignment_id: a.assignment_id,
            person_id: a.person_id,
            quantity_contributed: a.quantity_contributed,
            start_date: a.start_date,
            end_date: a.end_date,
        }),
        (id, a) => client.updateAllocation(id, {
            assignment_id: a.assignment_id,
            person_id: a.person_id,
            quantity_contributed: a.quantity_contributed,
            start_date: a.start_date,
            end_date: a.end_date,
        }),
        (id) => client.deleteAllocation(id),
        ["assignment_id", "person_id", "quantity_contributed", "start_date", "end_date"],
        (a) => a.id
    );

    // 19. Calendar Events (no deps)
    const eventsData = loadToml<EventsToml>(args.scenario, "events.toml");
    allStats.calendarEvents = await syncCalendarEvents(
        client,
        eventsData?.events || [],
        args.mode,
        args.dryRun
    );

    // 20. Chat Channels (depends on Personnel for createdBy)
    const chatData = loadToml<ChatToml>(args.scenario, "chat.toml");
    allStats.chatChannels = await syncChatChannels(
        client,
        chatData?.channels || [],
        args.mode,
        args.dryRun
    );

    // 21. Chat Memberships (depends on Channels, Personnel)
    allStats.chatMemberships = await syncChatMemberships(
        client,
        chatData?.memberships || [],
        personnelIdMap,
        args.dryRun
    );

    // 22. Chat Messages (depends on Channels, Personnel)
    allStats.chatMessages = await syncChatMessages(
        client,
        chatData?.messages || [],
        personnelIdMap,
        args.dryRun
    );

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 Sync Summary");
    console.log("=".repeat(60));

    let totalCreated = 0, totalUpdated = 0, totalDeleted = 0, totalSkipped = 0, totalFailed = 0;

    for (const [entity, stats] of Object.entries(allStats)) {
        if (stats.created || stats.updated || stats.deleted || stats.failed) {
            console.log(`   ${entity}: +${stats.created} ~${stats.updated} -${stats.deleted} ✗${stats.failed}`);
        }
        totalCreated += stats.created;
        totalUpdated += stats.updated;
        totalDeleted += stats.deleted;
        totalSkipped += stats.skipped;
        totalFailed += stats.failed;
    }

    console.log("-".repeat(60));
    console.log(`   TOTAL: +${totalCreated} created, ~${totalUpdated} updated, -${totalDeleted} deleted, ✗${totalFailed} failed`);
    console.log(`   (${totalSkipped} unchanged/skipped)`);

    // Warn about skipped entities
    console.log("\n⚠️  Skipped entities (no API):");
    console.log("   - sites.toml: regions, sites, buildings, spaces");
    console.log("   - infrastructure.toml: racks, desks");
    console.log("   - assets.toml: network assets");
    console.log("   - components.toml: components");
    console.log("   - events.toml: participant_ids, all_day (TODO)");

    if (args.dryRun) {
        console.log("\n🔵 DRY RUN - No changes were made.");
    }

    console.log("");
}

main().catch((err) => {
    console.error("❌ Sync failed:", err);
    process.exit(1);
});
