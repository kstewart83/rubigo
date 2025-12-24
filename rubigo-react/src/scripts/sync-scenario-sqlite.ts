#!/usr/bin/env bun
/**
 * Scenario Sync CLI (SQLite Version)
 *
 * Syncs SQLite scenario data to a running Rubigo instance via API.
 * This is the new preferred method - uses pre-built SQLite database.
 *
 * Usage:
 *   bun run sync:scenario:sqlite -- --mode=create --url=http://localhost:3000 --token=xxx
 *
 * If profiles.sqlite doesn't exist, it will automatically run scenarios:build.
 */

import { loadScenarioData, type ScenarioData } from "./scenario-loader";
import { RubigoClient, type CalendarEventInput } from "../lib/rubigo-client";
import { spawn } from "bun";
import { existsSync, statSync, readdirSync } from "fs";
import { join } from "path";

/**
 * Recursively find all .sql files in a directory
 */
function findSqlFiles(dir: string): string[] {
    const results: string[] = [];

    if (!existsSync(dir)) return results;

    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...findSqlFiles(fullPath));
        } else if (entry.name.endsWith(".sql")) {
            results.push(fullPath);
        }
    }

    return results;
}

/**
 * Check if any SQL files are newer than the database
 */
function needsRebuild(scenarioDir: string): { needed: boolean; reason: string } {
    const dbPath = join(scenarioDir, "builds", "profiles.sqlite");

    // If database doesn't exist, definitely need to build
    if (!existsSync(dbPath)) {
        return { needed: true, reason: "profiles.sqlite not found" };
    }

    const dbMtime = statSync(dbPath).mtimeMs;

    // Find all SQL files in schema and profiles directories
    const schemaDir = join(scenarioDir, "schema");
    const profilesDir = join(scenarioDir, "profiles");

    const sqlFiles = [
        ...findSqlFiles(schemaDir),
        ...findSqlFiles(profilesDir),
    ];

    // Check if any SQL file is newer than the database
    for (const sqlFile of sqlFiles) {
        const sqlMtime = statSync(sqlFile).mtimeMs;
        if (sqlMtime > dbMtime) {
            const relativePath = sqlFile.replace(scenarioDir + "/", "");
            return { needed: true, reason: `${relativePath} is newer than profiles.sqlite` };
        }
    }

    return { needed: false, reason: "" };
}

/**
 * Build profiles database if it doesn't exist or if SQL files have changed
 */
async function ensureProfilesDatabase(scenarioDir: string): Promise<void> {
    const check = needsRebuild(scenarioDir);

    if (!check.needed) {
        return;
    }

    console.log(`📦 Auto-rebuilding: ${check.reason}\n`);

    const proc = spawn({
        cmd: ["bun", "run", "scenarios:build"],
        stdout: "inherit",
        stderr: "inherit",
    });

    const exitCode = await proc.exited;
    if (exitCode !== 0) {
        throw new Error(`Failed to build profiles database (exit code ${exitCode})`);
    }

    console.log("");
}

// ============================================================================
// CLI Argument Parsing
// ============================================================================

interface CliArgs {
    mode: "create" | "upsert" | "full";
    url: string;
    token: string;
    scenario: string;
    profile: string;
    dryRun: boolean;
}

function parseArgs(): CliArgs {
    const args = process.argv.slice(2);
    const result: CliArgs = {
        mode: "create",
        url: "http://localhost:3000",
        token: "",
        scenario: "../common/seed",
        profile: "mmc",
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
        } else if (arg.startsWith("--profile=")) {
            result.profile = arg.split("=")[1];
        } else if (arg === "--dry-run") {
            result.dryRun = true;
        }
    }

    result.token = result.token || process.env.RUBIGO_API_TOKEN || "";
    result.url = result.url || process.env.RUBIGO_API_URL || "http://localhost:3000";
    result.scenario = result.scenario || process.env.RUBIGO_SEED_DIR || "../common/seed";
    result.profile = result.profile || process.env.RUBIGO_PROFILE || "mmc";

    if (!result.token) {
        console.error("❌ API token required. Use --token=xxx or set RUBIGO_API_TOKEN.");
        process.exit(1);
    }

    return result;
}

// ============================================================================
// Types
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

function initStats(): SyncStats {
    return { created: 0, updated: 0, deleted: 0, skipped: 0, failed: 0 };
}

// ============================================================================
// ID Mapping System
// ============================================================================

/**
 * Maps seed IDs to remote IDs for relationship resolution.
 * Key = entity type (e.g., "personnel", "chatChannels")
 * Value = Map of seedId -> remoteId
 */
type IdMaps = Map<string, Map<string, string>>;

function createIdMaps(): IdMaps {
    return new Map();
}

function getIdMap(maps: IdMaps, entityType: string): Map<string, string> {
    if (!maps.has(entityType)) {
        maps.set(entityType, new Map());
    }
    return maps.get(entityType)!;
}

/**
 * Resolve a seed ID to its remote ID, or return the original if no mapping exists.
 */
function resolveId(maps: IdMaps, entityType: string, seedId: string | undefined | null): string | undefined {
    if (!seedId) return undefined;
    const map = maps.get(entityType);
    return map?.get(seedId) ?? seedId;
}

// ============================================================================
// Generic Sync Function with ID Mapping
// ============================================================================

interface SyncEntityOptions<T, E> {
    entityName: string;
    entityType: string; // Used as key in IdMaps
    items: T[];
    mode: CliArgs["mode"];
    dryRun: boolean;
    idMaps: IdMaps;

    // Get existing items from remote
    listFn: () => Promise<{ success: boolean; data?: E[] }>;

    // Create a new item, returns the remote ID
    createFn: (item: T) => Promise<{ success: boolean; id?: string; error?: string }>;

    // Update an existing item by remote ID (optional - for full/upsert mode)
    updateFn?: (id: string, item: T) => Promise<{ success: boolean; error?: string }>;

    // Delete an item by remote ID
    deleteFn?: (id: string) => Promise<{ success: boolean; error?: string }>;

    // Extract the seed ID from a seed item
    getSeedId: (item: T) => string;

    // Extract the remote ID from an existing item
    getRemoteId: (item: E) => string;

    // Extract the business key from a seed item
    getSeedKey: (item: T) => string;

    // Extract the business key from an existing item
    getRemoteKey: (item: E) => string;

    // Format name for logging
    formatName: (item: T) => string;

    // Protected IDs that should never be deleted (like global-admin)
    protectedIds?: Set<string>;

    // Protected business keys that should never be deleted
    protectedKeys?: Set<string>;
}

async function syncEntityWithMapping<T, E>(
    options: SyncEntityOptions<T, E>
): Promise<SyncStats> {
    const stats = initStats();
    const {
        entityName, entityType, items, mode, dryRun, idMaps,
        listFn, createFn, deleteFn,
        getSeedId, getRemoteId, getSeedKey, getRemoteKey,
        formatName, protectedIds, protectedKeys
    } = options;

    console.log(`\n📦 Syncing ${items.length} ${entityName}...`);

    // Get ID map for this entity type
    const idMap = getIdMap(idMaps, entityType);

    // Get existing items from database
    const existingResult = await listFn();
    const existingItems = (existingResult.success && existingResult.data) ? existingResult.data : [];

    // Build lookup by business key: remoteKey -> existingItem
    const existingByKey = new Map<string, E>();
    for (const item of existingItems) {
        existingByKey.set(getRemoteKey(item), item);
    }

    // Build set of seed business keys
    const seedKeys = new Set<string>(items.map(getSeedKey));

    // In full mode, delete items that exist in DB but NOT in seed data
    if (mode === "full" && deleteFn) {
        const toDelete = existingItems.filter(item => {
            const remoteKey = getRemoteKey(item);
            const remoteId = getRemoteId(item);
            return !seedKeys.has(remoteKey) &&
                !protectedIds?.has(remoteId) &&
                !protectedKeys?.has(remoteKey);
        });
        if (toDelete.length > 0) {
            console.log(`   🗑️  Deleting ${toDelete.length} ${entityName} not in seed...`);
            for (const existing of toDelete) {
                const remoteId = getRemoteId(existing);
                if (dryRun) {
                    console.log(`   🗑️  [DRY-RUN] Would delete: ${getRemoteKey(existing)}`);
                    stats.deleted++;
                } else {
                    const result = await deleteFn(remoteId);
                    if (result.success) {
                        stats.deleted++;
                    } else {
                        stats.failed++;
                        console.log(`   ❌ Failed to delete: ${getRemoteKey(existing)} - ${result.error}`);
                    }
                }
            }
        }
    }

    // Create, update, or skip items based on business key and mode
    for (const item of items) {
        const seedId = getSeedId(item);
        const seedKey = getSeedKey(item);
        const existing = existingByKey.get(seedKey);

        if (existing) {
            // Already exists - record the ID mapping
            const remoteId = getRemoteId(existing);
            idMap.set(seedId, remoteId);

            // In full or upsert mode, update existing items if updateFn is provided
            if ((mode === "full" || mode === "upsert") && options.updateFn) {
                if (dryRun) {
                    console.log(`   📝 [DRY-RUN] Would update: ${formatName(item)}`);
                    stats.updated++;
                } else {
                    const result = await options.updateFn(remoteId, item);
                    if (result.success) {
                        stats.updated++;
                    } else {
                        stats.failed++;
                        console.log(`   ❌ Failed to update: ${formatName(item)} - ${result.error}`);
                    }
                }
            } else {
                stats.skipped++;
            }
            continue;
        }

        if (dryRun) {
            console.log(`   🆕 [DRY-RUN] Would create: ${formatName(item)}`);
            stats.created++;
            // In dry-run, map to self so relationships can still be resolved
            idMap.set(seedId, seedId);
        } else {
            const result = await createFn(item);
            if (result.success && result.id) {
                stats.created++;
                // Record the mapping: seedId -> remoteId
                idMap.set(seedId, result.id);
            } else {
                stats.failed++;
                console.log(`   ❌ Failed: ${formatName(item)} - ${result.error}`);
            }
        }
    }

    return stats;
}

// System users/keys that should never be deleted during full sync
const PROTECTED_PERSONNEL_KEYS = new Set(["admin@rubigo.local"]);

// ============================================================================
// Main Sync Orchestrator
// ============================================================================

async function main() {
    const args = parseArgs();

    console.log("\n" + "=".repeat(60));
    console.log("🔄 Rubigo Scenario Sync (SQLite)");
    console.log("=".repeat(60));
    console.log(`   Mode: ${args.mode}`);
    console.log(`   URL: ${args.url}`);
    console.log(`   Scenario: ${args.scenario}`);
    console.log(`   Dry Run: ${args.dryRun}`);
    console.log("=".repeat(60));

    // Ensure profiles database exists (auto-build if not)
    await ensureProfilesDatabase(args.scenario);

    // Load data from SQLite
    const data = loadScenarioData(args.scenario, args.profile);
    console.log(`   📊 Profile: ${data.profileId}`);

    const client = new RubigoClient({
        baseUrl: args.url,
        apiToken: args.token,
    });

    // Initialize ID mapping system
    const idMaps = createIdMaps();
    const allStats: EntityStats = {};

    // Type definitions for remote entities
    type RemotePersonnel = { id: string; email: string; name: string };
    type RemoteSolution = { id: string; name: string };
    type RemoteProduct = { id: string };
    type RemoteService = { id: string; name: string };
    type RemoteProject = { id: string; name: string };
    type RemoteObjective = { id: string; title: string };
    type RemoteFeature = { id: string; name: string };
    type RemoteRule = { id: string; featureId: string; requirement: string };
    type RemoteScenario = { id: string; name: string };
    type RemoteChatChannel = { id: string; name: string };

    // 1. Personnel - business key: email
    allStats.personnel = await syncEntityWithMapping<typeof data.personnel[0], RemotePersonnel>({
        entityName: "personnel",
        entityType: "personnel",
        items: data.personnel,
        mode: args.mode,
        dryRun: args.dryRun,
        idMaps,
        listFn: () => client.listPersonnel({ pageSize: 1000 }) as Promise<{ success: boolean; data?: RemotePersonnel[] }>,
        createFn: (p) => client.createPersonnel({
            name: p.name,
            email: p.email,
            title: p.title,
            department: p.department,
            site: p.site,
            building: p.building,
            level: p.level,
            space: p.space,
            manager: resolveId(idMaps, "personnel", p.manager),
            deskPhone: p.desk_phone,
            cellPhone: p.cell_phone,
            bio: p.bio,
            clearanceLevel: p.clearance_level,
            tenantClearances: p.tenant_clearances,
            accessRoles: p.access_roles,
        }),
        updateFn: (id, p) => client.updatePersonnel(id, {
            name: p.name,
            email: p.email,
            title: p.title,
            department: p.department,
            site: p.site,
            building: p.building,
            level: p.level,
            space: p.space,
            manager: resolveId(idMaps, "personnel", p.manager),
            deskPhone: p.desk_phone,
            cellPhone: p.cell_phone,
            bio: p.bio,
            clearanceLevel: p.clearance_level,
            tenantClearances: p.tenant_clearances,
            accessRoles: p.access_roles,
        }),
        deleteFn: (id) => client.deletePersonnel(id),
        getSeedId: (p) => p.id,
        getRemoteId: (p) => p.id,
        getSeedKey: (p) => p.email,
        getRemoteKey: (p) => p.email,
        formatName: (p) => p.name,
        protectedKeys: PROTECTED_PERSONNEL_KEYS,
    });

    // 1b. Headshots - upload photos and update personnel records
    console.log(`\n📷 Syncing headshots...`);
    let headshotUploaded = 0, headshotSkipped = 0, headshotFailed = 0;

    // Find personnel with photo paths (relative paths like "headshots/name.png")
    const personnelWithPhotos = data.personnel.filter(p => p.photo && p.photo.startsWith("headshots/"));
    const profileDir = join(args.scenario, "profiles", args.profile);

    for (const person of personnelWithPhotos) {
        const remotePersonId = resolveId(idMaps, "personnel", person.id);
        if (!remotePersonId) {
            console.log(`   ⚠️  Skipping headshot for ${person.name}: personnel not synced`);
            headshotSkipped++;
            continue;
        }

        // Check if this personnel already has a /api/photos path (already synced)
        const existingPersonResult = await client.getPersonnel(remotePersonId) as { success: boolean; data?: { photo?: string } };
        if (existingPersonResult.success && existingPersonResult.data?.photo?.startsWith("/api/photos/")) {
            headshotSkipped++;
            continue;
        }

        const headshotPath = join(profileDir, person.photo!);
        if (!existsSync(headshotPath)) {
            console.log(`   ⚠️  Headshot file not found: ${person.photo}`);
            headshotFailed++;
            continue;
        }

        if (args.dryRun) {
            console.log(`   📷 [DRY-RUN] Would upload headshot for ${person.name}`);
            headshotUploaded++;
            continue;
        }

        // Read the file and upload via /api/photos
        try {
            const fileBuffer = await Bun.file(headshotPath).arrayBuffer();
            const fileName = person.photo!.split("/").pop() || "headshot.png";

            // Generate a deterministic photo ID from personnel ID
            const photoId = `headshot_${person.id}`;

            const formData = new FormData();
            formData.append("file", new Blob([fileBuffer], { type: "image/png" }), fileName);
            formData.append("id", photoId);

            const uploadResponse = await fetch(`${args.url}/api/photos`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${args.token}`,
                },
                body: formData,
            });

            const uploadResult = await uploadResponse.json() as { success?: boolean; path?: string; error?: string };

            if (uploadResult.success && uploadResult.path) {
                // Update personnel with the photo URL
                const updateResult = await client.updatePersonnel(remotePersonId, {
                    photo: uploadResult.path,
                });

                if (updateResult.success) {
                    headshotUploaded++;
                } else {
                    console.log(`   ❌ Failed to update personnel with photo: ${updateResult.error}`);
                    headshotFailed++;
                }
            } else {
                console.log(`   ❌ Failed to upload headshot for ${person.name}: ${uploadResult.error}`);
                headshotFailed++;
            }
        } catch (error) {
            console.log(`   ❌ Error uploading headshot for ${person.name}: ${error}`);
            headshotFailed++;
        }
    }
    allStats.headshots = { created: headshotUploaded, skipped: headshotSkipped, failed: headshotFailed, updated: 0, deleted: 0 };

    // 2. Solutions - business key: name
    allStats.solutions = await syncEntityWithMapping<typeof data.solutions[0], RemoteSolution>({
        entityName: "solutions",
        entityType: "solutions",
        items: data.solutions,
        mode: args.mode,
        dryRun: args.dryRun,
        idMaps,
        listFn: () => client.listSolutions() as Promise<{ success: boolean; data?: RemoteSolution[] }>,
        createFn: (s) => client.createSolution({
            name: s.name,
            description: s.description,
            status: s.status as "pipeline" | "catalog" | "retired" | undefined,
        }),
        getSeedId: (s) => s.id,
        getRemoteId: (s) => s.id,
        getSeedKey: (s) => s.name,
        getRemoteKey: (s) => s.name,
        formatName: (s) => s.name,
    });

    // 3. Products - business key: id (explicit in seed)
    allStats.products = await syncEntityWithMapping<typeof data.products[0], RemoteProduct>({
        entityName: "products",
        entityType: "products",
        items: data.products,
        mode: args.mode,
        dryRun: args.dryRun,
        idMaps,
        listFn: () => client.listProducts() as Promise<{ success: boolean; data?: RemoteProduct[] }>,
        createFn: (p) => client.createProduct({
            id: p.id,
            solution_id: resolveId(idMaps, "solutions", p.solution_id) || p.solution_id,
            version: p.version,
        }),
        getSeedId: (p) => p.id,
        getRemoteId: (p) => p.id,
        getSeedKey: (p) => p.id,
        getRemoteKey: (p) => p.id,
        formatName: (p) => p.id,
    });

    // 4. Services - business key: name
    allStats.services = await syncEntityWithMapping<typeof data.services[0], RemoteService>({
        entityName: "services",
        entityType: "services",
        items: data.services,
        mode: args.mode,
        dryRun: args.dryRun,
        idMaps,
        listFn: () => client.listServices() as Promise<{ success: boolean; data?: RemoteService[] }>,
        createFn: (s) => client.createService({
            name: s.name,
            solution_id: resolveId(idMaps, "solutions", s.solution_id) || s.solution_id,
            service_level: s.service_level,
        }),
        getSeedId: (s) => s.id,
        getRemoteId: (s) => s.id,
        getSeedKey: (s) => s.name,
        getRemoteKey: (s) => s.name,
        formatName: (s) => s.name,
    });

    // 5. Projects - business key: name
    allStats.projects = await syncEntityWithMapping<typeof data.projects[0], RemoteProject>({
        entityName: "projects",
        entityType: "projects",
        items: data.projects,
        mode: args.mode,
        dryRun: args.dryRun,
        idMaps,
        listFn: () => client.listProjects() as Promise<{ success: boolean; data?: RemoteProject[] }>,
        createFn: (p) => client.createProject({
            name: p.name,
            description: p.description,
            solution_id: resolveId(idMaps, "solutions", p.solution_id),
            status: p.status as "planning" | "active" | "on_hold" | "complete" | "cancelled" | undefined,
            start_date: p.start_date,
            end_date: p.end_date,
        }),
        getSeedId: (p) => p.id,
        getRemoteId: (p) => p.id,
        getSeedKey: (p) => p.name,
        getRemoteKey: (p) => p.name,
        formatName: (p) => p.name,
    });

    // 6. Objectives - business key: title
    allStats.objectives = await syncEntityWithMapping<typeof data.objectives[0], RemoteObjective>({
        entityName: "objectives",
        entityType: "objectives",
        items: data.objectives,
        mode: args.mode,
        dryRun: args.dryRun,
        idMaps,
        listFn: () => client.listObjectives() as Promise<{ success: boolean; data?: RemoteObjective[] }>,
        createFn: (o) => client.createObjective({
            title: o.title,
            description: o.description,
            project_id: resolveId(idMaps, "projects", o.project_id),
            parent_id: resolveId(idMaps, "objectives", o.parent_id),
            status: o.status as "draft" | "active" | "achieved" | "deferred" | undefined,
        }),
        getSeedId: (o) => o.id,
        getRemoteId: (o) => o.id,
        getSeedKey: (o) => o.title,
        getRemoteKey: (o) => o.title,
        formatName: (o) => o.title,
    });

    // 7. Features - business key: name
    allStats.features = await syncEntityWithMapping<typeof data.features[0], RemoteFeature>({
        entityName: "features",
        entityType: "features",
        items: data.features,
        mode: args.mode,
        dryRun: args.dryRun,
        idMaps,
        listFn: () => client.listFeatures() as Promise<{ success: boolean; data?: RemoteFeature[] }>,
        createFn: (f) => client.createFeature({
            name: f.name,
            description: f.description,
            objective_id: resolveId(idMaps, "objectives", f.objective_id),
            status: f.status as "planned" | "in_progress" | "complete" | "cancelled" | undefined,
        }),
        getSeedId: (f) => f.id,
        getRemoteId: (f) => f.id,
        getSeedKey: (f) => f.name,
        getRemoteKey: (f) => f.name,
        formatName: (f) => f.name,
    });

    // 8. Rules - business key: feature_id + requirement (composite)
    // Note: getSeedKey must use RESOLVED feature ID to match remote featureId
    allStats.rules = await syncEntityWithMapping<typeof data.rules[0], RemoteRule>({
        entityName: "rules",
        entityType: "rules",
        items: data.rules,
        mode: args.mode,
        dryRun: args.dryRun,
        idMaps,
        listFn: () => client.listRules() as Promise<{ success: boolean; data?: RemoteRule[] }>,
        createFn: (r) => client.createRule({
            feature_id: resolveId(idMaps, "features", r.feature_id) || r.feature_id,
            role: r.role,
            requirement: r.requirement,
            reason: r.reason,
            status: r.status as "draft" | "active" | "deprecated" | undefined,
        }),
        getSeedId: (r) => r.id,
        getRemoteId: (r) => r.id,
        // Use composite key: resolved featureId + first 50 chars of requirement
        getSeedKey: (r) => `${resolveId(idMaps, "features", r.feature_id) || r.feature_id}:${r.requirement.slice(0, 50)}`,
        getRemoteKey: (r) => `${r.featureId}:${r.requirement.slice(0, 50)}`,
        formatName: (r) => `rule for feature`,
    });

    // 9. Scenarios - business key: name
    allStats.scenarios = await syncEntityWithMapping<typeof data.scenarios[0], RemoteScenario>({
        entityName: "scenarios",
        entityType: "scenarios",
        items: data.scenarios,
        mode: args.mode,
        dryRun: args.dryRun,
        idMaps,
        listFn: () => client.listScenarios() as Promise<{ success: boolean; data?: RemoteScenario[] }>,
        createFn: (s) => client.createScenario({
            rule_id: resolveId(idMaps, "rules", s.rule_id) || s.rule_id,
            name: s.name,
            narrative: s.narrative,
            status: s.status as "draft" | "active" | "deprecated" | undefined,
        }),
        getSeedId: (s) => s.id,
        getRemoteId: (s) => s.id,
        getSeedKey: (s) => s.name,
        getRemoteKey: (s) => s.name,
        formatName: (s) => s.name,
    });

    // 10. Chat Channels - business key: name
    allStats.chatChannels = await syncEntityWithMapping<typeof data.chatChannels[0], RemoteChatChannel>({
        entityName: "chat channels",
        entityType: "chatChannels",
        items: data.chatChannels,
        mode: args.mode,
        dryRun: args.dryRun,
        idMaps,
        listFn: () => client.listChatChannels() as Promise<{ success: boolean; data?: RemoteChatChannel[] }>,
        createFn: (c) => client.createChatChannel({
            name: c.name,
            description: c.description,
            type: c.type as "channel" | "dm" | undefined ?? "channel",
        }),
        deleteFn: (id) => client.deleteChatChannel(id),
        getSeedId: (c) => c.id,
        getRemoteId: (c) => c.id,
        getSeedKey: (c) => c.name,
        getRemoteKey: (c) => c.name,
        formatName: (c) => c.name,
    });

    // 11. Chat Memberships - join personnel to channels
    // Need to resolve both channel_id and person_id to remote IDs
    console.log(`\n📦 Syncing ${data.chatMemberships.length} chat memberships...`);
    let membershipCreated = 0, membershipSkipped = 0, membershipFailed = 0;

    for (const membership of data.chatMemberships) {
        const remoteChannelId = resolveId(idMaps, "chatChannels", membership.channel_id);
        const remotePersonId = resolveId(idMaps, "personnel", membership.person_id);

        if (!remoteChannelId || !remotePersonId) {
            console.log(`   ⚠️  Skipping membership: unresolved channel=${membership.channel_id} or person=${membership.person_id}`);
            membershipSkipped++;
            continue;
        }

        if (args.dryRun) {
            console.log(`   🆕 [DRY-RUN] Would add member: ${membership.person_id} to ${membership.channel_id}`);
            membershipCreated++;
        } else {
            const result = await client.addChatMember({
                channelId: remoteChannelId,
                personnelId: remotePersonId,
            });
            if (result.success) {
                // Check if the API indicates member already existed
                if ((result as { existed?: boolean }).existed) {
                    membershipSkipped++;
                } else {
                    membershipCreated++;
                }
            } else {
                membershipFailed++;
                console.log(`   ❌ Failed to add member: ${result.error}`);
            }
        }
    }
    allStats.chatMemberships = { created: membershipCreated, skipped: membershipSkipped, failed: membershipFailed, updated: 0, deleted: 0 };

    // 12. Chat Messages - send messages with resolved IDs (with deduplication)
    console.log(`\n📦 Syncing ${data.chatMessages.length} chat messages...`);
    let messageCreated = 0, messageSkipped = 0, messageFailed = 0;

    // Build a cache of existing messages per channel to check for duplicates
    // Key: channelId -> Set of "senderId:content" strings
    const existingMessagesByChannel = new Map<string, Set<string>>();

    // Get unique channels from messages to sync
    const channelsToCheck = new Set<string>();
    for (const message of data.chatMessages) {
        const remoteChannelId = resolveId(idMaps, "chatChannels", message.channel_id);
        if (remoteChannelId) channelsToCheck.add(remoteChannelId);
    }

    // Fetch existing messages for each channel
    for (const channelId of channelsToCheck) {
        if (!args.dryRun) {
            const existing = await client.listChatMessages(channelId, 1000) as { success: boolean; data?: Array<{ senderId: string; content: string }> };
            if (existing.success && existing.data) {
                const messageSet = new Set<string>();
                for (const msg of existing.data) {
                    // Use senderId + first 100 chars of content as dedup key
                    messageSet.add(`${msg.senderId}:${msg.content.slice(0, 100)}`);
                }
                existingMessagesByChannel.set(channelId, messageSet);
            }
        }
    }

    for (const message of data.chatMessages) {
        const remoteChannelId = resolveId(idMaps, "chatChannels", message.channel_id);
        const remoteSenderId = resolveId(idMaps, "personnel", message.sender_id);

        if (!remoteChannelId || !remoteSenderId) {
            console.log(`   ⚠️  Skipping message: unresolved channel=${message.channel_id} or sender=${message.sender_id}`);
            messageSkipped++;
            continue;
        }

        // Check if message already exists (dedup by senderId + content prefix)
        const dedupKey = `${remoteSenderId}:${message.content.slice(0, 100)}`;
        const existingMessages = existingMessagesByChannel.get(remoteChannelId);
        if (existingMessages?.has(dedupKey)) {
            messageSkipped++;
            continue;
        }

        if (args.dryRun) {
            console.log(`   🆕 [DRY-RUN] Would send message from ${message.sender_id} in ${message.channel_id}`);
            messageCreated++;
        } else {
            const result = await client.sendChatMessage({
                channelId: remoteChannelId,
                senderId: remoteSenderId,
                content: message.content,
                sentAt: message.sent_at,
            });
            if (result.success) {
                messageCreated++;
                // Add to existing set so we don't re-send in same run
                existingMessages?.add(dedupKey);
            } else {
                messageFailed++;
                console.log(`   ❌ Failed to send message: ${result.error}`);
            }
        }
    }
    allStats.chatMessages = { created: messageCreated, skipped: messageSkipped, failed: messageFailed, updated: 0, deleted: 0 };

    // 13. Calendar Events - sync with ID mapping for organizer
    console.log(`\n📦 Syncing ${data.calendarEvents.length} calendar events...`);
    let calendarCreated = 0, calendarSkipped = 0, calendarFailed = 0;

    // List existing calendar events (get all from a wide range)
    const existingEventsResult = await client.listCalendarEvents("2020-01-01", "2030-12-31") as { success: boolean; events?: Array<{ id: string; title: string }> };
    const existingEventsByTitle = new Map<string, string>();
    if (existingEventsResult.success && existingEventsResult.events) {
        for (const event of existingEventsResult.events) {
            existingEventsByTitle.set(event.title, event.id);
        }
    }

    for (const event of data.calendarEvents) {
        // Check if event already exists by title
        if (existingEventsByTitle.has(event.title)) {
            calendarSkipped++;
            continue;
        }

        const remoteOrganizerId = resolveId(idMaps, "personnel", event.organizer_id);

        if (args.dryRun) {
            console.log(`   🆕 [DRY-RUN] Would create event: ${event.title}`);
            calendarCreated++;
        } else {
            const result = await client.createCalendarEvent({
                title: event.title,
                description: event.description || undefined,
                startTime: event.start_time,
                endTime: event.end_time,
                allDay: event.all_day === 1,
                eventType: event.event_type as "planning" | "meeting" | "standup" | "allHands" | "oneOnOne" | "training" | "interview" | "holiday" | "conference" | "review" | "appointment" | "reminder" | "outOfOffice" | undefined,
                recurrence: event.recurrence as "none" | "daily" | "weekly" | "monthly" | "yearly" | undefined,
                recurrenceInterval: event.recurrence_interval || undefined,
                recurrenceDays: event.recurrence_days ? JSON.parse(event.recurrence_days) : undefined,
                recurrenceUntil: event.recurrence_until || undefined,
                organizerId: remoteOrganizerId,
                location: event.location || undefined,
                virtualUrl: event.virtual_url || undefined,
            });
            if (result.success) {
                calendarCreated++;
            } else {
                calendarFailed++;
                console.log(`   ❌ Failed to create event ${event.title}: ${result.error}`);
            }
        }
    }
    allStats.calendarEvents = { created: calendarCreated, skipped: calendarSkipped, failed: calendarFailed, updated: 0, deleted: 0 };

    // Build a mapping from seed calendar event IDs to remote IDs by matching on title
    const seedEventIdToRemote = new Map<string, string>();
    for (const event of data.calendarEvents) {
        const remoteId = existingEventsByTitle.get(event.title);
        if (remoteId) {
            seedEventIdToRemote.set(event.id, remoteId);
        }
    }

    // 14. Calendar Deviations - sync orphaned deviation examples
    console.log(`\n📦 Syncing ${data.calendarDeviations.length} calendar deviations...`);
    let deviationCreated = 0, deviationSkipped = 0, deviationFailed = 0;

    for (const deviation of data.calendarDeviations) {
        // Resolve seed event ID to remote event ID
        const remoteEventId = seedEventIdToRemote.get(deviation.event_id);
        if (!remoteEventId) {
            console.log(`   ⚠️  Skipping deviation: event ${deviation.event_id} not found in database`);
            deviationSkipped++;
            continue;
        }

        if (args.dryRun) {
            console.log(`   🆕 [DRY-RUN] Would create deviation for event: ${deviation.event_id}, date: ${deviation.original_date || deviation.new_date}`);
            deviationCreated++;
        } else {
            const result = await client.createCalendarDeviation({
                eventId: remoteEventId,
                originalDate: deviation.original_date || undefined,
                newDate: deviation.new_date || undefined,
                cancelled: deviation.cancelled === 1,
                overrideStartTime: deviation.override_start_time || undefined,
                overrideEndTime: deviation.override_end_time || undefined,
                overrideTitle: deviation.override_title || undefined,
                overrideDescription: deviation.override_description || undefined,
                overrideLocation: deviation.override_location || undefined,
                overrideTimezone: deviation.override_timezone || undefined,
            });
            if (result.success) {
                if ((result as { existed?: boolean }).existed) {
                    deviationSkipped++;
                } else {
                    deviationCreated++;
                }
            } else {
                deviationFailed++;
                console.log(`   ❌ Failed to create deviation: ${result.error}`);
            }
        }
    }
    allStats.calendarDeviations = { created: deviationCreated, skipped: deviationSkipped, failed: deviationFailed, updated: 0, deleted: 0 };

    // =========================================================================
    // Sync Email (threads, emails, recipients)
    // =========================================================================

    // Map seed thread/email IDs to remote IDs
    const emailThreadIdMap = new Map<string, string>();
    const emailIdMap = new Map<string, string>();

    // Sync email threads
    console.log(`\n📧 Syncing email threads...`);
    let threadCreated = 0, threadSkipped = 0, threadFailed = 0;

    for (const thread of data.emailThreads) {
        if (args.dryRun) {
            console.log(`   [DRY-RUN] Would create thread: ${thread.subject}`);
            threadCreated++;
        } else {
            const result = await client.createEmailThread({
                subject: thread.subject,
                createdAt: thread.created_at,
                updatedAt: thread.updated_at,
            });

            if (result.success && result.id) {
                emailThreadIdMap.set(thread.id, result.id);
                if ((result as { existed?: boolean }).existed) {
                    threadSkipped++;
                } else {
                    threadCreated++;
                }
            } else {
                threadFailed++;
                console.log(`   ❌ Failed to create thread ${thread.subject}: ${result.error}`);
            }
        }
    }
    allStats.emailThreads = { created: threadCreated, skipped: threadSkipped, failed: threadFailed, updated: 0, deleted: 0 };

    // Sync emails
    console.log(`\n📧 Syncing emails...`);
    let emailCreated = 0, emailSkipped = 0, emailFailed = 0;

    for (const email of data.emails) {
        const threadId = emailThreadIdMap.get(email.thread_id) || email.thread_id;
        const fromId = resolveId(idMaps, "personnel", email.from_id);

        if (!fromId) {
            console.log(`   ⚠️ Skipping email (no from_id mapping): ${email.subject}`);
            emailFailed++;
            continue;
        }

        if (args.dryRun) {
            console.log(`   [DRY-RUN] Would create email: ${email.subject}`);
            emailCreated++;
        } else {
            const result = await client.createEmail({
                threadId,
                fromId,
                subject: email.subject,
                body: email.body,
                parentEmailId: email.parent_email_id ? emailIdMap.get(email.parent_email_id) || email.parent_email_id : undefined,
                sentAt: email.sent_at || undefined,
                isDraft: email.is_draft === 1,
                createdAt: email.created_at,
            });

            if (result.success && result.id) {
                emailIdMap.set(email.id, result.id);
                if ((result as { existed?: boolean }).existed) {
                    emailSkipped++;
                } else {
                    emailCreated++;
                }
            } else {
                emailFailed++;
                console.log(`   ❌ Failed to create email ${email.subject}: ${result.error}`);
            }
        }
    }
    allStats.emails = { created: emailCreated, skipped: emailSkipped, failed: emailFailed, updated: 0, deleted: 0 };

    // Sync email recipients
    console.log(`\n📧 Syncing email recipients...`);
    let recipientCreated = 0, recipientSkipped = 0, recipientFailed = 0;

    for (const recipient of data.emailRecipients) {
        const emailId = emailIdMap.get(recipient.email_id) || recipient.email_id;
        const personnelId = recipient.personnel_id ? resolveId(idMaps, "personnel", recipient.personnel_id) : undefined;

        if (args.dryRun) {
            console.log(`   [DRY-RUN] Would create recipient for email ${recipient.email_id}`);
            recipientCreated++;
        } else {
            const result = await client.createEmailRecipient({
                emailId,
                personnelId,
                emailAddress: recipient.email_address || undefined,
                type: recipient.type as "to" | "cc" | "bcc" | undefined,
                folder: recipient.folder as "inbox" | "sent" | "drafts" | "trash" | undefined,
                read: recipient.read === 1,
            });

            if (result.success) {
                if ((result as { existed?: boolean }).existed) {
                    recipientSkipped++;
                } else {
                    recipientCreated++;
                }
            } else {
                recipientFailed++;
                console.log(`   ❌ Failed to create recipient: ${result.error}`);
            }
        }
    }
    allStats.emailRecipients = { created: recipientCreated, skipped: recipientSkipped, failed: recipientFailed, updated: 0, deleted: 0 };

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 Sync Summary");
    console.log("=".repeat(60));

    let totalCreated = 0, totalUpdated = 0, totalSkipped = 0, totalFailed = 0, totalDeleted = 0;

    for (const [entity, stats] of Object.entries(allStats)) {
        if (stats.created || stats.updated || stats.failed || stats.deleted) {
            const parts = [];
            if (stats.deleted) parts.push(`−${stats.deleted}`);
            if (stats.created) parts.push(`+${stats.created}`);
            if (stats.updated) parts.push(`✏️${stats.updated}`);
            if (stats.failed) parts.push(`✗${stats.failed}`);
            console.log(`   ${entity}: ${parts.join(" ")}`);
        }
        totalCreated += stats.created;
        totalUpdated += stats.updated;
        totalSkipped += stats.skipped;
        totalFailed += stats.failed;
        totalDeleted += stats.deleted;
    }

    console.log("-".repeat(60));
    const summaryParts = [];
    if (totalDeleted) summaryParts.push(`−${totalDeleted} deleted`);
    summaryParts.push(`+${totalCreated} created`);
    if (totalUpdated) summaryParts.push(`✏️${totalUpdated} updated`);
    summaryParts.push(`✗${totalFailed} failed`);
    console.log(`   TOTAL: ${summaryParts.join(", ")}`);
    console.log(`   (${totalSkipped} already exist/skipped)`);

    if (args.dryRun) {
        console.log("\n🔵 DRY RUN - No changes were made.");
    }

    console.log("");
}

main().catch((err) => {
    console.error("❌ Sync failed:", err);
    process.exit(1);
});
