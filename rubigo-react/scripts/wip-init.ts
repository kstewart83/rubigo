#!/usr/bin/env bun
/**
 * WIP Init Script
 * 
 * Initializes a WIP worktree environment.
 * Usage: bun run wip:init [worktree-path]
 */

import { $ } from "bun";
import { existsSync } from "fs";
import path from "path";

async function initWorktree(worktreePath: string) {
    const projectPath = path.join(worktreePath, "rubigo-react");

    if (!existsSync(projectPath)) {
        console.error(`❌ Project path not found: ${projectPath}`);
        process.exit(1);
    }

    console.log("📦 Initializing WIP environment...\n");

    // Install dependencies
    console.log("1️⃣ Installing dependencies...");
    await $`cd ${projectPath} && bun install`;

    // Initialize database
    console.log("\n2️⃣ Setting up database...");
    await $`cd ${projectPath} && bun run db:push`;

    // Verify build
    console.log("\n3️⃣ Verifying build...");
    await $`cd ${projectPath} && bun run build`;

    console.log("\n✅ WIP environment ready!");
    console.log(`\nTo start development:`);
    console.log(`  cd ${projectPath}`);
    console.log(`  bun run dev`);
}

async function main() {
    const args = process.argv.slice(2);
    let worktreePath = args[0];

    if (!worktreePath) {
        // Try to detect from current directory
        const cwd = process.cwd();
        if (cwd.includes("/wip/")) {
            worktreePath = cwd.split("/wip/")[0] + "/wip/" + cwd.split("/wip/")[1].split("/")[0];
        } else {
            console.error("Usage: bun run wip:init <worktree-path>");
            console.error("Example: bun run wip:init wip/my-feature");
            process.exit(1);
        }
    }

    await initWorktree(worktreePath);
}

main().catch(err => {
    console.error("Init failed:", err);
    process.exit(1);
});
