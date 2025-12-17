#!/usr/bin/env bun
/**
 * Deploy Monitor Script
 * 
 * Monitors GitHub Actions workflow runs until completion.
 * Usage: bun run deploy:monitor [run-id]
 *   If no run-id provided, monitors the latest run.
 */

import { $ } from "bun";

async function getLatestRunId(): Promise<string | null> {
    try {
        const result = await $`gh run list --limit 1 --json databaseId --jq '.[0].databaseId'`.text();
        return result.trim() || null;
    } catch {
        return null;
    }
}

async function getRunStatus(runId: string): Promise<{ status: string; conclusion: string | null; name: string }> {
    try {
        const result = await $`gh run view ${runId} --json status,conclusion,displayTitle`.json();
        return {
            status: result.status,
            conclusion: result.conclusion,
            name: result.displayTitle
        };
    } catch {
        return { status: "unknown", conclusion: null, name: "" };
    }
}

async function watchRun(runId: string): Promise<void> {
    console.log(`🔍 Monitoring run ${runId}...`);

    const { name } = await getRunStatus(runId);
    console.log(`📋 ${name}\n`);

    // Use gh run watch for interactive monitoring
    const proc = Bun.spawn(["gh", "run", "watch", runId], {
        stdout: "inherit",
        stderr: "inherit",
    });

    await proc.exited;

    // Final status
    const { status, conclusion } = await getRunStatus(runId);
    console.log("");

    if (conclusion === "success") {
        console.log("✅ Deployment successful!");

        // Health check
        try {
            const response = await fetch("http://localhost:4430");
            if (response.ok) {
                console.log("✅ Production health check passed");
            } else {
                console.log("⚠️  Health check returned non-200 status");
            }
        } catch {
            console.log("❌ Production not responding");
        }
    } else if (conclusion === "failure") {
        console.log("❌ Deployment failed!");
        console.log("\nTo view failure logs:");
        console.log(`  gh run view ${runId} --log-failed`);
        console.log("\nUse /incident workflow for triage.");
        process.exit(1);
    } else {
        console.log(`⚠️  Run ended with status: ${status}, conclusion: ${conclusion}`);
    }
}

async function main() {
    const args = process.argv.slice(2);
    let runId = args[0];

    if (!runId) {
        console.log("No run ID provided, fetching latest...");
        const latestId = await getLatestRunId();
        if (!latestId) {
            console.error("❌ Could not find any workflow runs");
            process.exit(1);
        }
        runId = latestId;
    }

    await watchRun(runId);
}

main().catch(err => {
    console.error("Error:", err);
    process.exit(1);
});
