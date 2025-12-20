#!/usr/bin/env bun
/**
 * Build Scenarios Script
 * 
 * Builds SQLite databases from SQL schema files for each scenario.
 * 
 * Usage:
 *   bun run scenarios:build
 *   bun run scenarios:build --scenario=mmc
 */

import { Database } from "bun:sqlite";
import { readdir, readFile, mkdir, unlink, exists } from "node:fs/promises";
import { join, basename } from "node:path";

interface BuildOptions {
    scenario: string;
    verbose: boolean;
}

function parseArgs(): BuildOptions {
    const args = process.argv.slice(2);
    const options: BuildOptions = {
        scenario: "mmc",
        verbose: false,
    };

    for (const arg of args) {
        if (arg.startsWith("--scenario=")) {
            options.scenario = arg.split("=")[1];
        }
        if (arg === "--verbose" || arg === "-v") {
            options.verbose = true;
        }
    }

    return options;
}

async function getSqlFiles(dir: string): Promise<string[]> {
    const files = await readdir(dir);
    return files
        .filter(f => f.endsWith(".sql"))
        .sort() // Ensures numeric ordering: 000_, 001_, etc.
        .map(f => join(dir, f));
}

async function buildScenario(scenario: string, verbose: boolean): Promise<void> {
    console.log(`\n🔨 Building scenario: ${scenario}`);

    // Paths - common/ is at repo root, not within rubigo-react
    const projectRoot = join(import.meta.dir, "..", "..", "..");
    const commonDir = join(projectRoot, "common", "scenarios");
    const schemaDir = join(commonDir, "schema");
    const scenarioDir = join(commonDir, scenario);
    const buildsDir = join(scenarioDir, "builds");
    const dbPath = join(buildsDir, `${scenario}.sqlite`);

    // Ensure builds directory exists
    await mkdir(buildsDir, { recursive: true });

    // Remove existing database if present
    if (await exists(dbPath)) {
        await unlink(dbPath);
        if (verbose) console.log(`   🗑️  Removed existing ${basename(dbPath)}`);
    }

    // Create new database
    const db = new Database(dbPath);

    try {
        // 1. Execute schema files in order
        console.log(`   📁 Loading schema files from ${schemaDir}`);
        const schemaFiles = await getSqlFiles(schemaDir);

        for (const file of schemaFiles) {
            const sql = await readFile(file, "utf-8");
            const filename = basename(file);

            if (verbose) console.log(`   📄 Executing ${filename}`);

            try {
                db.exec(sql);
            } catch (error) {
                console.error(`   ❌ Error in ${filename}:`, error);
                throw error;
            }
        }
        console.log(`   ✅ Loaded ${schemaFiles.length} schema files`);

        // 2. Execute profile-specific SQL (company configuration)
        const profileSql = join(scenarioDir, "profile.sql");
        if (await exists(profileSql)) {
            const sql = await readFile(profileSql, "utf-8");
            if (verbose) console.log(`   📄 Executing profile.sql`);
            db.exec(sql);
            console.log(`   ✅ Loaded profile data`);
        }

        // 3. Verify build
        const personnelCount = db.query("SELECT COUNT(*) as count FROM personnel").get() as { count: number };
        const objectivesCount = db.query("SELECT COUNT(*) as count FROM objectives").get() as { count: number };
        const featuresCount = db.query("SELECT COUNT(*) as count FROM features").get() as { count: number };
        const profileInfo = db.query("SELECT name FROM profile").get() as { name: string } | null;

        console.log(`\n   📊 Build Summary:`);
        console.log(`      Profile: ${profileInfo?.name || "Unknown"}`);
        console.log(`      Personnel: ${personnelCount.count}`);
        console.log(`      Objectives: ${objectivesCount.count}`);
        console.log(`      Features: ${featuresCount.count}`);
        console.log(`   \n   💾 Database: ${dbPath}`);

    } finally {
        db.close();
    }
}

async function main(): Promise<void> {
    const options = parseArgs();

    console.log("=".repeat(60));
    console.log("🏗️  Rubigo Scenario Builder");
    console.log("=".repeat(60));

    try {
        await buildScenario(options.scenario, options.verbose);
        console.log("\n✅ Build complete!");
    } catch (error) {
        console.error("\n❌ Build failed:", error);
        process.exit(1);
    }
}

main();
