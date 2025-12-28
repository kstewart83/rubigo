/**
 * E2E Global Setup
 * 
 * Runs ONCE before all tests to:
 * 1. Run migrations on E2E database
 * 2. Start a dev server on E2E_PORT
 * 3. Initialize the system via /api/init
 * 
 * Port resolution order:
 * 1. .env file E2E_PORT (WIP workflow creates this from wip.toml)
 * 2. E2E_PORT env var (for CI/staging)
 * 3. Fail if neither is set
 * 
 * Note: This runs in Node.js (not Bun) via Playwright
 */
import { spawn, type ChildProcess } from "child_process";
import * as fs from "fs";
import * as path from "path";
import type { FullConfig } from "@playwright/test";

// Get E2E port from .env file or env var
function getE2EPort(): string {
    // 1. Try .env file (Playwright doesn't auto-load it like Next.js)
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
        try {
            const content = fs.readFileSync(envPath, "utf-8");
            const match = content.match(/^E2E_PORT\s*=\s*(\d+)/m);
            if (match) {
                console.log(`   Found .env file, using E2E port: ${match[1]}`);
                return match[1];
            }
        } catch (e) {
            // Ignore read errors
        }
    }

    // 2. Fallback to E2E_PORT env var (for CI/staging)
    if (process.env.E2E_PORT) {
        console.log(`   Using E2E_PORT env var: ${process.env.E2E_PORT}`);
        return process.env.E2E_PORT;
    }

    // 3. Fail
    throw new Error(
        "E2E_PORT not configured. Either:\n" +
        "  - Add E2E_PORT=<port> to .env file\n" +
        "  - Set E2E_PORT environment variable"
    );
}

const STARTUP_TIMEOUT = 60_000; // 60 seconds
const HEALTH_CHECK_INTERVAL = 500;

let serverProcess: ChildProcess | null = null;
let capturedToken: string | null = null;

// Cleanup function to kill server on exit (Ctrl+C or normal exit)
function cleanupServer() {
    if (serverProcess && !serverProcess.killed) {
        console.log("\n🧹 Cleaning up server process...");
        try {
            // Kill the entire process group (negative PID)
            process.kill(-serverProcess.pid!, "SIGTERM");
        } catch {
            try {
                serverProcess.kill("SIGTERM");
            } catch {
                // Ignore if already dead
            }
        }
        serverProcess = null;
    }
}

// Register cleanup handlers for interruption (Ctrl+C) and termination
process.on("SIGINT", () => {
    cleanupServer();
    process.exit(130); // 128 + SIGINT(2)
});

process.on("SIGTERM", () => {
    cleanupServer();
    process.exit(143); // 128 + SIGTERM(15)
});

process.on("exit", () => {
    cleanupServer();
});

async function checkServer(url: string): Promise<boolean> {
    try {
        const headers: Record<string, string> = {};
        if (capturedToken) {
            headers["Authorization"] = `Bearer ${capturedToken}`;
        }
        const response = await fetch(`${url}/api/health`, {
            headers,
            signal: AbortSignal.timeout(2000)
        });
        return response.ok;
    } catch {
        return false;
    }
}

async function waitForServer(url: string, timeout: number): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        if (await checkServer(url)) {
            return;
        }
        await new Promise(resolve => setTimeout(resolve, HEALTH_CHECK_INTERVAL));
    }
    throw new Error(`Server did not become ready within ${timeout}ms`);
}

export default async function globalSetup(config: FullConfig) {
    console.log("🔧 E2E Global Setup starting...");

    // REUSE MODE: If RUBIGO_API_URL and RUBIGO_API_TOKEN are already set (CI/staging),
    // skip server startup and just verify the server is healthy
    if (process.env.RUBIGO_API_URL && process.env.RUBIGO_API_TOKEN) {
        const baseUrl = process.env.RUBIGO_API_URL;
        capturedToken = process.env.RUBIGO_API_TOKEN;

        console.log(`   🔄 Reuse mode: Server already running at ${baseUrl}`);
        console.log(`   Using provided API token (${capturedToken.length} chars)`);

        // Verify health check passes
        const healthy = await checkServer(baseUrl);
        if (!healthy) {
            throw new Error(`Health check failed for ${baseUrl}/api/health`);
        }
        console.log("   ✅ Health check passed");

        // Set E2E_BASE_URL for tests
        process.env.E2E_BASE_URL = baseUrl;

        console.log("✅ E2E Global Setup complete (reuse mode)");
        return;
    }

    // STARTUP MODE: Start our own server
    console.log("   📦 Startup mode: Starting fresh server...");

    // Get port from .env file or E2E_PORT env var
    const e2ePort = getE2EPort();
    const baseUrl = `http://localhost:${e2ePort}`;
    console.log(`   Target: ${baseUrl}`);

    // 1. Check if server already running (for dev mode)
    const serverRunning = await checkServer(baseUrl);

    if (serverRunning) {
        console.log("   Server already running, reusing...");
    } else {
        // 1. Kill any existing process on the E2E port
        const { execSync } = await import("child_process");
        try {
            // Check what's on the port and kill it
            const result = execSync(`lsof -ti:${e2ePort}`, { encoding: "utf-8" }).trim();
            if (result) {
                const pids = result.split("\n");
                console.log(`   Found ${pids.length} process(es) on port ${e2ePort}, cleaning up...`);
                for (const pid of pids) {
                    try {
                        // Get process name for logging
                        const processName = execSync(`ps -p ${pid} -o comm=`, { encoding: "utf-8" }).trim();
                        console.log(`   Killing ${processName} (PID: ${pid})`);
                        execSync(`kill -9 ${pid}`, { encoding: "utf-8" });
                    } catch {
                        // Process may have already exited
                    }
                }
                // Wait a moment for port to be released
                await new Promise(r => setTimeout(r, 1000));
            }
        } catch {
            // lsof returns non-zero if no process found - that's fine
        }

        // 2. Apply migrations to E2E database first
        console.log("   Applying migrations to E2E database...");
        try {
            execSync("bun run db:migrate:bun", {
                cwd: process.cwd(),
                env: {
                    ...process.env,
                    DATABASE_URL: "./rubigo-e2e.db",
                },
                stdio: "inherit",
            });
            console.log("   Migrations applied.");
        } catch (e) {
            console.log("   Migration error (may be ok if already applied):", (e as Error).message);
        }

        console.log("   Starting E2E server...");

        // 3. Start server with dedicated E2E database
        serverProcess = spawn("bun", ["run", "dev"], {
            cwd: process.cwd(),
            env: {
                ...process.env,
                PORT: e2ePort,
                DATABASE_URL: "./rubigo-e2e.db",
                RUBIGO_AUTO_INIT: "true",
            },
            stdio: ["ignore", "pipe", "inherit"],
            detached: true,
        });

        // Listen for API TOKEN in stdout
        if (serverProcess.stdout) {
            serverProcess.stdout.on("data", (data: Buffer) => {
                const output = data.toString();
                // Echo server output
                process.stdout.write(output);
                // Look for API TOKEN pattern
                const tokenMatch = output.match(/API TOKEN:\s*([a-f0-9]+)/i);
                if (tokenMatch && !capturedToken) {
                    capturedToken = tokenMatch[1];
                    console.log(`   ✅ Captured API token (${capturedToken.length} chars)`);
                    // Export for tests
                    process.env.RUBIGO_API_TOKEN = capturedToken;
                    // Write to file for API tests in separate processes
                    const authDir = path.join(process.cwd(), ".auth");
                    if (!fs.existsSync(authDir)) {
                        fs.mkdirSync(authDir, { recursive: true });
                    }
                    fs.writeFileSync(path.join(authDir, "api-token.txt"), capturedToken);
                }
            });
        }

        // Mark that we started the server
        process.env.E2E_STARTED_SERVER = "true";
        process.env.E2E_SERVER_PID = String(serverProcess.pid);

        // 4. Wait for server to be ready (will use captured token for health check)
        console.log("   Waiting for server to be ready...");
        await waitForServer(baseUrl, STARTUP_TIMEOUT);
        console.log("   Server ready!");
    }

    // 4. Check initialization status
    const initResponse = await fetch(`${baseUrl}/api/init`);
    const initData = await initResponse.json() as { initialized: boolean };

    if (initData.initialized) {
        console.log("   System already initialized");
    } else {
        console.log("   System needs initialization (should auto-init)...");
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Export environment variables for tests
    process.env.E2E_BASE_URL = baseUrl;
    process.env.RUBIGO_API_URL = baseUrl;

    console.log("✅ E2E Global Setup complete");
}
