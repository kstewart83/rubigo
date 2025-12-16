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
                photo: person.photo ? `/${person.photo}` : undefined,
                deskPhone: person.desk_phone,
                cellPhone: person.cell_phone,
                bio: person.bio,
            };

            const result = await client.createPersonnel(input);

            if (result.success) {
                created++;
                console.log(`   ✅ Created: ${person.name}`);
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

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 Seed Summary");
    console.log("=".repeat(50));
    console.log(`   Personnel: ${personnelStats.created} created, ${personnelStats.failed} failed`);
    console.log("");
}

main().catch((error) => {
    console.error("\n❌ Seed failed:", error);
    process.exit(1);
});
