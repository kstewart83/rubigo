#!/usr/bin/env bun
/**
 * Incident Triage Script
 * 
 * Performs production health checks and gathers diagnostic information.
 * Usage: bun run incident:triage
 */

import { $ } from "bun";
import { existsSync } from "fs";
import path from "path";

const BASE_PATH = path.join(
    process.env.HOME || "",
    "Development/projects/tracked/rubigo/production/runner/_work/rubigo/rubigo/production/rubigo-react"
);

interface TriageResult {
    category: string;
    status: "ok" | "warning" | "error";
    message: string;
    details?: string;
}

async function checkService(): Promise<TriageResult> {
    try {
        const result = await $`launchctl list | grep rubigo`.text();
        const isRunning = result.includes("net.kwip.rubigo-react");
        return {
            category: "Service",
            status: isRunning ? "ok" : "error",
            message: isRunning ? "Service is registered" : "Service not found in launchctl",
        };
    } catch {
        return {
            category: "Service",
            status: "error",
            message: "Could not check launchctl status",
        };
    }
}

async function checkHealth(): Promise<TriageResult> {
    try {
        const response = await fetch("http://localhost:4430", { method: "GET" });
        if (response.ok) {
            return {
                category: "Health",
                status: "ok",
                message: `Production responding (${response.status})`,
            };
        } else {
            return {
                category: "Health",
                status: "warning",
                message: `Production returned ${response.status}`,
            };
        }
    } catch (err) {
        return {
            category: "Health",
            status: "error",
            message: "Production not responding",
            details: String(err),
        };
    }
}

async function checkLogs(): Promise<TriageResult> {
    const stdoutPath = path.join(BASE_PATH, "stdout.log");
    const stderrPath = path.join(BASE_PATH, "stderr.log");

    let details = "";

    if (existsSync(stdoutPath)) {
        try {
            const stdout = await $`tail -20 ${stdoutPath}`.text();
            details += `=== stdout (last 20 lines) ===\n${stdout}\n`;
        } catch { }
    }

    if (existsSync(stderrPath)) {
        try {
            const stderr = await $`tail -10 ${stderrPath}`.text();
            if (stderr.trim()) {
                details += `=== stderr (last 10 lines) ===\n${stderr}\n`;
            }
        } catch { }
    }

    return {
        category: "Logs",
        status: details ? "ok" : "warning",
        message: details ? "Log files found" : "No log files found",
        details: details || undefined,
    };
}

async function checkDatabase(): Promise<TriageResult> {
    const dbPath = path.join(BASE_PATH, "data/rubigo.db");

    if (!existsSync(dbPath)) {
        return {
            category: "Database",
            status: "error",
            message: "Database file not found",
        };
    }

    try {
        const count = await $`sqlite3 ${dbPath} "SELECT COUNT(*) FROM personnel;"`.text();
        const migrations = await $`sqlite3 ${dbPath} "SELECT COUNT(*) FROM __drizzle_migrations;"`.text();

        return {
            category: "Database",
            status: "ok",
            message: `Database OK: ${count.trim()} personnel, ${migrations.trim()} migrations`,
        };
    } catch (err) {
        return {
            category: "Database",
            status: "error",
            message: "Database query failed",
            details: String(err),
        };
    }
}

async function checkRecentDeploys(): Promise<TriageResult> {
    try {
        const runs = await $`gh run list --limit 5 --json databaseId,status,conclusion,displayTitle,createdAt`.json();

        const failed = runs.filter((r: any) => r.conclusion === "failure");

        let details = "Recent runs:\n";
        for (const run of runs.slice(0, 5)) {
            const icon = run.conclusion === "success" ? "✅" : run.conclusion === "failure" ? "❌" : "⏳";
            details += `  ${icon} ${run.displayTitle} (${run.databaseId})\n`;
        }

        return {
            category: "Deploys",
            status: failed.length > 0 ? "warning" : "ok",
            message: `${failed.length} failed in last 5 runs`,
            details,
        };
    } catch {
        return {
            category: "Deploys",
            status: "warning",
            message: "Could not fetch deployment history",
        };
    }
}

async function main() {
    console.log("🔍 Incident Triage\n");
    console.log("=".repeat(50));

    const checks = await Promise.all([
        checkService(),
        checkHealth(),
        checkDatabase(),
        checkRecentDeploys(),
        checkLogs(),
    ]);

    for (const check of checks) {
        const icon = check.status === "ok" ? "✅" : check.status === "warning" ? "⚠️" : "❌";
        console.log(`\n${icon} ${check.category}: ${check.message}`);
        if (check.details) {
            console.log("-".repeat(40));
            console.log(check.details);
        }
    }

    console.log("\n" + "=".repeat(50));

    const errors = checks.filter(c => c.status === "error");
    if (errors.length > 0) {
        console.log(`\n❌ ${errors.length} critical issue(s) found`);
        process.exit(1);
    } else {
        console.log("\n✅ No critical issues detected");
    }
}

main().catch(err => {
    console.error("Triage failed:", err);
    process.exit(1);
});
