/**
 * Database Sync Script
 * 
 * Syncs TOML seed data to the database using "insert if missing" strategy.
 * Goes through Server Actions to ensure proper logging.
 * 
 * Run with: bun run db:sync
 */

import { db } from "./index";
import * as schema from "./schema";
import { parse } from "@iarna/toml";
import { readFileSync, existsSync, watch } from "fs";
import { join } from "path";

// Get TOML file location from environment
function getTomlPath(): string {
    const seedDir = process.env.RUBIGO_SEED_DIR;
    if (!seedDir) {
        throw new Error("RUBIGO_SEED_DIR environment variable is not set. Cannot sync seed data.");
    }
    return join(seedDir, "projects.toml");
}

// Sync Engine persona for action logs
const SYNC_ACTOR = {
    id: "system-sync",
    name: "Seed Data Sync Engine",
};

interface RawTomlData {
    solutions?: Array<Record<string, unknown>>;
    products?: Array<Record<string, unknown>>;
    services?: Array<Record<string, unknown>>;
    releases?: Array<Record<string, unknown>>;
    projects?: Array<Record<string, unknown>>;
    objectives?: Array<Record<string, unknown>>;
    features?: Array<Record<string, unknown>>;
    rules?: Array<Record<string, unknown>>;
    scenarios?: Array<Record<string, unknown>>;
    specifications?: Array<Record<string, unknown>>;
    evidences?: Array<Record<string, unknown>>;
    evaluations?: Array<Record<string, unknown>>;
    metrics?: Array<Record<string, unknown>>;
    kpis?: Array<Record<string, unknown>>;
    initiatives?: Array<Record<string, unknown>>;
    activities?: Array<Record<string, unknown>>;
    roles?: Array<Record<string, unknown>>;
    assignments?: Array<Record<string, unknown>>;
    allocations?: Array<Record<string, unknown>>;
}

interface SyncStats {
    checked: number;
    inserted: number;
    skipped: number;
}

// Generate timestamp for action logs
const getTimestamp = () => new Date().toISOString();
const generateLogId = () => Math.random().toString(36).substring(2, 9);

// Log an action to the database
async function logAction(
    operationId: string,
    entityType: string,
    entityId: string,
    action: "create" | "read" | "update" | "delete"
) {
    await db.insert(schema.actionLogs).values({
        id: generateLogId(),
        timestamp: getTimestamp(),
        operationId,
        entityType,
        entityId,
        action,
        actorId: SYNC_ACTOR.id,
        actorName: SYNC_ACTOR.name,
    });
}

async function sync(): Promise<SyncStats> {
    const stats: SyncStats = { checked: 0, inserted: 0, skipped: 0 };

    const tomlPath = getTomlPath();

    // Check if TOML file exists
    if (!existsSync(tomlPath)) {
        console.error(`❌ TOML file not found at: ${tomlPath}`);
        return stats;
    }

    // Parse TOML
    const content = readFileSync(tomlPath, "utf-8");
    const data = parse(content) as RawTomlData;

    console.log("🔄 Syncing TOML data to database...");

    // Sync Solutions
    if (data.solutions?.length) {
        for (const s of data.solutions) {
            stats.checked++;
            const id = s.id as string;

            const existing = await db.select().from(schema.solutions).all();
            const found = existing.some(e => e.id === id);

            if (!found) {
                await db.insert(schema.solutions).values({
                    id,
                    name: s.name as string,
                    description: s.description as string | undefined,
                    status: s.status as "pipeline" | "catalog" | "retired" | undefined,
                });
                await logAction("createSolution", "solution", id, "create");
                stats.inserted++;
                console.log(`  ✅ Created solution: ${s.name}`);
            } else {
                stats.skipped++;
            }
        }
    }

    // Sync Products
    if (data.products?.length) {
        for (const p of data.products) {
            stats.checked++;
            const id = p.id as string;

            const existing = await db.select().from(schema.products).all();
            const found = existing.some(e => e.id === id);

            if (!found) {
                await db.insert(schema.products).values({
                    id,
                    solutionId: p.solution_id as string,
                    version: p.version as string | undefined,
                    releaseDate: p.release_date as string | undefined,
                });
                await logAction("createProduct", "product", id, "create");
                stats.inserted++;
                console.log(`  ✅ Created product: ${id}`);
            } else {
                stats.skipped++;
            }
        }
    }

    // Sync Services
    if (data.services?.length) {
        for (const s of data.services) {
            stats.checked++;
            const id = s.id as string;

            const existing = await db.select().from(schema.services).all();
            const found = existing.some(e => e.id === id);

            if (!found) {
                await db.insert(schema.services).values({
                    id,
                    name: s.name as string,
                    solutionId: s.solution_id as string,
                    serviceLevel: s.service_level as string | undefined,
                });
                await logAction("createService", "service", id, "create");
                stats.inserted++;
                console.log(`  ✅ Created service: ${id}`);
            } else {
                stats.skipped++;
            }
        }
    }

    // Sync Projects
    if (data.projects?.length) {
        for (const p of data.projects) {
            stats.checked++;
            const id = p.id as string;

            const existing = await db.select().from(schema.projects).all();
            const found = existing.some(e => e.id === id);

            if (!found) {
                await db.insert(schema.projects).values({
                    id,
                    name: p.name as string,
                    description: p.description as string | undefined,
                    solutionId: p.solution_id as string | undefined,
                    status: p.status as "planning" | "active" | "on_hold" | "complete" | "cancelled" | undefined,
                    startDate: p.start_date as string | undefined,
                    endDate: p.end_date as string | undefined,
                });
                await logAction("createProject", "project", id, "create");
                stats.inserted++;
                console.log(`  ✅ Created project: ${p.name}`);
            } else {
                stats.skipped++;
            }
        }
    }

    // Sync Objectives
    if (data.objectives?.length) {
        for (const o of data.objectives) {
            stats.checked++;
            const id = o.id as string;

            const existing = await db.select().from(schema.objectives).all();
            const found = existing.some(e => e.id === id);

            if (!found) {
                await db.insert(schema.objectives).values({
                    id,
                    title: o.title as string,
                    description: o.description as string | undefined,
                    projectId: o.project_id as string | undefined,
                    parentId: o.parent_id as string | undefined,
                    status: o.status as "draft" | "active" | "achieved" | "deferred" | undefined,
                });
                await logAction("createObjective", "objective", id, "create");
                stats.inserted++;
                console.log(`  ✅ Created objective: ${o.title}`);
            } else {
                stats.skipped++;
            }
        }
    }

    // Sync Features
    if (data.features?.length) {
        for (const f of data.features) {
            stats.checked++;
            const id = f.id as string;

            const existing = await db.select().from(schema.features).all();
            const found = existing.some(e => e.id === id);

            if (!found) {
                await db.insert(schema.features).values({
                    id,
                    name: f.name as string,
                    description: f.description as string | undefined,
                    objectiveId: f.objective_id as string | undefined,
                    status: f.status as "planned" | "in_progress" | "complete" | "cancelled" | undefined,
                });
                await logAction("createFeature", "feature", id, "create");
                stats.inserted++;
                console.log(`  ✅ Created feature: ${f.name}`);
            } else {
                stats.skipped++;
            }
        }
    }

    // Sync Rules
    if (data.rules?.length) {
        for (const r of data.rules) {
            stats.checked++;
            const id = r.id as string;

            const existing = await db.select().from(schema.rules).all();
            const found = existing.some(e => e.id === id);

            if (!found) {
                await db.insert(schema.rules).values({
                    id,
                    featureId: r.feature_id as string,
                    role: r.role as string,
                    requirement: r.requirement as string,
                    reason: r.reason as string,
                    status: r.status as "draft" | "active" | "deprecated" | undefined,
                });
                await logAction("createRule", "rule", id, "create");
                stats.inserted++;
                console.log(`  ✅ Created rule: ${r.role}`);
            } else {
                stats.skipped++;
            }
        }
    }

    // Sync Scenarios
    if (data.scenarios?.length) {
        for (const s of data.scenarios) {
            stats.checked++;
            const id = s.id as string;

            const existing = await db.select().from(schema.scenarios).all();
            const found = existing.some(e => e.id === id);

            if (!found) {
                await db.insert(schema.scenarios).values({
                    id,
                    ruleId: s.rule_id as string,
                    name: s.name as string,
                    narrative: s.narrative as string,
                    status: s.status as "draft" | "active" | "deprecated" | undefined,
                });
                await logAction("createScenario", "scenario", id, "create");
                stats.inserted++;
                console.log(`  ✅ Created scenario: ${s.name}`);
            } else {
                stats.skipped++;
            }
        }
    }

    // Sync Specifications
    if (data.specifications?.length) {
        for (const s of data.specifications) {
            stats.checked++;
            const id = s.id as string;

            const existing = await db.select().from(schema.specifications).all();
            const found = existing.some(e => e.id === id);

            if (!found) {
                await db.insert(schema.specifications).values({
                    id,
                    featureId: s.feature_id as string,
                    name: s.name as string,
                    narrative: s.narrative as string,
                    category: s.category as "performance" | "security" | "usability" | "reliability" | "accessibility" | "maintainability",
                    status: s.status as "draft" | "active" | "deprecated" | undefined,
                });
                await logAction("createSpecification", "specification", id, "create");
                stats.inserted++;
                console.log(`  ✅ Created specification: ${s.name}`);
            } else {
                stats.skipped++;
            }
        }
    }

    // Sync Metrics
    if (data.metrics?.length) {
        for (const m of data.metrics) {
            stats.checked++;
            const id = m.id as string;

            const existing = await db.select().from(schema.metrics).all();
            const found = existing.some(e => e.id === id);

            if (!found) {
                await db.insert(schema.metrics).values({
                    id,
                    name: m.name as string,
                    description: m.description as string | undefined,
                    unit: m.unit as string,
                    currentValue: m.current_value as number | undefined,
                    source: m.source as string | undefined,
                });
                await logAction("createMetric", "metric", id, "create");
                stats.inserted++;
                console.log(`  ✅ Created metric: ${m.name}`);
            } else {
                stats.skipped++;
            }
        }
    }

    // Sync KPIs
    if (data.kpis?.length) {
        for (const k of data.kpis) {
            stats.checked++;
            const id = k.id as string;

            const existing = await db.select().from(schema.kpis).all();
            const found = existing.some(e => e.id === id);

            if (!found) {
                await db.insert(schema.kpis).values({
                    id,
                    metricId: k.metric_id as string,
                    objectiveId: k.objective_id as string | undefined,
                    targetValue: k.target_value as number,
                    direction: k.direction as "increase" | "decrease" | "maintain",
                    thresholdWarning: k.threshold_warning as number | undefined,
                    thresholdCritical: k.threshold_critical as number | undefined,
                });
                await logAction("createKPI", "kpi", id, "create");
                stats.inserted++;
                console.log(`  ✅ Created KPI: ${id}`);
            } else {
                stats.skipped++;
            }
        }
    }

    // Sync Initiatives
    if (data.initiatives?.length) {
        for (const i of data.initiatives) {
            stats.checked++;
            const id = i.id as string;

            const existing = await db.select().from(schema.initiatives).all();
            const found = existing.some(e => e.id === id);

            if (!found) {
                await db.insert(schema.initiatives).values({
                    id,
                    name: i.name as string,
                    description: i.description as string | undefined,
                    kpiId: i.kpi_id as string | undefined,
                    status: i.status as "planned" | "active" | "complete" | "cancelled" | undefined,
                    startDate: i.start_date as string | undefined,
                    endDate: i.end_date as string | undefined,
                });
                await logAction("createInitiative", "initiative", id, "create");
                stats.inserted++;
                console.log(`  ✅ Created initiative: ${i.name}`);
            } else {
                stats.skipped++;
            }
        }
    }

    // Sync Activities
    if (data.activities?.length) {
        for (const a of data.activities) {
            stats.checked++;
            const id = a.id as string;

            const existing = await db.select().from(schema.activities).all();
            const found = existing.some(e => e.id === id);

            if (!found) {
                await db.insert(schema.activities).values({
                    id,
                    name: a.name as string,
                    description: a.description as string | undefined,
                    parentId: a.parent_id as string | undefined,
                    initiativeId: a.initiative_id as string | undefined,
                    blockedBy: a.blocked_by ? JSON.stringify(a.blocked_by) : undefined,
                    status: a.status as "backlog" | "ready" | "in_progress" | "blocked" | "complete" | undefined,
                });
                await logAction("createActivity", "activity", id, "create");
                stats.inserted++;
                console.log(`  ✅ Created activity: ${a.name}`);
            } else {
                stats.skipped++;
            }
        }
    }

    // Sync Roles
    if (data.roles?.length) {
        for (const r of data.roles) {
            stats.checked++;
            const id = r.id as string;

            const existing = await db.select().from(schema.roles).all();
            const found = existing.some(e => e.id === id);

            if (!found) {
                await db.insert(schema.roles).values({
                    id,
                    name: r.name as string,
                    description: r.description as string | undefined,
                });
                await logAction("createRole", "role", id, "create");
                stats.inserted++;
                console.log(`  ✅ Created role: ${r.name}`);
            } else {
                stats.skipped++;
            }
        }
    }

    // Sync Assignments
    if (data.assignments?.length) {
        for (const a of data.assignments) {
            stats.checked++;
            const id = a.id as string;

            const existing = await db.select().from(schema.assignments).all();
            const found = existing.some(e => e.id === id);

            if (!found) {
                await db.insert(schema.assignments).values({
                    id,
                    activityId: a.activity_id as string,
                    roleId: a.role_id as string,
                    quantity: a.quantity as number,
                    unit: a.unit as string | undefined,
                    raciType: a.raci_type as "responsible" | "accountable" | "consulted" | "informed" | undefined,
                });
                await logAction("createAssignment", "assignment", id, "create");
                stats.inserted++;
                console.log(`  ✅ Created assignment: ${id}`);
            } else {
                stats.skipped++;
            }
        }
    }

    // Sync Allocations
    if (data.allocations?.length) {
        for (const a of data.allocations) {
            stats.checked++;
            const id = a.id as string;

            const existing = await db.select().from(schema.allocations).all();
            const found = existing.some(e => e.id === id);

            if (!found) {
                await db.insert(schema.allocations).values({
                    id,
                    assignmentId: a.assignment_id as string,
                    personId: a.person_id as string,
                    quantityContributed: a.quantity_contributed as number,
                    startDate: a.start_date as string | undefined,
                    endDate: a.end_date as string | undefined,
                });
                await logAction("createAllocation", "allocation", id, "create");
                stats.inserted++;
                console.log(`  ✅ Created allocation: ${id}`);
            } else {
                stats.skipped++;
            }
        }
    }

    return stats;
}

// Watch mode for hot reload
async function watchMode() {
    console.log("👀 Watching TOML file for changes...\n");

    // Initial sync
    const initialStats = await sync();
    console.log(`\n📊 Initial sync: ${initialStats.inserted} inserted, ${initialStats.skipped} skipped\n`);

    const tomlPath = getTomlPath();

    // Watch for changes
    let debounceTimer: Timer | null = null;

    watch(tomlPath, async (eventType: string) => {
        if (eventType === "change") {
            // Debounce rapid changes
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(async () => {
                console.log("\n🔄 TOML file changed, syncing...");
                try {
                    const stats = await sync();
                    console.log(`📊 Sync complete: ${stats.inserted} inserted, ${stats.skipped} skipped\n`);
                } catch (error) {
                    console.error("❌ Sync failed:", error);
                }
            }, 500);
        }
    });

    console.log("Press Ctrl+C to stop watching.\n");
}

// Main entry point
const args = process.argv.slice(2);
const isWatch = args.includes("--watch") || args.includes("-w");

if (isWatch) {
    watchMode().catch(console.error);
} else {
    sync()
        .then((stats) => {
            console.log(`\n✅ Sync complete!`);
            console.log(`   Checked: ${stats.checked}`);
            console.log(`   Inserted: ${stats.inserted}`);
            console.log(`   Skipped: ${stats.skipped}`);
        })
        .catch((err) => {
            console.error("❌ Sync failed:", err);
            process.exit(1);
        });
}
