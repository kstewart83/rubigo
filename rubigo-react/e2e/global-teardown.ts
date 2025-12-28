/**
 * E2E Global Teardown
 * 
 * Runs ONCE after all tests complete to:
 * 1. Kill the server process started during globalSetup
 * 2. Clean up any resources
 * 
 * Note: This runs in Node.js (not Bun) via Playwright
 */
import * as fs from "fs";
import * as path from "path";
import type { FullConfig } from "@playwright/test";

export default async function globalTeardown(config: FullConfig) {
    console.log("🧹 E2E Global Teardown starting...");

    // Only cleanup if we started the server in globalSetup
    if (process.env.E2E_STARTED_SERVER !== "true") {
        console.log("   Server was not started by globalSetup, skipping cleanup.");
        console.log("✅ E2E Global Teardown complete");
        return;
    }

    const serverPid = process.env.E2E_SERVER_PID;

    if (serverPid) {
        console.log(`   Stopping server (PID: ${serverPid})...`);
        try {
            // Use graceful SIGTERM first, then SIGKILL if needed
            process.kill(parseInt(serverPid, 10), "SIGTERM");

            // Wait a moment for graceful shutdown
            await new Promise(r => setTimeout(r, 500));

            // Check if still running and force kill if needed
            try {
                process.kill(parseInt(serverPid, 10), 0); // 0 = check if alive
                console.log("   Process still running, forcing kill...");
                process.kill(parseInt(serverPid, 10), "SIGKILL");
            } catch {
                // Process already exited, which is good
            }

            console.log("   Server stopped.");
        } catch (e) {
            // Process may have already exited
            console.log(`   Server process already exited or cannot be killed.`);
        }
    }

    // Clean up auth token file
    const authDir = path.join(process.cwd(), ".auth");
    const tokenFile = path.join(authDir, "api-token.txt");
    if (fs.existsSync(tokenFile)) {
        try {
            fs.unlinkSync(tokenFile);
            console.log("   Cleaned up auth token file.");
        } catch {
            // Ignore cleanup errors
        }
    }

    console.log("✅ E2E Global Teardown complete");
}
