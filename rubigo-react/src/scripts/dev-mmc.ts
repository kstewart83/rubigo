#!/usr/bin/env bun
/**
 * Dev MMC Orchestrator
 * 
 * Starts the dev server, waits for it to be ready, captures the API token,
 * and runs the seed-via-api script to load MMC scenario data.
 * 
 * Usage:
 *   bun src/scripts/dev-mmc.ts
 */

import { spawn, type Subprocess } from "bun";
import { join } from "path";

// Configuration
const SEED_DIR = "../common/scenarios/mmc";
const SERVER_PORT = 3000;
const SERVER_TIMEOUT_MS = 30000;

let serverProcess: Subprocess | null = null;

// Cleanup on exit
function cleanup() {
    if (serverProcess) {
        console.log("\n🛑 Shutting down server...");
        serverProcess.kill();
    }
}

process.on("SIGINT", () => {
    cleanup();
    process.exit(0);
});

process.on("SIGTERM", () => {
    cleanup();
    process.exit(0);
});

/**
 * Wait for the server to be ready by polling the health check
 */
async function waitForServer(): Promise<void> {
    const startTime = Date.now();
    const url = `http://localhost:${SERVER_PORT}/api/init`;

    while (Date.now() - startTime < SERVER_TIMEOUT_MS) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                return;
            }
        } catch {
            // Server not ready yet
        }
        await Bun.sleep(500);
    }

    throw new Error(`Server did not start within ${SERVER_TIMEOUT_MS / 1000} seconds`);
}

/**
 * Start the Next.js dev server and capture the API token
 */
async function startServer(): Promise<string> {
    console.log("🚀 Starting Next.js dev server...\n");

    return new Promise((resolve, reject) => {
        let apiToken: string | null = null;
        let outputBuffer = "";

        serverProcess = spawn({
            cmd: ["bun", "--bun", "next", "dev", "--turbopack"],
            env: {
                ...process.env,
                RUBIGO_AUTO_INIT: "true",
            },
            stdout: "pipe",
            stderr: "pipe",
        });

        // Read stdout for API token
        const readStream = async () => {
            const stdout = serverProcess!.stdout;
            if (!stdout || typeof stdout === "number") {
                reject(new Error("stdout is not a stream"));
                return;
            }
            const reader = stdout.getReader();
            const decoder = new TextDecoder();

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const text = decoder.decode(value);
                    outputBuffer += text;
                    process.stdout.write(text);

                    // Look for API token in output
                    const tokenMatch = outputBuffer.match(/API Token: ([a-f0-9]+)/);
                    if (tokenMatch && !apiToken) {
                        apiToken = tokenMatch[1];
                        // Give server a moment to fully initialize
                        setTimeout(() => resolve(apiToken!), 1000);
                    }
                }
            } catch (error) {
                reject(error);
            }
        };

        readStream();

        // Set timeout for token capture
        setTimeout(() => {
            if (!apiToken) {
                reject(new Error("Timeout waiting for API token"));
            }
        }, SERVER_TIMEOUT_MS);
    });
}

/**
 * Run the seed script with the captured token
 */
async function runSeedScript(apiToken: string): Promise<void> {
    console.log("\n🌱 Running seed script...\n");

    const seedProcess = spawn({
        cmd: ["bun", "src/scripts/seed-via-api.ts"],
        env: {
            ...process.env,
            RUBIGO_SEED_DIR: SEED_DIR,
            RUBIGO_API_TOKEN: apiToken,
            RUBIGO_API_URL: `http://localhost:${SERVER_PORT}`,
        },
        stdout: "inherit",
        stderr: "inherit",
    });

    const exitCode = await seedProcess.exited;
    if (exitCode !== 0) {
        throw new Error(`Seed script exited with code ${exitCode}`);
    }
}

/**
 * Main entry point
 */
async function main() {
    console.log("\n" + "=".repeat(60));
    console.log("🎯 Rubigo Dev with MMC Scenario");
    console.log("=".repeat(60) + "\n");

    try {
        // Start server and capture API token
        const apiToken = await startServer();
        console.log(`\n✅ Captured API Token: ${apiToken}\n`);

        // Wait for server to be fully ready
        await waitForServer();

        // Run seed script
        await runSeedScript(apiToken);

        console.log("\n" + "=".repeat(60));
        console.log("✅ MMC scenario loaded successfully!");
        console.log("   Server is running at http://localhost:3000");
        console.log("   Press Ctrl+C to stop");
        console.log("=".repeat(60) + "\n");

        // Keep running until interrupted
        await new Promise(() => { });
    } catch (error) {
        console.error("\n❌ Error:", error);
        cleanup();
        process.exit(1);
    }
}

main();
