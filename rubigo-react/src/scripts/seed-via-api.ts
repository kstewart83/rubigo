#!/usr/bin/env bun
/**
 * Seed Via API Script
 * 
 * Reads TOML seed data and creates records via the Rubigo API.
 * This ensures all data loading goes through the same APIs the UI uses.
 * 
 * Usage:
 *   RUBIGO_SEED_DIR=../common/scenarios/mmc RUBIGO_API_TOKEN=xxx bun src/scripts/seed-via-api.ts
 */

import { parse } from "@iarna/toml";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { RubigoClient, type PersonnelInput } from "../lib/rubigo-client";

// ============================================================================
// Configuration
// ============================================================================

const SEED_DIR = process.env.RUBIGO_SEED_DIR;
const API_URL = process.env.RUBIGO_API_URL || "http://localhost:3000";
const API_TOKEN = process.env.RUBIGO_API_TOKEN;

if (!SEED_DIR) {
    console.error("❌ RUBIGO_SEED_DIR environment variable is required");
    process.exit(1);
}

if (!API_TOKEN) {
    console.error("❌ RUBIGO_API_TOKEN environment variable is required");
    console.error("   Start the server first and note the API token.");
    process.exit(1);
}

// ============================================================================
// TOML Parsing Types
// ============================================================================

interface RawPerson {
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

interface PersonnelToml {
    description?: { overview?: string };
    people: RawPerson[];
}

// ============================================================================
// Photo Upload Helper
// ============================================================================

/**
 * Upload a photo file to the database via the API
 * @param photoPath - Relative path from SEED_DIR (e.g., "headshots/photo.png")
 * @param personId - Optional ID to use for the photo
 * @returns The API path to serve the photo, or undefined if upload failed
 */
async function uploadPhotoToDb(photoPath: string, personId?: string): Promise<string | undefined> {
    const fullPath = join(SEED_DIR!, photoPath);

    if (!existsSync(fullPath)) {
        console.log(`   ⚠️  Photo not found: ${photoPath}`);
        return undefined;
    }

    try {
        // Read file as buffer
        const fileBuffer = readFileSync(fullPath);

        // Determine mime type from extension
        const ext = photoPath.split(".").pop()?.toLowerCase();
        const mimeTypes: Record<string, string> = {
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "png": "image/png",
            "webp": "image/webp",
            "gif": "image/gif",
        };
        const mimeType = mimeTypes[ext || ""] || "image/jpeg";

        // Create a File-like object for FormData
        const blob = new Blob([fileBuffer], { type: mimeType });
        const formData = new FormData();
        formData.append("file", blob, photoPath.split("/").pop() || "photo.jpg");
        if (personId) {
            formData.append("id", personId);
        }

        // Upload via API
        const response = await fetch(`${API_URL}/api/photos`, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            console.log(`   ⚠️  Photo upload failed: ${error.error || "Unknown error"}`);
            return undefined;
        }

        const result = await response.json();
        return result.path; // Returns "/api/photos/[id]"
    } catch (error) {
        console.log(`   ⚠️  Photo upload error: ${error}`);
        return undefined;
    }
}

// ============================================================================
// Main Seeding Function
// ============================================================================

async function seedPersonnel(client: RubigoClient): Promise<{ created: number; failed: number }> {
    const tomlPath = join(SEED_DIR!, "personnel.toml");

    if (!existsSync(tomlPath)) {
        console.log("⚠️  No personnel.toml found, skipping personnel");
        return { created: 0, failed: 0 };
    }

    console.log("📄 Loading personnel.toml...");
    const content = readFileSync(tomlPath, "utf-8");
    const data = parse(content) as unknown as PersonnelToml;

    if (!data.people?.length) {
        console.log("   No personnel records found");
        return { created: 0, failed: 0 };
    }

    console.log(`   Found ${data.people.length} personnel records`);

    let created = 0;
    let failed = 0;

    for (const person of data.people) {
        try {
            // Upload photo to database if present
            let photoPath: string | undefined;
            if (person.photo) {
                photoPath = await uploadPhotoToDb(person.photo, person.id);
            }

            const input: PersonnelInput = {
                name: person.name,
                email: person.email,
                title: person.title,
                department: person.department,
                site: person.site,
                building: person.building,
                level: person.level,
                space: person.space,
                manager: person.manager,
                photo: photoPath,
                deskPhone: person.desk_phone,
                cellPhone: person.cell_phone,
                bio: person.bio,
            };

            const result = await client.createPersonnel(input);

            if (result.success) {
                created++;
                console.log(`   ✅ Created: ${person.name}${photoPath ? " (with photo)" : ""}`);
            } else if (result.error?.includes("Email already exists")) {
                console.log(`   ⏭️  Skipped: ${person.name} (already exists)`);
            } else {
                failed++;
                console.log(`   ❌ Failed: ${person.name} - ${result.error}`);
            }
        } catch (error) {
            failed++;
            console.error(`   ❌ Error: ${person.name} -`, error);
        }
    }

    return { created, failed };
}

// ============================================================================
// Solution Space Seeding
// ============================================================================

interface RawSolution {
    id: string;
    name: string;
    description?: string;
    status?: string;
}

interface RawProduct {
    id: string;
    solution_id: string;
    version?: string;
}

interface RawService {
    id: string;
    name?: string;
    solution_id: string;
    service_level?: string;
}

interface ProjectsToml {
    description?: { overview?: string };
    solutions?: RawSolution[];
    products?: RawProduct[];
    services?: RawService[];
}

async function seedSolutionSpace(client: RubigoClient): Promise<{
    solutions: { created: number; failed: number };
    products: { created: number; failed: number };
    services: { created: number; failed: number };
}> {
    const tomlPath = join(SEED_DIR!, "projects.toml");

    if (!existsSync(tomlPath)) {
        console.log("⚠️  No projects.toml found, skipping solution space");
        return {
            solutions: { created: 0, failed: 0 },
            products: { created: 0, failed: 0 },
            services: { created: 0, failed: 0 },
        };
    }

    console.log("📄 Loading projects.toml...");
    const content = readFileSync(tomlPath, "utf-8");
    const data = parse(content) as unknown as ProjectsToml;

    const stats = {
        solutions: { created: 0, failed: 0 },
        products: { created: 0, failed: 0 },
        services: { created: 0, failed: 0 },
    };

    // Seed Solutions first (no dependencies)
    if (data.solutions?.length) {
        console.log(`\n   Found ${data.solutions.length} solutions`);
        for (const s of data.solutions) {
            try {
                const result = await client.createSolution({
                    id: s.id,
                    name: s.name,
                    description: s.description,
                    status: s.status as "pipeline" | "catalog" | "retired" | undefined,
                });
                if (result.success) {
                    stats.solutions.created++;
                    console.log(`   ✅ Solution: ${s.name}`);
                } else if (result.error?.includes("UNIQUE constraint")) {
                    console.log(`   ⏭️  Skipped: ${s.name} (exists)`);
                } else {
                    stats.solutions.failed++;
                    console.log(`   ❌ Failed: ${s.name} - ${result.error}`);
                }
            } catch (error) {
                stats.solutions.failed++;
                console.error(`   ❌ Error: ${s.name}`, error);
            }
        }
    }

    // Seed Products (depend on Solutions)
    if (data.products?.length) {
        console.log(`\n   Found ${data.products.length} products`);
        for (const p of data.products) {
            try {
                const result = await client.createProduct({
                    id: p.id,
                    solution_id: p.solution_id,
                    version: p.version,
                });
                if (result.success) {
                    stats.products.created++;
                    console.log(`   ✅ Product: ${p.id}`);
                } else if (result.error?.includes("UNIQUE constraint")) {
                    console.log(`   ⏭️  Skipped: ${p.id} (exists)`);
                } else {
                    stats.products.failed++;
                    console.log(`   ❌ Failed: ${p.id} - ${result.error}`);
                }
            } catch (error) {
                stats.products.failed++;
                console.error(`   ❌ Error: ${p.id}`, error);
            }
        }
    }

    // Seed Services (depend on Solutions)
    if (data.services?.length) {
        console.log(`\n   Found ${data.services.length} services`);
        for (const s of data.services) {
            try {
                const result = await client.createService({
                    id: s.id,
                    name: s.name || s.id,
                    solution_id: s.solution_id,
                    service_level: s.service_level,
                });
                if (result.success) {
                    stats.services.created++;
                    console.log(`   ✅ Service: ${s.id}`);
                } else if (result.error?.includes("UNIQUE constraint")) {
                    console.log(`   ⏭️  Skipped: ${s.id} (exists)`);
                } else {
                    stats.services.failed++;
                    console.log(`   ❌ Failed: ${s.id} - ${result.error}`);
                }
            } catch (error) {
                stats.services.failed++;
                console.error(`   ❌ Error: ${s.id}`, error);
            }
        }
    }

    return stats;
}

// ============================================================================
// Strategy Space Seeding
// ============================================================================

interface RawProject {
    id: string;
    name: string;
    description?: string;
    solution_id?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
}

interface RawObjective {
    id: string;
    title: string;
    description?: string;
    project_id?: string;
    parent_id?: string;
    status?: string;
}

interface RawMetric {
    id: string;
    name: string;
    description?: string;
    unit: string;
    current_value?: number;
    source?: string;
}

interface RawKpi {
    id: string;
    metric_id: string;
    objective_id?: string;
    target_value: number;
    direction: "increase" | "decrease" | "maintain";
    threshold_warning?: number;
    threshold_critical?: number;
}

interface StrategyToml {
    projects?: RawProject[];
    objectives?: RawObjective[];
    metrics?: RawMetric[];
    kpis?: RawKpi[];
}

async function seedStrategySpace(client: RubigoClient): Promise<{
    projects: { created: number; failed: number };
    objectives: { created: number; failed: number };
    metrics: { created: number; failed: number };
    kpis: { created: number; failed: number };
}> {
    const tomlPath = join(SEED_DIR!, "projects.toml");

    if (!existsSync(tomlPath)) {
        console.log("⚠️  No projects.toml found, skipping strategy space");
        return {
            projects: { created: 0, failed: 0 },
            objectives: { created: 0, failed: 0 },
            metrics: { created: 0, failed: 0 },
            kpis: { created: 0, failed: 0 },
        };
    }

    const content = readFileSync(tomlPath, "utf-8");
    const data = parse(content) as unknown as StrategyToml;

    const stats = {
        projects: { created: 0, failed: 0 },
        objectives: { created: 0, failed: 0 },
        metrics: { created: 0, failed: 0 },
        kpis: { created: 0, failed: 0 },
    };

    // Seed Projects
    if (data.projects?.length) {
        console.log(`\n   Found ${data.projects.length} projects`);
        for (const p of data.projects) {
            try {
                const result = await client.createProject({
                    id: p.id,
                    name: p.name,
                    description: p.description,
                    solution_id: p.solution_id,
                    status: p.status as "planning" | "active" | "on_hold" | "complete" | "cancelled" | undefined,
                    start_date: p.start_date,
                    end_date: p.end_date,
                });
                if (result.success) {
                    stats.projects.created++;
                    console.log(`   ✅ Project: ${p.name}`);
                } else if (result.error?.includes("UNIQUE constraint")) {
                    console.log(`   ⏭️  Skipped: ${p.name} (exists)`);
                } else {
                    stats.projects.failed++;
                    console.log(`   ❌ Failed: ${p.name} - ${result.error}`);
                }
            } catch (error) {
                stats.projects.failed++;
                console.error(`   ❌ Error: ${p.name}`, error);
            }
        }
    }

    // Seed Objectives
    if (data.objectives?.length) {
        console.log(`\n   Found ${data.objectives.length} objectives`);
        for (const o of data.objectives) {
            try {
                const result = await client.createObjective({
                    id: o.id,
                    title: o.title,
                    description: o.description,
                    project_id: o.project_id,
                    parent_id: o.parent_id,
                    status: o.status as "draft" | "active" | "achieved" | "deferred" | undefined,
                });
                if (result.success) {
                    stats.objectives.created++;
                    console.log(`   ✅ Objective: ${o.title}`);
                } else if (result.error?.includes("UNIQUE constraint")) {
                    console.log(`   ⏭️  Skipped: ${o.title} (exists)`);
                } else {
                    stats.objectives.failed++;
                    console.log(`   ❌ Failed: ${o.title} - ${result.error}`);
                }
            } catch (error) {
                stats.objectives.failed++;
                console.error(`   ❌ Error: ${o.title}`, error);
            }
        }
    }

    // Seed Metrics
    if (data.metrics?.length) {
        console.log(`\n   Found ${data.metrics.length} metrics`);
        for (const m of data.metrics) {
            try {
                const result = await client.createMetric({
                    id: m.id,
                    name: m.name,
                    description: m.description,
                    unit: m.unit,
                    current_value: m.current_value,
                });
                if (result.success) {
                    stats.metrics.created++;
                    console.log(`   ✅ Metric: ${m.name}`);
                } else if (result.error?.includes("UNIQUE constraint")) {
                    console.log(`   ⏭️  Skipped: ${m.name} (exists)`);
                } else {
                    stats.metrics.failed++;
                    console.log(`   ❌ Failed: ${m.name} - ${result.error}`);
                }
            } catch (error) {
                stats.metrics.failed++;
                console.error(`   ❌ Error: ${m.name}`, error);
            }
        }
    }

    // Seed KPIs (after Metrics and Objectives)
    if (data.kpis?.length) {
        console.log(`\n   Found ${data.kpis.length} KPIs`);
        for (const k of data.kpis) {
            try {
                const result = await client.createKpi({
                    id: k.id,
                    metric_id: k.metric_id,
                    objective_id: k.objective_id,
                    target_value: k.target_value,
                    direction: k.direction,
                    threshold_warning: k.threshold_warning,
                    threshold_critical: k.threshold_critical,
                });
                if (result.success) {
                    stats.kpis.created++;
                    console.log(`   ✅ KPI: ${k.id}`);
                } else if (result.error?.includes("UNIQUE constraint")) {
                    console.log(`   ⏭️  Skipped: ${k.id} (exists)`);
                } else {
                    stats.kpis.failed++;
                    console.log(`   ❌ Failed: ${k.id} - ${result.error}`);
                }
            } catch (error) {
                stats.kpis.failed++;
                console.error(`   ❌ Error: ${k.id}`, error);
            }
        }
    }

    return stats;
}

// ============================================================================
// Requirements Space Seeding
// ============================================================================

interface RawFeature {
    id: string;
    name: string;
    description?: string;
    objective_id?: string;
    status?: string;
}

interface RawRule {
    id: string;
    feature_id: string;
    role: string;
    requirement: string;
    reason: string;
    status?: string;
}

interface RawSpecification {
    id: string;
    feature_id: string;
    name: string;
    narrative: string;
    category: string;
    status?: string;
}

interface RawScenario {
    id: string;
    rule_id: string;
    name: string;
    narrative: string;
    status?: string;
}

interface RequirementsToml {
    features?: RawFeature[];
    rules?: RawRule[];
    specifications?: RawSpecification[];
    scenarios?: RawScenario[];
}

async function seedRequirementsSpace(client: RubigoClient): Promise<{
    features: { created: number; failed: number };
    rules: { created: number; failed: number };
    specifications: { created: number; failed: number };
    scenarios: { created: number; failed: number };
}> {
    const tomlPath = join(SEED_DIR!, "projects.toml");

    if (!existsSync(tomlPath)) {
        console.log("⚠️  No projects.toml found, skipping requirements space");
        return {
            features: { created: 0, failed: 0 },
            rules: { created: 0, failed: 0 },
            specifications: { created: 0, failed: 0 },
            scenarios: { created: 0, failed: 0 },
        };
    }

    const content = readFileSync(tomlPath, "utf-8");
    const data = parse(content) as unknown as RequirementsToml;

    const stats = {
        features: { created: 0, failed: 0 },
        rules: { created: 0, failed: 0 },
        specifications: { created: 0, failed: 0 },
        scenarios: { created: 0, failed: 0 },
    };

    // Seed Features first (depends on Objectives)
    if (data.features?.length) {
        console.log(`\n   Found ${data.features.length} features`);
        for (const f of data.features) {
            try {
                const result = await client.createFeature({
                    id: f.id,
                    name: f.name,
                    description: f.description,
                    objective_id: f.objective_id,
                    status: f.status as "planned" | "in_progress" | "complete" | "cancelled" | undefined,
                });
                if (result.success) {
                    stats.features.created++;
                    console.log(`   ✅ Feature: ${f.name}`);
                } else if (result.error?.includes("UNIQUE constraint")) {
                    console.log(`   ⏭️  Skipped: ${f.name} (exists)`);
                } else {
                    stats.features.failed++;
                    console.log(`   ❌ Failed: ${f.name} - ${result.error}`);
                }
            } catch (error) {
                stats.features.failed++;
                console.error(`   ❌ Error: ${f.name}`, error);
            }
        }
    }

    // Seed Rules (depends on Features)
    if (data.rules?.length) {
        console.log(`\n   Found ${data.rules.length} rules`);
        for (const r of data.rules) {
            try {
                const result = await client.createRule({
                    id: r.id,
                    feature_id: r.feature_id,
                    role: r.role,
                    requirement: r.requirement,
                    reason: r.reason,
                    status: r.status as "draft" | "active" | "deprecated" | undefined,
                });
                if (result.success) {
                    stats.rules.created++;
                    console.log(`   ✅ Rule: ${r.id}`);
                } else if (result.error?.includes("UNIQUE constraint")) {
                    console.log(`   ⏭️  Skipped: ${r.id} (exists)`);
                } else {
                    stats.rules.failed++;
                    console.log(`   ❌ Failed: ${r.id} - ${result.error}`);
                }
            } catch (error) {
                stats.rules.failed++;
                console.error(`   ❌ Error: ${r.id}`, error);
            }
        }
    }

    // Seed Specifications (depends on Features)
    if (data.specifications?.length) {
        console.log(`\n   Found ${data.specifications.length} specifications`);
        for (const s of data.specifications) {
            try {
                const result = await client.createSpecification({
                    id: s.id,
                    feature_id: s.feature_id,
                    name: s.name,
                    narrative: s.narrative,
                    category: s.category as "performance" | "security" | "usability" | "reliability" | "accessibility" | "maintainability",
                    status: s.status as "draft" | "active" | "deprecated" | undefined,
                });
                if (result.success) {
                    stats.specifications.created++;
                    console.log(`   ✅ Specification: ${s.name}`);
                } else if (result.error?.includes("UNIQUE constraint")) {
                    console.log(`   ⏭️  Skipped: ${s.name} (exists)`);
                } else {
                    stats.specifications.failed++;
                    console.log(`   ❌ Failed: ${s.name} - ${result.error}`);
                }
            } catch (error) {
                stats.specifications.failed++;
                console.error(`   ❌ Error: ${s.name}`, error);
            }
        }
    }

    // Seed Scenarios (depends on Rules)
    if (data.scenarios?.length) {
        console.log(`\n   Found ${data.scenarios.length} scenarios`);
        for (const s of data.scenarios) {
            try {
                const result = await client.createScenario({
                    id: s.id,
                    rule_id: s.rule_id,
                    name: s.name,
                    narrative: s.narrative,
                    status: s.status as "draft" | "active" | "deprecated" | undefined,
                });
                if (result.success) {
                    stats.scenarios.created++;
                    console.log(`   ✅ Scenario: ${s.name}`);
                } else if (result.error?.includes("UNIQUE constraint")) {
                    console.log(`   ⏭️  Skipped: ${s.name} (exists)`);
                } else {
                    stats.scenarios.failed++;
                    console.log(`   ❌ Failed: ${s.name} - ${result.error}`);
                }
            } catch (error) {
                stats.scenarios.failed++;
                console.error(`   ❌ Error: ${s.name}`, error);
            }
        }
    }

    return stats;
}

// ============================================================================
// Entry Point
// ============================================================================

async function main() {
    console.log("\n🌱 Rubigo Seed via API\n");
    console.log(`   API URL: ${API_URL}`);
    console.log(`   Seed Dir: ${SEED_DIR}\n`);

    const client = new RubigoClient({
        baseUrl: API_URL,
        apiToken: API_TOKEN!,
    });

    // Seed personnel
    const personnelStats = await seedPersonnel(client);

    // Seed solution space
    const solutionSpaceStats = await seedSolutionSpace(client);

    // Seed strategy space
    const strategyStats = await seedStrategySpace(client);

    // Seed requirements space
    const requirementsStats = await seedRequirementsSpace(client);

    // Seed execution space
    const executionStats = await seedExecutionSpace(client);

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 Seed Summary");
    console.log("=".repeat(50));
    console.log(`   Personnel: ${personnelStats.created} created, ${personnelStats.failed} failed`);
    console.log(`   Solutions: ${solutionSpaceStats.solutions.created} created, ${solutionSpaceStats.solutions.failed} failed`);
    console.log(`   Products: ${solutionSpaceStats.products.created} created, ${solutionSpaceStats.products.failed} failed`);
    console.log(`   Services: ${solutionSpaceStats.services.created} created, ${solutionSpaceStats.services.failed} failed`);
    console.log(`   Projects: ${strategyStats.projects.created} created, ${strategyStats.projects.failed} failed`);
    console.log(`   Objectives: ${strategyStats.objectives.created} created, ${strategyStats.objectives.failed} failed`);
    console.log(`   Metrics: ${strategyStats.metrics.created} created, ${strategyStats.metrics.failed} failed`);
    console.log(`   KPIs: ${strategyStats.kpis.created} created, ${strategyStats.kpis.failed} failed`);
    console.log(`   Features: ${requirementsStats.features.created} created, ${requirementsStats.features.failed} failed`);
    console.log(`   Rules: ${requirementsStats.rules.created} created, ${requirementsStats.rules.failed} failed`);
    console.log(`   Specifications: ${requirementsStats.specifications.created} created, ${requirementsStats.specifications.failed} failed`);
    console.log(`   Scenarios: ${requirementsStats.scenarios.created} created, ${requirementsStats.scenarios.failed} failed`);
    console.log(`   Initiatives: ${executionStats.initiatives.created} created, ${executionStats.initiatives.failed} failed`);
    console.log(`   Activities: ${executionStats.activities.created} created, ${executionStats.activities.failed} failed`);
    console.log(`   Roles: ${executionStats.roles.created} created, ${executionStats.roles.failed} failed`);
    console.log(`   Assignments: ${executionStats.assignments.created} created, ${executionStats.assignments.failed} failed`);
    console.log(`   Allocations: ${executionStats.allocations.created} created, ${executionStats.allocations.failed} failed`);

    // Calculate and display totals
    const totalCreated =
        personnelStats.created +
        solutionSpaceStats.solutions.created + solutionSpaceStats.products.created + solutionSpaceStats.services.created +
        strategyStats.projects.created + strategyStats.objectives.created + strategyStats.metrics.created + strategyStats.kpis.created +
        requirementsStats.features.created + requirementsStats.rules.created + requirementsStats.specifications.created + requirementsStats.scenarios.created +
        executionStats.initiatives.created + executionStats.activities.created + executionStats.roles.created + executionStats.assignments.created + executionStats.allocations.created;

    const totalFailed =
        personnelStats.failed +
        solutionSpaceStats.solutions.failed + solutionSpaceStats.products.failed + solutionSpaceStats.services.failed +
        strategyStats.projects.failed + strategyStats.objectives.failed + strategyStats.metrics.failed + strategyStats.kpis.failed +
        requirementsStats.features.failed + requirementsStats.rules.failed + requirementsStats.specifications.failed + requirementsStats.scenarios.failed +
        executionStats.initiatives.failed + executionStats.activities.failed + executionStats.roles.failed + executionStats.assignments.failed + executionStats.allocations.failed;

    console.log("-".repeat(50));
    console.log(`   📦 TOTAL: ${totalCreated} created, ${totalFailed} failed`);
    console.log("");
}

// ============================================================================
// Execution Space Seeding
// ============================================================================

interface RawInitiative {
    id: string;
    name: string;
    description?: string;
    kpi_id?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
}

interface RawActivity {
    id: string;
    name: string;
    description?: string;
    parent_id?: string;
    initiative_id?: string;
    blocked_by?: string;
    status?: string;
}

interface RawRole {
    id: string;
    name: string;
    description?: string;
}

interface RawAssignment {
    id: string;
    activity_id: string;
    role_id: string;
    quantity: number;
    unit?: string;
    raci_type?: string;
}

interface RawAllocation {
    id: string;
    assignment_id: string;
    person_id: string;
    quantity_contributed: number;
    start_date?: string;
    end_date?: string;
}

interface ExecutionToml {
    initiatives?: RawInitiative[];
    activities?: RawActivity[];
    roles?: RawRole[];
    assignments?: RawAssignment[];
    allocations?: RawAllocation[];
}

async function seedExecutionSpace(client: RubigoClient): Promise<{
    initiatives: { created: number; failed: number };
    activities: { created: number; failed: number };
    roles: { created: number; failed: number };
    assignments: { created: number; failed: number };
    allocations: { created: number; failed: number };
}> {
    const tomlPath = join(SEED_DIR!, "projects.toml");

    if (!existsSync(tomlPath)) {
        console.log("⚠️  No projects.toml found, skipping execution space");
        return {
            initiatives: { created: 0, failed: 0 },
            activities: { created: 0, failed: 0 },
            roles: { created: 0, failed: 0 },
            assignments: { created: 0, failed: 0 },
            allocations: { created: 0, failed: 0 },
        };
    }

    const content = readFileSync(tomlPath, "utf-8");
    const data = parse(content) as unknown as ExecutionToml;

    const stats = {
        initiatives: { created: 0, failed: 0 },
        activities: { created: 0, failed: 0 },
        roles: { created: 0, failed: 0 },
        assignments: { created: 0, failed: 0 },
        allocations: { created: 0, failed: 0 },
    };

    // Seed Initiatives first
    if (data.initiatives?.length) {
        console.log(`\n   Found ${data.initiatives.length} initiatives`);
        for (const i of data.initiatives) {
            try {
                const result = await client.createInitiative({
                    id: i.id,
                    name: i.name,
                    description: i.description,
                    kpi_id: i.kpi_id,
                    status: i.status as "planned" | "active" | "complete" | "cancelled" | undefined,
                    start_date: i.start_date,
                    end_date: i.end_date,
                });
                if (result.success) {
                    stats.initiatives.created++;
                    console.log(`   ✅ Initiative: ${i.name}`);
                } else if (result.error?.includes("UNIQUE constraint")) {
                    console.log(`   ⏭️  Skipped: ${i.name} (exists)`);
                } else {
                    stats.initiatives.failed++;
                    console.log(`   ❌ Failed: ${i.name} - ${result.error}`);
                }
            } catch (error) {
                stats.initiatives.failed++;
                console.error(`   ❌ Error: ${i.name}`, error);
            }
        }
    }

    // Seed Activities (depends on Initiatives)
    if (data.activities?.length) {
        console.log(`\n   Found ${data.activities.length} activities`);
        for (const a of data.activities) {
            try {
                const result = await client.createActivity({
                    id: a.id,
                    name: a.name,
                    description: a.description,
                    parent_id: a.parent_id,
                    initiative_id: a.initiative_id,
                    blocked_by: Array.isArray(a.blocked_by) ? JSON.stringify(a.blocked_by) : a.blocked_by,
                    status: a.status as "backlog" | "ready" | "in_progress" | "blocked" | "complete" | undefined,
                });
                if (result.success) {
                    stats.activities.created++;
                    console.log(`   ✅ Activity: ${a.name}`);
                } else if (result.error?.includes("UNIQUE constraint")) {
                    console.log(`   ⏭️  Skipped: ${a.name} (exists)`);
                } else {
                    stats.activities.failed++;
                    console.log(`   ❌ Failed: ${a.name} - ${result.error}`);
                }
            } catch (error) {
                stats.activities.failed++;
                console.error(`   ❌ Error: ${a.name}`, error);
            }
        }
    }

    // Seed Roles
    if (data.roles?.length) {
        console.log(`\n   Found ${data.roles.length} roles`);
        for (const r of data.roles) {
            try {
                const result = await client.createRole({
                    id: r.id,
                    name: r.name,
                    description: r.description,
                });
                if (result.success) {
                    stats.roles.created++;
                    console.log(`   ✅ Role: ${r.name}`);
                } else if (result.error?.includes("UNIQUE constraint")) {
                    console.log(`   ⏭️  Skipped: ${r.name} (exists)`);
                } else {
                    stats.roles.failed++;
                    console.log(`   ❌ Failed: ${r.name} - ${result.error}`);
                }
            } catch (error) {
                stats.roles.failed++;
                console.error(`   ❌ Error: ${r.name}`, error);
            }
        }
    }

    // Seed Assignments (depends on Activities and Roles)
    if (data.assignments?.length) {
        console.log(`\n   Found ${data.assignments.length} assignments`);
        for (const a of data.assignments) {
            try {
                const result = await client.createAssignment({
                    id: a.id,
                    activity_id: a.activity_id,
                    role_id: a.role_id,
                    quantity: a.quantity,
                    unit: a.unit,
                    raci_type: a.raci_type as "responsible" | "accountable" | "consulted" | "informed" | undefined,
                });
                if (result.success) {
                    stats.assignments.created++;
                    console.log(`   ✅ Assignment: ${a.id}`);
                } else if (result.error?.includes("UNIQUE constraint")) {
                    console.log(`   ⏭️  Skipped: ${a.id} (exists)`);
                } else {
                    stats.assignments.failed++;
                    console.log(`   ❌ Failed: ${a.id} - ${result.error}`);
                }
            } catch (error) {
                stats.assignments.failed++;
                console.error(`   ❌ Error: ${a.id}`, error);
            }
        }
    }

    // Seed Allocations (depends on Assignments and Personnel)
    if (data.allocations?.length) {
        console.log(`\n   Found ${data.allocations.length} allocations`);
        for (const a of data.allocations) {
            try {
                const result = await client.createAllocation({
                    id: a.id,
                    assignment_id: a.assignment_id,
                    person_id: a.person_id,
                    quantity_contributed: a.quantity_contributed,
                    start_date: a.start_date,
                    end_date: a.end_date,
                });
                if (result.success) {
                    stats.allocations.created++;
                    console.log(`   ✅ Allocation: ${a.id}`);
                } else if (result.error?.includes("UNIQUE constraint")) {
                    console.log(`   ⏭️  Skipped: ${a.id} (exists)`);
                } else {
                    stats.allocations.failed++;
                    console.log(`   ❌ Failed: ${a.id} - ${result.error}`);
                }
            } catch (error) {
                stats.allocations.failed++;
                console.error(`   ❌ Error: ${a.id}`, error);
            }
        }
    }

    return stats;
}

main().catch((error) => {
    console.error("\n❌ Seed failed:", error);
    process.exit(1);
});
