#!/usr/bin/env bun
/**
 * Build Profiles SQLite Database
 * 
 * Compiles schema files and all profile data into a single profiles.sqlite database.
 * 
 * Usage: bun src/scripts/build-scenarios.ts
 */

import { Database } from "bun:sqlite";
import { readFileSync, readdirSync, existsSync, mkdirSync, unlinkSync } from "fs";
import { join, basename } from "path";

// Resolve paths relative to rubigo-react
const scriptDir = import.meta.dir;
const projectRoot = join(scriptDir, "..", "..", "..");

const SCHEMA_DIR = join(projectRoot, "common", "scenarios", "schema");
const PROFILES_DIR = join(projectRoot, "common", "scenarios", "profiles");
const BUILDS_DIR = join(projectRoot, "common", "scenarios", "builds");
const OUTPUT_FILE = join(BUILDS_DIR, "profiles.sqlite");

console.log("============================================================");
console.log("🏗️  Rubigo Profiles Builder");
console.log("============================================================\n");

// Ensure builds directory exists
if (!existsSync(BUILDS_DIR)) {
    mkdirSync(BUILDS_DIR, { recursive: true });
}

// Remove existing database
if (existsSync(OUTPUT_FILE)) {
    unlinkSync(OUTPUT_FILE);
}

// Create new database
const db = new Database(OUTPUT_FILE);

// Load and execute schema files
console.log("📁 Loading schema files from", SCHEMA_DIR);
const schemaFiles = readdirSync(SCHEMA_DIR)
    .filter(f => f.endsWith(".sql"))
    .sort();

for (const file of schemaFiles) {
    const sql = readFileSync(join(SCHEMA_DIR, file), "utf-8");
    try {
        db.exec(sql);
        console.log(`   ✅ ${file}`);
    } catch (error) {
        console.error(`   ❌ ${file}: ${error}`);
        process.exit(1);
    }
}

console.log(`\n📂 Loading profile data from ${PROFILES_DIR}`);

// Find all profile directories
const profileDirs = readdirSync(PROFILES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

for (const profileId of profileDirs) {
    const profileDir = join(PROFILES_DIR, profileId);
    const profileSql = join(profileDir, "profile.sql");
    const dataSql = join(profileDir, "data.sql");

    console.log(`\n   🔹 Profile: ${profileId}`);

    // Load profile metadata
    if (existsSync(profileSql)) {
        try {
            db.exec(readFileSync(profileSql, "utf-8"));
            console.log(`      ✅ profile.sql`);
        } catch (error) {
            console.error(`      ❌ profile.sql: ${error}`);
        }
    }

    // Load profile data
    if (existsSync(dataSql)) {
        try {
            db.exec(readFileSync(dataSql, "utf-8"));
            console.log(`      ✅ data.sql`);
        } catch (error) {
            console.error(`      ❌ data.sql: ${error}`);
        }
    }
}

// Print summary
console.log("\n📊 Build Summary:");

// Profile info
const profiles = db.query("SELECT id, name FROM profile").all() as { id: string; name: string }[];
for (const p of profiles) {
    console.log(`   Profile: ${p.name} (${p.id})`);

    const personnel = db.query("SELECT COUNT(*) as c FROM personnel WHERE profile_id = ?").get(p.id) as { c: number };
    const objectives = db.query("SELECT COUNT(*) as c FROM objectives WHERE profile_id = ?").get(p.id) as { c: number };
    const features = db.query("SELECT COUNT(*) as c FROM features WHERE profile_id = ?").get(p.id) as { c: number };
    const events = db.query("SELECT COUNT(*) as c FROM calendar_events WHERE profile_id = ?").get(p.id) as { c: number };

    console.log(`      Personnel: ${personnel.c}`);
    console.log(`      Objectives: ${objectives.c}`);
    console.log(`      Features: ${features.c}`);
    console.log(`      Events: ${events.c}`);
}

console.log(`\n   💾 Database: ${OUTPUT_FILE}`);

db.close();
console.log("\n✅ Build complete!\n");
