#!/usr/bin/env bun
/**
 * Extract ALL TOML data and generate SQL INSERT statements
 * 
 * Usage: bun src/scripts/toml-to-sql.ts [--type=all|projects|events|chat|infra]
 */

import { parse } from "@iarna/toml";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const SCENARIO_DIR = join(import.meta.dir, "..", "..", "..", "common", "scenarios", "mmc");

// ============================================================================
// Type Definitions
// ============================================================================

interface TomlData {
    objectives?: Array<{
        id: string;
        title: string;
        description?: string;
        project_id?: string;
        parent_id?: string;
        status?: string;
    }>;
    features?: Array<{
        id: string;
        name: string;
        description?: string;
        objective_id?: string;
        status?: string;
    }>;
    rules?: Array<{
        id: string;
        feature_id: string;
        role: string;
        requirement: string;
        reason: string;
        status?: string;
    }>;
    scenarios?: Array<{
        id: string;
        rule_id: string;
        name: string;
        narrative: string;
        status?: string;
    }>;
    events?: Array<{
        title: string;
        description?: string;
        start_time: string;
        end_time: string;
        all_day?: boolean;
        event_type?: string;
        recurrence?: string;
        recurrence_interval?: number;
        recurrence_days?: string[];
        recurrence_until?: string;
        organizer_id?: string;
        participant_ids?: string[];
        location?: string;
        virtual_url?: string;
        timezone?: string;
    }>;
    channels?: Array<{
        id: string;
        name: string;
        description?: string;
        type?: string;
    }>;
    memberships?: Array<{
        channel_id: string;
        person_id: string;
    }>;
    messages?: Array<{
        channel_id: string;
        sender_id: string;
        content: string;
        sent_at: string;
    }>;
    racks?: Array<{
        name: string;
        space: string;
        units: number;
    }>;
    desks?: Array<{
        name: string;
        space: string;
        assigned_to?: string;
    }>;
}

function loadToml(filename: string): TomlData | null {
    const path = join(SCENARIO_DIR, filename);
    if (!existsSync(path)) return null;
    return parse(readFileSync(path, "utf-8")) as unknown as TomlData;
}

function escapeSql(str: string | undefined | null): string {
    if (str === null || str === undefined) return "NULL";
    return `'${str.replace(/'/g, "''")}'`;
}

function escapeArrayJson(arr: string[] | undefined): string {
    if (!arr || arr.length === 0) return "NULL";
    return `'${JSON.stringify(arr)}'`;
}

// ============================================================================
// Projects Extraction (objectives, features, rules, scenarios)
// ============================================================================

function generateProjectsInserts() {
    const files = ["projects.toml", "collaboration.toml", "access-control.toml", "integration.toml"];

    const allObjectives: TomlData["objectives"] = [];
    const allFeatures: TomlData["features"] = [];
    const allRules: TomlData["rules"] = [];
    const allScenarios: TomlData["scenarios"] = [];

    for (const file of files) {
        const data = loadToml(file);
        if (!data) continue;
        if (data.objectives) allObjectives.push(...data.objectives);
        if (data.features) allFeatures.push(...data.features);
        if (data.rules) allRules.push(...data.rules);
        if (data.scenarios) allScenarios.push(...data.scenarios);
    }

    const seenIds = new Set<string>();

    // Objectives
    for (const o of allObjectives) {
        if (seenIds.has(o.id)) continue;
        seenIds.add(o.id);
        console.log(`INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES (${escapeSql(o.id)}, ${escapeSql(o.title)}, ${escapeSql(o.description)}, ${escapeSql(o.project_id)}, ${escapeSql(o.parent_id)}, ${escapeSql(o.status || 'draft')});`);
    }

    // Features
    seenIds.clear();
    for (const f of allFeatures) {
        if (seenIds.has(f.id)) continue;
        seenIds.add(f.id);
        console.log(`INSERT INTO features (id, name, description, objective_id, status) VALUES (${escapeSql(f.id)}, ${escapeSql(f.name)}, ${escapeSql(f.description)}, ${escapeSql(f.objective_id)}, ${escapeSql(f.status || 'planned')});`);
    }

    // Rules
    seenIds.clear();
    for (const r of allRules) {
        if (seenIds.has(r.id)) continue;
        seenIds.add(r.id);
        console.log(`INSERT INTO rules (id, feature_id, role, requirement, reason, status) VALUES (${escapeSql(r.id)}, ${escapeSql(r.feature_id)}, ${escapeSql(r.role)}, ${escapeSql(r.requirement)}, ${escapeSql(r.reason)}, ${escapeSql(r.status || 'draft')});`);
    }

    // Scenarios
    seenIds.clear();
    for (const s of allScenarios) {
        if (seenIds.has(s.id)) continue;
        seenIds.add(s.id);
        console.log(`INSERT INTO scenarios (id, rule_id, name, narrative, status) VALUES (${escapeSql(s.id)}, ${escapeSql(s.rule_id)}, ${escapeSql(s.name)}, ${escapeSql(s.narrative)}, ${escapeSql(s.status || 'draft')});`);
    }
}

// ============================================================================
// Events Extraction (calendar_events)
// ============================================================================

function generateEventsInserts() {
    const data = loadToml("events.toml");
    if (!data?.events) return;

    let id = 1;
    for (const e of data.events) {
        const cols = [
            "id", "title", "description", "start_time", "end_time", "all_day", "event_type",
            "recurrence", "recurrence_interval", "recurrence_days", "recurrence_until",
            "organizer_id", "location", "virtual_url", "timezone"
        ];
        const vals = [
            `'evt-${String(id++).padStart(3, '0')}'`,
            escapeSql(e.title),
            escapeSql(e.description),
            escapeSql(e.start_time),
            escapeSql(e.end_time),
            e.all_day ? 1 : 0,
            escapeSql(e.event_type),
            escapeSql(e.recurrence),
            e.recurrence_interval || "NULL",
            escapeArrayJson(e.recurrence_days),
            escapeSql(e.recurrence_until),
            escapeSql(e.organizer_id),
            escapeSql(e.location),
            escapeSql(e.virtual_url),
            escapeSql(e.timezone || "America/New_York"),
        ];
        console.log(`INSERT INTO calendar_events (${cols.join(", ")}) VALUES (${vals.join(", ")});`);
    }
}

// ============================================================================
// Chat Extraction (chat_channels, chat_memberships, chat_messages)
// ============================================================================

function generateChatInserts() {
    const data = loadToml("chat.toml");
    if (!data) return;

    // Channels
    if (data.channels) {
        for (const c of data.channels) {
            console.log(`INSERT INTO chat_channels (id, name, description, type) VALUES (${escapeSql(c.id)}, ${escapeSql(c.name)}, ${escapeSql(c.description)}, ${escapeSql(c.type || 'channel')});`);
        }
    }

    // Memberships
    if (data.memberships) {
        let memId = 1;
        for (const m of data.memberships) {
            console.log(`INSERT INTO chat_memberships (id, channel_id, person_id) VALUES ('mem-${String(memId++).padStart(3, '0')}', ${escapeSql(m.channel_id)}, ${escapeSql(m.person_id)});`);
        }
    }

    // Messages
    if (data.messages) {
        let msgId = 1;
        for (const m of data.messages) {
            console.log(`INSERT INTO chat_messages (id, channel_id, sender_id, content, sent_at) VALUES ('msg-${String(msgId++).padStart(3, '0')}', ${escapeSql(m.channel_id)}, ${escapeSql(m.sender_id)}, ${escapeSql(m.content)}, ${escapeSql(m.sent_at)});`);
        }
    }
}

// ============================================================================
// Infrastructure Extraction (racks, desks -> infrastructure table)
// ============================================================================

function generateInfraInserts() {
    const data = loadToml("infrastructure.toml");
    if (!data) return;

    let id = 1;

    // Racks
    if (data.racks) {
        for (const r of data.racks) {
            console.log(`INSERT INTO infrastructure (id, name, type, space, capacity) VALUES ('infra-${String(id++).padStart(3, '0')}', ${escapeSql(r.name)}, 'rack', ${escapeSql(r.space)}, ${r.units});`);
        }
    }

    // Desks
    if (data.desks) {
        for (const d of data.desks) {
            console.log(`INSERT INTO infrastructure (id, name, type, space, assigned_to) VALUES ('infra-${String(id++).padStart(3, '0')}', ${escapeSql(d.name)}, 'desk', ${escapeSql(d.space)}, ${escapeSql(d.assigned_to)});`);
        }
    }
}

// ============================================================================
// Components Extraction
// ============================================================================

function generateComponentsInserts() {
    const data = loadToml("components.toml");
    if (!data) return;
    // Components TOML has different structure - handle server/network/storage sections
    const tomlAny = data as Record<string, unknown>;

    let id = 1;
    const sections = ["servers", "network", "storage", "software"];

    for (const section of sections) {
        const items = tomlAny[section] as Array<Record<string, unknown>> | undefined;
        if (!items) continue;
        for (const item of items) {
            console.log(`INSERT INTO components (id, name, type, category, status) VALUES ('comp-${String(id++).padStart(3, '0')}', ${escapeSql(item.name as string)}, ${escapeSql(item.type as string || section)}, ${escapeSql(section)}, ${escapeSql(item.status as string || 'active')});`);
        }
    }
}

// ============================================================================
// Assets Extraction
// ============================================================================

function generateAssetsInserts() {
    const data = loadToml("assets.toml");
    if (!data) return;
    const tomlAny = data as Record<string, unknown>;
    const assets = tomlAny.assets as Array<Record<string, unknown>> | undefined;

    if (!assets) return;

    let id = 1;
    for (const a of assets) {
        console.log(`INSERT INTO assets (id, name, asset_tag, type, assigned_to, status) VALUES ('asset-${String(id++).padStart(3, '0')}', ${escapeSql(a.name as string)}, ${escapeSql(a.asset_tag as string)}, ${escapeSql(a.type as string)}, ${escapeSql(a.assigned_to as string)}, ${escapeSql(a.status as string || 'active')});`);
    }
}

// ============================================================================
// Main
// ============================================================================

function main() {
    const args = process.argv.slice(2);
    const typeArg = args.find(a => a.startsWith("--type="))?.split("=")[1] || "all";

    console.log("-- ============================================================================");
    console.log(`-- AUTO-GENERATED: Full data export from TOML files`);
    console.log(`-- Generated: ${new Date().toISOString()}`);
    console.log(`-- Type: ${typeArg}`);
    console.log("-- ============================================================================\n");

    if (typeArg === "all" || typeArg === "projects") {
        console.log("-- PROJECTS: Objectives, Features, Rules, Scenarios\n");
        generateProjectsInserts();
        console.log("");
    }

    if (typeArg === "all" || typeArg === "events") {
        console.log("-- EVENTS: Calendar Events\n");
        generateEventsInserts();
        console.log("");
    }

    if (typeArg === "all" || typeArg === "chat") {
        console.log("-- CHAT: Channels, Memberships, Messages\n");
        generateChatInserts();
        console.log("");
    }

    if (typeArg === "all" || typeArg === "infra") {
        console.log("-- INFRASTRUCTURE: Racks, Desks\n");
        generateInfraInserts();
        console.log("");
        console.log("-- COMPONENTS\n");
        generateComponentsInserts();
        console.log("");
        console.log("-- ASSETS\n");
        generateAssetsInserts();
        console.log("");
    }
}

main();
