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
 * Prerequisites:
 *   bun run scenarios:build
 */

import { loadScenarioData, type ScenarioData } from "./scenario-loader";
import { RubigoClient, type CalendarEventInput } from "../lib/rubigo-client";

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
        scenario: "../common/scenarios",
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
    result.scenario = result.scenario || process.env.RUBIGO_SEED_DIR || "../common/scenarios";
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
// Generic Sync Function
// ============================================================================

async function syncEntity<T extends { id: string }>(
    entityName: string,
    items: T[],
    mode: CliArgs["mode"],
    dryRun: boolean,
    listFn: () => Promise<{ success: boolean; data?: unknown[] }>,
    createFn: (item: T) => Promise<{ success: boolean; error?: string }>,
    formatName: (item: T) => string
): Promise<SyncStats> {
    const stats = initStats();

    if (!items.length) {
        return stats;
    }

    console.log(`\n📦 Syncing ${items.length} ${entityName}...`);

    // Get existing items
    const existingResult = await listFn();
    const existingIds = new Set<string>();

    if (existingResult.success && existingResult.data) {
        for (const item of existingResult.data as Array<{ id: string }>) {
            existingIds.add(item.id);
        }
    }

    for (const item of items) {
        if (existingIds.has(item.id)) {
            stats.skipped++;
            continue;
        }

        if (dryRun) {
            console.log(`   🆕 [DRY-RUN] Would create: ${formatName(item)}`);
            stats.created++;
        } else {
            const result = await createFn(item);
            if (result.success) {
                stats.created++;
            } else {
                stats.failed++;
                console.log(`   ❌ Failed: ${formatName(item)} - ${result.error}`);
            }
        }
    }

    return stats;
}

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

    // Load data from SQLite
    const data = loadScenarioData(args.scenario, args.profile);
    console.log(`   📊 Profile: ${data.profileId}`);

    const client = new RubigoClient({
        baseUrl: args.url,
        apiToken: args.token,
    });

    const allStats: EntityStats = {};

    // 1. Personnel
    allStats.personnel = await syncEntity(
        "personnel",
        data.personnel,
        args.mode,
        args.dryRun,
        () => client.listPersonnel({ pageSize: 1000 }),
        (p) => client.createPersonnel({
            name: p.name,
            email: p.email,
            title: p.title,
            department: p.department,
            site: p.site,
            building: p.building,
            level: p.level,
            space: p.space,
            manager: p.manager,
            deskPhone: p.desk_phone,
            cellPhone: p.cell_phone,
            bio: p.bio,
        }),
        (p) => p.name
    );

    // 2. Solutions
    allStats.solutions = await syncEntity(
        "solutions",
        data.solutions,
        args.mode,
        args.dryRun,
        () => client.listSolutions(),
        (s) => client.createSolution({
            id: s.id,
            name: s.name,
            description: s.description,
            status: s.status as "pipeline" | "catalog" | "retired" | undefined,
        }),
        (s) => s.name
    );

    // 3. Products
    allStats.products = await syncEntity(
        "products",
        data.products,
        args.mode,
        args.dryRun,
        () => client.listProducts(),
        (p) => client.createProduct({
            id: p.id,
            solution_id: p.solution_id,
            version: p.version,
        }),
        (p) => p.id
    );

    // 4. Services
    allStats.services = await syncEntity(
        "services",
        data.services,
        args.mode,
        args.dryRun,
        () => client.listServices(),
        (s) => client.createService({
            id: s.id,
            name: s.name,
            solution_id: s.solution_id,
            service_level: s.service_level,
        }),
        (s) => s.name
    );

    // 5. Projects
    allStats.projects = await syncEntity(
        "projects",
        data.projects,
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
        (p) => p.name
    );

    // 6. Objectives
    allStats.objectives = await syncEntity(
        "objectives",
        data.objectives,
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
        (o) => o.title
    );

    // 7. Features
    allStats.features = await syncEntity(
        "features",
        data.features,
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
        (f) => f.name
    );

    // 8. Rules
    allStats.rules = await syncEntity(
        "rules",
        data.rules,
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
        (r) => r.id
    );

    // 9. Scenarios
    allStats.scenarios = await syncEntity(
        "scenarios",
        data.scenarios,
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
        (s) => s.name
    );

    // 10. Chat Channels
    allStats.chatChannels = await syncEntity(
        "chat channels",
        data.chatChannels,
        args.mode,
        args.dryRun,
        () => client.listChatChannels(),
        (c) => client.createChatChannel({
            id: c.id,
            name: c.name,
            description: c.description,
            type: c.type as "channel" | "dm" | undefined ?? "channel",
        }),
        (c) => c.name
    );

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 Sync Summary");
    console.log("=".repeat(60));

    let totalCreated = 0, totalSkipped = 0, totalFailed = 0;

    for (const [entity, stats] of Object.entries(allStats)) {
        if (stats.created || stats.failed) {
            console.log(`   ${entity}: +${stats.created} ✗${stats.failed}`);
        }
        totalCreated += stats.created;
        totalSkipped += stats.skipped;
        totalFailed += stats.failed;
    }

    console.log("-".repeat(60));
    console.log(`   TOTAL: +${totalCreated} created, ✗${totalFailed} failed`);
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
