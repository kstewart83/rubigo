/**
 * E2E Test Runner for Rubigo
 * Runs the full end-to-end test suite
 *
 * Usage: bun run scripts/run-e2e.ts
 *
 * Port and database configuration is read from ../wip.toml if running in a WIP worktree,
 * otherwise falls back to defaults (port 3600, database rubigo-e2e.db).
 */

import { spawn, type Subprocess } from "bun";
import { unlink, readFile } from "fs/promises";
import { parse as parseToml } from "@iarna/toml";
import { join } from "path";

const LOG_FILE = ".e2e-server.log";
const DEFAULT_PORT = 3600;
const DEFAULT_E2E_DATABASE = "rubigo-e2e.db";
const SERVER_STARTUP_DELAY = 8000;

interface WipConfig {
    ports?: {
        e2e?: number;
        base?: number;
    };
    projects?: {
        "rubigo-react"?: {
            e2e_database?: string;
        };
    };
}

/**
 * Load port configuration from wip.toml
 * Uses the e2e port if specified, otherwise base+1, otherwise default
 */
async function getPort(): Promise<number> {
    try {
        // Look for wip.toml in parent directory (worktree root)
        const wipTomlPath = join(process.cwd(), "..", "wip.toml");
        const content = await readFile(wipTomlPath, "utf-8");
        const config = parseToml(content) as WipConfig;

        if (config.ports?.e2e) {
            return config.ports.e2e;
        }
        if (config.ports?.base) {
            return config.ports.base + 1; // e2e uses base+1 by convention
        }
    } catch {
        // wip.toml not found or invalid - use default
    }
    return DEFAULT_PORT;
}

/**
 * Load wip.toml configuration
 * Returns null if not in a WIP worktree
 */
async function loadWipConfig(): Promise<WipConfig | null> {
    try {
        const wipTomlPath = join(process.cwd(), "..", "wip.toml");
        const content = await readFile(wipTomlPath, "utf-8");
        return parseToml(content) as WipConfig;
    } catch {
        return null;
    }
}

/**
 * Get E2E database path from wip.toml or use default
 * Uses projects.rubigo-react.e2e_database if specified, otherwise default
 */
function getDatabasePath(config: WipConfig | null): string {
    return config?.projects?.["rubigo-react"]?.e2e_database || DEFAULT_E2E_DATABASE;
}

async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function killProcessOnPort(port: number): Promise<void> {
    try {
        // Platform-independent way to find and kill process
        const result = await fetch(`http://localhost:${port}`, { signal: AbortSignal.timeout(1000) });
        // If we get here, something is running on the port
        console.log(`   Found existing process on port ${port}, waiting for it to close...`);
        await sleep(2000);
    } catch {
        // Port is free
    }
}

async function runCommand(command: string, args: string[], env?: Record<string, string>): Promise<number> {
    const proc = spawn({
        cmd: [command, ...args],
        stdout: "inherit",
        stderr: "inherit",
        env: { ...process.env, ...env },
    });

    return await proc.exited;
}

async function startServer(port: number, databasePath: string): Promise<{ proc: Subprocess; logContent: string }> {
    const logFile = Bun.file(LOG_FILE);
    const logWriter = logFile.writer();

    const proc = spawn({
        cmd: ["bun", "--bun", "run", "start"],
        stdout: "pipe",
        stderr: "pipe",
        env: { 
            ...process.env, 
            PORT: String(port), 
            RUBIGO_AUTO_INIT: "true",
            DATABASE_URL: `./${databasePath}`,
        },
    });

    // Collect output for token extraction
    let logContent = "";

    // Read stdout in background
    (async () => {
        const reader = proc.stdout.getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = new TextDecoder().decode(value);
            logContent += text;
            logWriter.write(value);
        }
        logWriter.end();
    })();

    // Read stderr in background
    (async () => {
        const reader = proc.stderr.getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = new TextDecoder().decode(value);
            logContent += text;
            process.stderr.write(value);
        }
    })();

    // Wait for server to start
    await sleep(SERVER_STARTUP_DELAY);

    // Check if server is still running
    if (proc.exitCode !== null) {
        throw new Error(`Server exited with code ${proc.exitCode}`);
    }

    return { proc, logContent };
}

function extractInitToken(logContent: string): string | null {
    // Token format: "INIT TOKEN: word1 word2 word3 word4"
    const match = logContent.match(/INIT TOKEN:\s*(\S+\s+\S+\s+\S+\s+\S+)/);
    return match ? match[1] : null;
}

function extractApiToken(logContent: string): string | null {
    const match = logContent.match(/API Token:\s*(\S+)/);
    return match ? match[1] : null;
}

async function cleanup(proc: Subprocess | null): Promise<void> {
    if (proc) {
        proc.kill();
    }

    try {
        await unlink(LOG_FILE);
    } catch {
        // File may not exist
    }
}

async function main() {
    console.log("========================================");
    console.log("🧪 Rubigo E2E Test Suite");
    console.log("========================================");
    console.log();

    let serverProc: Subprocess | null = null;
    let testExitCode = 0;

    // Load wip config for database path
    const wipConfig = await loadWipConfig();
    const databasePath = getDatabasePath(wipConfig);

    try {
        // Step 1: Delete and recreate database to ensure schema is fresh
        console.log(`📦 Step 1: Resetting database (${databasePath})...`);
        try {
            await unlink(databasePath);
            console.log("   Deleted existing database");
        } catch {
            console.log("   No existing database found");
        }

        // Step 1b: Run migrations to create fresh schema
        console.log("📦 Step 1b: Running migrations...");
        await runCommand("bun", ["run", "db:migrate"], { DATABASE_URL: `./${databasePath}` });
        console.log();

        // Step 2: Build production bundle
        console.log("🏗️  Step 2: Building production bundle...");
        const buildResult = await runCommand("bun", ["run", "build"]);
        if (buildResult !== 0) {
            throw new Error("Build failed");
        }
        console.log();

        // Step 3: Start production server
        const port = await getPort();
        console.log(`🚀 Step 3: Starting production server on port ${port}...`);
        await killProcessOnPort(port);

        console.log(`   Starting server (database: ${databasePath})...`);
        const { proc, logContent } = await startServer(port, databasePath);
        serverProc = proc;

        console.log(`   Server running on http://localhost:${port}`);
        console.log();

        // Step 4: Extract tokens (API token for auto-init, init token for manual init)
        console.log("🔑 Step 4: Extracting tokens...");

        // Wait a bit more and re-read log file for tokens
        await sleep(2000);
        const fullLogContent = await Bun.file(LOG_FILE).text().catch(() => logContent);

        // With RUBIGO_AUTO_INIT=true, we get API Token directly
        const apiToken = extractApiToken(fullLogContent);
        const initToken = extractInitToken(fullLogContent);

        // In auto-init mode, we only need the API token
        if (!apiToken && !initToken) {
            console.log("   Log content for debugging:");
            console.log(fullLogContent.substring(0, 500));
            throw new Error("Failed to extract any tokens from logs");
        }

        if (initToken) {
            console.log(`   Init Token: ${initToken}`);
        }
        if (apiToken) {
            console.log(`   API Token: ${apiToken}`);
        }
        console.log();

        // Step 5: Run Playwright tests
        console.log("🎭 Step 5: Running Playwright E2E tests...");
        console.log();

        testExitCode = await runCommand("bunx", ["playwright", "test", "--reporter=list", ...process.argv.slice(2)], {
            E2E_INIT_TOKEN: initToken || "",
            RUBIGO_API_TOKEN: apiToken || "",
            RUBIGO_API_URL: `http://localhost:${port}`,
            E2E_BASE_URL: `http://localhost:${port}`,
        });

        console.log();

    } catch (error) {
        console.error("❌ Error:", error instanceof Error ? error.message : error);
        testExitCode = 1;
    } finally {
        // Step 6: Cleanup
        console.log("🧹 Step 6: Cleaning up...");
        await cleanup(serverProc);
    }

    // Report results
    console.log();
    console.log("========================================");
    if (testExitCode === 0) {
        console.log("✅ E2E Tests PASSED");
    } else {
        console.log(`❌ E2E Tests FAILED (exit code: ${testExitCode})`);
        console.log();
        console.log("View HTML report: bunx playwright show-report e2e/test-results/html");
    }
    console.log("========================================");

    process.exit(testExitCode);
}

main().catch(error => {
    console.error("Script failed:", error);
    process.exit(1);
});
