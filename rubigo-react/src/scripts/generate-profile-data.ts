#!/usr/bin/env bun
/**
 * Generate profile-specific data SQL from previously converted MMC data.
 * Adds profile_id='mmc' to all INSERT statements.
 */

import { Database } from "bun:sqlite";
import { join } from "path";

const SCENARIO_DIR = join(import.meta.dir, "..", "..", "..", "common", "scenarios");
const dbPath = join(SCENARIO_DIR, "mmc", "builds", "mmc.sqlite");

const db = new Database(dbPath, { readonly: true });

function escapeSql(val: unknown): string {
    if (val === null || val === undefined) return "NULL";
    if (typeof val === "number") return String(val);
    return `'${String(val).replace(/'/g, "''")}'`;
}

function generateInserts(tableName: string, columns: string[], includeProfileId = true) {
    const rows = db.query(`SELECT * FROM ${tableName}`).all();
    if (rows.length === 0) return;

    console.log(`-- ${tableName.toUpperCase()}`);

    for (const row of rows as Record<string, unknown>[]) {
        const cols = includeProfileId ? ["profile_id", ...columns] : columns;
        const vals = includeProfileId
            ? ["'mmc'", ...columns.map(c => escapeSql(row[c]))]
            : columns.map(c => escapeSql(row[c]));
        console.log(`INSERT INTO ${tableName} (${cols.join(", ")}) VALUES (${vals.join(", ")});`);
    }
    console.log("");
}

// Personnel
generateInserts("personnel", ["id", "name", "email", "title", "department", "site", "building", "level", "space", "manager", "photo", "desk_phone", "cell_phone", "bio"]);

// Sites hierarchy
generateInserts("regions", ["id", "name", "description"]);
generateInserts("sites", ["id", "name", "region_id", "address", "city", "state", "zip", "country"]);
generateInserts("buildings", ["id", "name", "site_id", "floors"]);
generateInserts("spaces", ["id", "name", "building_id", "floor", "space_type", "capacity"]);

// Solutions
generateInserts("solutions", ["id", "name", "description", "status"]);
generateInserts("products", ["id", "solution_id", "version"]);
generateInserts("services", ["id", "name", "solution_id", "service_level"]);

// Projects & Requirements
generateInserts("projects", ["id", "name", "description", "solution_id", "status", "start_date", "end_date"]);
generateInserts("objectives", ["id", "title", "description", "project_id", "parent_id", "status"]);
generateInserts("features", ["id", "name", "description", "objective_id", "status"]);
generateInserts("rules", ["id", "feature_id", "role", "requirement", "reason", "status"]);
generateInserts("scenarios", ["id", "rule_id", "name", "narrative", "status"]);

// Roles
generateInserts("roles", ["id", "name", "description"]);

// Calendar
generateInserts("calendar_events", ["id", "title", "description", "start_time", "end_time", "all_day", "event_type", "recurrence", "recurrence_interval", "recurrence_days", "recurrence_until", "organizer_id", "location", "virtual_url", "timezone"]);

// Chat
generateInserts("chat_channels", ["id", "name", "description", "type"]);
generateInserts("chat_memberships", ["id", "channel_id", "person_id"]);
generateInserts("chat_messages", ["id", "channel_id", "sender_id", "content", "sent_at"]);

// Infrastructure
generateInserts("infrastructure", ["id", "name", "type", "space", "capacity", "assigned_to"]);
generateInserts("components", ["id", "name", "type", "placement_type", "rack_id", "desk_id", "u_position", "status"]);
generateInserts("assets", ["id", "name", "category", "manufacturer", "model", "serial_number", "mac_address", "status", "rack", "position_u", "height_u", "space", "storage_location", "notes"]);

db.close();
