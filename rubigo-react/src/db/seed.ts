/**
 * Database Seed Script
 * 
 * Imports seed data from TOML files into the SQLite database.
 * Run with: bun run db:seed
 */

import { db } from "./index";
import * as schema from "./schema";
import { parse } from "@iarna/toml";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// TOML file location (symlinked from common/scenarios/mmc)
const TOML_PATH = join(process.cwd(), "src/data/projects.toml");

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

async function seed() {
    console.log("🌱 Starting database seed...");

    // Check if TOML file exists
    if (!existsSync(TOML_PATH)) {
        console.error(`❌ TOML file not found at: ${TOML_PATH}`);
        process.exit(1);
    }

    // Parse TOML
    const content = readFileSync(TOML_PATH, "utf-8");
    const data = parse(content) as RawTomlData;

    console.log("📖 Parsed TOML data");

    // Clear existing data (in reverse dependency order)
    console.log("🗑️  Clearing existing data...");
    await db.delete(schema.actionLogs);
    await db.delete(schema.evaluations);
    await db.delete(schema.evidences);
    await db.delete(schema.allocations);
    await db.delete(schema.assignments);
    await db.delete(schema.activities);
    await db.delete(schema.initiatives);
    await db.delete(schema.kpis);
    await db.delete(schema.scenarios);
    await db.delete(schema.specifications);
    await db.delete(schema.rules);
    await db.delete(schema.features);
    await db.delete(schema.objectives);
    await db.delete(schema.metrics);
    await db.delete(schema.roles);
    await db.delete(schema.projects);
    await db.delete(schema.releases);
    await db.delete(schema.products);
    await db.delete(schema.services);
    await db.delete(schema.solutions);

    // Import Solutions
    if (data.solutions?.length) {
        console.log(`📦 Importing ${data.solutions.length} solutions...`);
        for (const s of data.solutions) {
            await db.insert(schema.solutions).values({
                id: s.id as string,
                name: s.name as string,
                description: s.description as string | undefined,
                status: s.status as "pipeline" | "catalog" | "retired" | undefined,
            });
        }
    }

    // Import Products
    if (data.products?.length) {
        console.log(`📍 Importing ${data.products.length} products...`);
        for (const p of data.products) {
            await db.insert(schema.products).values({
                id: p.id as string,
                solutionId: p.solution_id as string,
                version: p.version as string | undefined,
                releaseDate: p.release_date as string | undefined,
            });
        }
    }

    // Import Services
    if (data.services?.length) {
        console.log(`🔧 Importing ${data.services.length} services...`);
        for (const s of data.services) {
            await db.insert(schema.services).values({
                id: s.id as string,
                solutionId: s.solution_id as string,
                serviceLevel: s.service_level as string | undefined,
            });
        }
    }

    // Import Projects
    if (data.projects?.length) {
        console.log(`📁 Importing ${data.projects.length} projects...`);
        for (const p of data.projects) {
            await db.insert(schema.projects).values({
                id: p.id as string,
                name: p.name as string,
                description: p.description as string | undefined,
                solutionId: p.solution_id as string | undefined,
                status: p.status as "planning" | "active" | "on_hold" | "complete" | "cancelled" | undefined,
                startDate: p.start_date as string | undefined,
                endDate: p.end_date as string | undefined,
            });
        }
    }

    // Import Objectives
    if (data.objectives?.length) {
        console.log(`🎯 Importing ${data.objectives.length} objectives...`);
        for (const o of data.objectives) {
            await db.insert(schema.objectives).values({
                id: o.id as string,
                title: o.title as string,
                description: o.description as string | undefined,
                projectId: o.project_id as string | undefined,
                parentId: o.parent_id as string | undefined,
                status: o.status as "draft" | "active" | "achieved" | "deferred" | undefined,
            });
        }
    }

    // Import Features
    if (data.features?.length) {
        console.log(`⚡ Importing ${data.features.length} features...`);
        for (const f of data.features) {
            await db.insert(schema.features).values({
                id: f.id as string,
                name: f.name as string,
                description: f.description as string | undefined,
                objectiveId: f.objective_id as string | undefined,
                status: f.status as "planned" | "in_progress" | "complete" | "cancelled" | undefined,
            });
        }
    }

    // Import Rules
    if (data.rules?.length) {
        console.log(`📜 Importing ${data.rules.length} rules...`);
        for (const r of data.rules) {
            await db.insert(schema.rules).values({
                id: r.id as string,
                featureId: r.feature_id as string,
                role: r.role as string,
                requirement: r.requirement as string,
                reason: r.reason as string,
                status: r.status as "draft" | "active" | "deprecated" | undefined,
            });
        }
    }

    // Import Scenarios
    if (data.scenarios?.length) {
        console.log(`🎬 Importing ${data.scenarios.length} scenarios...`);
        for (const s of data.scenarios) {
            await db.insert(schema.scenarios).values({
                id: s.id as string,
                ruleId: s.rule_id as string,
                name: s.name as string,
                narrative: s.narrative as string,
                status: s.status as "draft" | "active" | "deprecated" | undefined,
            });
        }
    }

    // Import Specifications
    if (data.specifications?.length) {
        console.log(`📋 Importing ${data.specifications.length} specifications...`);
        for (const s of data.specifications) {
            await db.insert(schema.specifications).values({
                id: s.id as string,
                featureId: s.feature_id as string,
                name: s.name as string,
                narrative: s.narrative as string,
                category: s.category as "performance" | "security" | "usability" | "reliability" | "accessibility" | "maintainability",
                status: s.status as "draft" | "active" | "deprecated" | undefined,
            });
        }
    }

    // Import Metrics
    if (data.metrics?.length) {
        console.log(`📊 Importing ${data.metrics.length} metrics...`);
        for (const m of data.metrics) {
            await db.insert(schema.metrics).values({
                id: m.id as string,
                name: m.name as string,
                description: m.description as string | undefined,
                unit: m.unit as string,
                currentValue: m.current_value as number | undefined,
                source: m.source as string | undefined,
            });
        }
    }

    // Import KPIs
    if (data.kpis?.length) {
        console.log(`📈 Importing ${data.kpis.length} KPIs...`);
        for (const k of data.kpis) {
            await db.insert(schema.kpis).values({
                id: k.id as string,
                metricId: k.metric_id as string,
                objectiveId: k.objective_id as string | undefined,
                targetValue: k.target_value as number,
                direction: k.direction as "increase" | "decrease" | "maintain",
                thresholdWarning: k.threshold_warning as number | undefined,
                thresholdCritical: k.threshold_critical as number | undefined,
            });
        }
    }

    // Import Initiatives
    if (data.initiatives?.length) {
        console.log(`🚀 Importing ${data.initiatives.length} initiatives...`);
        for (const i of data.initiatives) {
            await db.insert(schema.initiatives).values({
                id: i.id as string,
                name: i.name as string,
                description: i.description as string | undefined,
                kpiId: i.kpi_id as string | undefined,
                status: i.status as "planned" | "active" | "complete" | "cancelled" | undefined,
                startDate: i.start_date as string | undefined,
                endDate: i.end_date as string | undefined,
            });
        }
    }

    // Import Activities
    if (data.activities?.length) {
        console.log(`📋 Importing ${data.activities.length} activities...`);
        for (const a of data.activities) {
            await db.insert(schema.activities).values({
                id: a.id as string,
                name: a.name as string,
                description: a.description as string | undefined,
                parentId: a.parent_id as string | undefined,
                initiativeId: a.initiative_id as string | undefined,
                blockedBy: a.blocked_by ? JSON.stringify(a.blocked_by) : undefined,
                status: a.status as "backlog" | "ready" | "in_progress" | "blocked" | "complete" | undefined,
            });
        }
    }

    // Import Roles
    if (data.roles?.length) {
        console.log(`👤 Importing ${data.roles.length} roles...`);
        for (const r of data.roles) {
            await db.insert(schema.roles).values({
                id: r.id as string,
                name: r.name as string,
                description: r.description as string | undefined,
            });
        }
    }

    // Import Assignments
    if (data.assignments?.length) {
        console.log(`📌 Importing ${data.assignments.length} assignments...`);
        for (const a of data.assignments) {
            await db.insert(schema.assignments).values({
                id: a.id as string,
                activityId: a.activity_id as string,
                roleId: a.role_id as string,
                quantity: a.quantity as number,
                unit: a.unit as string | undefined,
                raciType: a.raci_type as "responsible" | "accountable" | "consulted" | "informed" | undefined,
            });
        }
    }

    // Import Allocations
    if (data.allocations?.length) {
        console.log(`⏰ Importing ${data.allocations.length} allocations...`);
        for (const a of data.allocations) {
            await db.insert(schema.allocations).values({
                id: a.id as string,
                assignmentId: a.assignment_id as string,
                personId: a.person_id as string,
                quantityContributed: a.quantity_contributed as number,
                startDate: a.start_date as string | undefined,
                endDate: a.end_date as string | undefined,
            });
        }
    }

    console.log("\n✅ Database seeded successfully!");

    // Print summary
    const counts = {
        solutions: await db.select().from(schema.solutions).then(r => r.length),
        projects: await db.select().from(schema.projects).then(r => r.length),
        objectives: await db.select().from(schema.objectives).then(r => r.length),
    };
    console.log(`   Solutions: ${counts.solutions}`);
    console.log(`   Projects: ${counts.projects}`);
    console.log(`   Objectives: ${counts.objectives}`);
}

seed().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
