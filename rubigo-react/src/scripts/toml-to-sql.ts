#!/usr/bin/env bun
/**
 * Extract TOML data and generate SQL INSERT statements
 * 
 * Usage: bun src/scripts/toml-to-sql.ts > output.sql
 */

import { parse } from "@iarna/toml";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const SCENARIO_DIR = "../common/scenarios/mmc";

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
}

function loadToml(filename: string): TomlData | null {
    const path = join(SCENARIO_DIR, filename);
    if (!existsSync(path)) return null;
    return parse(readFileSync(path, "utf-8")) as unknown as TomlData;
}

function escapeSql(str: string | undefined): string {
    if (!str) return "NULL";
    return `'${str.replace(/'/g, "''")}'`;
}

function generateInserts() {
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

    // Deduplicate by ID
    const seenIds = new Set<string>();

    console.log("-- ============================================================================");
    console.log("-- AUTO-GENERATED: Full data export from TOML files");
    console.log(`-- Generated: ${new Date().toISOString()}`);
    console.log("-- ============================================================================\n");

    // Objectives
    console.log("-- OBJECTIVES (from all TOML files)");
    console.log("DELETE FROM objectives;\n");
    for (const o of allObjectives) {
        if (seenIds.has(o.id)) continue;
        seenIds.add(o.id);
        console.log(`INSERT INTO objectives (id, title, description, project_id, parent_id, status) VALUES (${escapeSql(o.id)}, ${escapeSql(o.title)}, ${escapeSql(o.description)}, ${escapeSql(o.project_id)}, ${escapeSql(o.parent_id)}, ${escapeSql(o.status || 'draft')});`);
    }
    console.log(`\n-- Total objectives: ${seenIds.size}\n`);

    // Features
    seenIds.clear();
    console.log("-- FEATURES (from all TOML files)");
    console.log("DELETE FROM features;\n");
    for (const f of allFeatures) {
        if (seenIds.has(f.id)) continue;
        seenIds.add(f.id);
        console.log(`INSERT INTO features (id, name, description, objective_id, status) VALUES (${escapeSql(f.id)}, ${escapeSql(f.name)}, ${escapeSql(f.description)}, ${escapeSql(f.objective_id)}, ${escapeSql(f.status || 'planned')});`);
    }
    console.log(`\n-- Total features: ${seenIds.size}\n`);

    // Rules
    seenIds.clear();
    console.log("-- RULES (from all TOML files)");
    console.log("DELETE FROM rules;\n");
    for (const r of allRules) {
        if (seenIds.has(r.id)) continue;
        seenIds.add(r.id);
        console.log(`INSERT INTO rules (id, feature_id, role, requirement, reason, status) VALUES (${escapeSql(r.id)}, ${escapeSql(r.feature_id)}, ${escapeSql(r.role)}, ${escapeSql(r.requirement)}, ${escapeSql(r.reason)}, ${escapeSql(r.status || 'draft')});`);
    }
    console.log(`\n-- Total rules: ${seenIds.size}\n`);

    // Scenarios
    seenIds.clear();
    console.log("-- SCENARIOS (from all TOML files)");
    console.log("DELETE FROM scenarios;\n");
    for (const s of allScenarios) {
        if (seenIds.has(s.id)) continue;
        seenIds.add(s.id);
        console.log(`INSERT INTO scenarios (id, rule_id, name, narrative, status) VALUES (${escapeSql(s.id)}, ${escapeSql(s.rule_id)}, ${escapeSql(s.name)}, ${escapeSql(s.narrative)}, ${escapeSql(s.status || 'draft')});`);
    }
    console.log(`\n-- Total scenarios: ${seenIds.size}`);
}

generateInserts();
