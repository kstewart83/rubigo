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

const SCHEMA_DIR = join(projectRoot, "common", "seed", "schema");
const PROFILES_DIR = join(projectRoot, "common", "seed", "profiles");
const BUILDS_DIR = join(projectRoot, "common", "seed", "builds");
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

    console.log(`\n   🔹 Profile: ${profileId}`);

    // Load profile metadata first
    if (existsSync(profileSql)) {
        try {
            db.exec(readFileSync(profileSql, "utf-8"));
            console.log(`      ✅ profile.sql`);
        } catch (error) {
            console.error(`      ❌ profile.sql: ${error}`);
        }
    }

    // Recursively find all .sql files (except profile.sql) and execute in alphabetical order
    // This supports nested structures like: personnel.sql, projects/solutions.sql, collaboration/chat.sql
    const findSqlFiles = (dir: string, prefix = ""): string[] => {
        const files: string[] = [];
        const entries = readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
            if (entry.isDirectory()) {
                files.push(...findSqlFiles(join(dir, entry.name), relPath));
            } else if (entry.name.endsWith(".sql") && entry.name !== "profile.sql") {
                files.push(relPath);
            }
        }
        return files;
    };

    const sqlFiles = findSqlFiles(profileDir).sort();
    for (const relPath of sqlFiles) {
        const fullPath = join(profileDir, relPath);
        try {
            db.exec(readFileSync(fullPath, "utf-8"));
            console.log(`      ✅ ${relPath}`);
        } catch (error) {
            console.error(`      ❌ ${relPath}: ${error}`);
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
