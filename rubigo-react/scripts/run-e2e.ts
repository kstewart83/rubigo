/**
 * E2E Test Runner for Rubigo
 * Runs the full end-to-end test suite
 * 
 * Usage: bun run scripts/run-e2e.ts
 */

import { spawn, type Subprocess } from "bun";
import { unlink } from "fs/promises";

const LOG_FILE = ".e2e-server.log";
const PORT = 3100;
const SERVER_STARTUP_DELAY = 8000;

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

async function startServer(): Promise<{ proc: Subprocess; logContent: string }> {
    const logFile = Bun.file(LOG_FILE);
    const logWriter = logFile.writer();

    const proc = spawn({
        cmd: ["bun", "--bun", "run", "start"],
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, PORT: String(PORT) },
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
    const match = logContent.match(/INIT TOKEN:\s*(\S+)/);
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

    try {
        // Step 1: Clean database
        console.log("📦 Step 1: Cleaning database...");
        await runCommand("bun", ["run", "db:clean"]);
        console.log();

        // Step 2: Build production bundle
        console.log("🏗️  Step 2: Building production bundle...");
        const buildResult = await runCommand("bun", ["run", "build"]);
        if (buildResult !== 0) {
            throw new Error("Build failed");
        }
        console.log();

        // Step 3: Start production server
        console.log("🚀 Step 3: Starting production server...");
        await killProcessOnPort(PORT);

        console.log("   Starting server...");
        const { proc, logContent } = await startServer();
        serverProc = proc;

        console.log(`   Server running on http://localhost:${PORT}`);
        console.log();

        // Step 4: Extract initialization token
        console.log("🔑 Step 4: Extracting initialization token...");

        // Wait a bit more and re-read log file for token
        await sleep(2000);
        const fullLogContent = await Bun.file(LOG_FILE).text().catch(() => logContent);
        const initToken = extractInitToken(fullLogContent);

        if (!initToken) {
            console.log("   Log content for debugging:");
            console.log(fullLogContent.substring(0, 500));
            throw new Error("Failed to extract init token from logs");
        }

        console.log(`   Token: ${initToken}`);
        console.log();

        // Step 5: Run Playwright tests
        console.log("🎭 Step 5: Running Playwright E2E tests...");
        console.log();

        testExitCode = await runCommand("bunx", ["playwright", "test", "--reporter=list"], {
            E2E_INIT_TOKEN: initToken,
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
