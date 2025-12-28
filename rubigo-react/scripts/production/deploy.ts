#!/usr/bin/env bun
/**
 * Unified Deployment Script
 * 
 * Single source of truth for both staging and production deployments.
 * Used by both deploy-react.yml and stage-react.yml workflows.
 * 
 * Usage:
 *   bun run production/deploy.ts <command> [options]
 * 
 * Commands:
 *   validate-env                     Validate environment variables
 *   prepare                          Prepare build/staging directory
 *   sanity-check                     Verify executables and critical files
 *   db-schema                        Apply database schema (idempotent)
 *   install-deps                     Install dependencies
 *   build                            Build the application
 *   start-server                     Start the server in background
 *   health-check                     Check server health
 *   cleanup                          Clean up staging directory
 */

import { $ } from "bun";
import { existsSync, mkdirSync, cpSync, rmSync } from "fs";
import { join, dirname } from "path";

// ============================================================================
// Types
// ============================================================================

interface CommandContext {
    command: string;
    args: string[];
    env: Record<string, string | undefined>;
}

// ============================================================================
// Utility Functions
// ============================================================================

function getArg(args: string[], name: string): string | undefined {
    const index = args.indexOf(`--${name}`);
    if (index !== -1 && index + 1 < args.length) {
        return args[index + 1];
    }
    return undefined;
}

function requireArg(args: string[], name: string): string {
    const value = getArg(args, name);
    if (!value) {
        console.error(`❌ Missing required argument: --${name}`);
        process.exit(1);
    }
    return value;
}

function log(emoji: string, message: string) {
    console.log(`${emoji} ${message}`);
}

function success(message: string) {
    log("✅", message);
}

function fail(message: string): never {
    log("❌", message);
    process.exit(1);
}

// ============================================================================
// Commands
// ============================================================================

async function validateEnv(_ctx: CommandContext): Promise<void> {
    const deployRoot = process.env.RUBIGO_DEPLOY_ROOT;

    if (!deployRoot) {
        fail("RUBIGO_DEPLOY_ROOT environment variable is not set");
    }

    if (!existsSync(deployRoot)) {
        fail(`RUBIGO_DEPLOY_ROOT does not exist: ${deployRoot}`);
    }

    success(`RUBIGO_DEPLOY_ROOT: ${deployRoot}`);
}

async function prepare(ctx: CommandContext): Promise<void> {
    const deployRoot = process.env.RUBIGO_DEPLOY_ROOT!;
    const target = requireArg(ctx.args, "target"); // "staging" or "production"
    const runId = requireArg(ctx.args, "run-id");
    const sourceDir = getArg(ctx.args, "source") || "rubigo-react";

    let baseDir: string;
    let buildDir: string;

    if (target === "staging") {
        baseDir = join(deployRoot, "staging", "rubigo-react", "runs", runId);
        buildDir = join(baseDir, "code");
    } else {
        baseDir = join(deployRoot, "production", "rubigo-react");
        buildDir = join(baseDir, "builds", runId);
    }

    // Create directories
    mkdirSync(join(baseDir, "data"), { recursive: true });
    mkdirSync(join(baseDir, "logs"), { recursive: true });

    if (target === "staging") {
        mkdirSync(buildDir, { recursive: true });
    } else {
        mkdirSync(join(baseDir, "backups"), { recursive: true });
        mkdirSync(buildDir, { recursive: true });
    }

    // Copy source
    if (existsSync(buildDir)) {
        rmSync(buildDir, { recursive: true, force: true });
    }
    cpSync(sourceDir, buildDir, { recursive: true });

    // Create .git marker for Tailwind v4
    mkdirSync(join(buildDir, ".git"), { recursive: true });

    success(`Prepared ${target} directory: ${buildDir}`);

    // Output paths for workflow consumption
    console.log(`BUILD_DIR=${buildDir}`);
    console.log(`BASE_DIR=${baseDir}`);
    console.log(`DATA_DIR=${join(baseDir, "data")}`);
}

async function sanityCheck(ctx: CommandContext): Promise<void> {
    const dir = requireArg(ctx.args, "dir");

    // Check executables
    log("🔍", "Checking required executables...");

    const knownPaths = ["/usr/local/bin", "/home/linuxbrew/.linuxbrew/bin", "/usr/bin"];
    const executables = ["sqlite3", "curl", "jq", "ss"];

    for (const exe of executables) {
        let path = Bun.which(exe);

        // Fallback: check known paths if Bun.which doesn't find it
        if (!path) {
            for (const dir of knownPaths) {
                const fullPath = join(dir, exe);
                if (existsSync(fullPath)) {
                    path = fullPath;
                    break;
                }
            }
        }

        if (path) {
            log("  ✓", `${exe} (${path})`);
        } else {
            fail(`${exe} is not installed or not in PATH`);
        }
    }

    // Check critical files
    log("🔍", "Checking critical files...");

    const files = ["package.json", "bun.lock"];
    for (const file of files) {
        if (!existsSync(join(dir, file))) {
            fail(`Missing ${file}`);
        }
        log("  ✓", file);
    }

    // Check next.config (either .ts or .js)
    if (!existsSync(join(dir, "next.config.ts")) && !existsSync(join(dir, "next.config.js"))) {
        fail("Missing next.config");
    }
    log("  ✓", "next.config");

    success("Sanity check passed");
}

async function dbSchema(ctx: CommandContext): Promise<void> {
    const dir = requireArg(ctx.args, "dir");
    const dbUrl = requireArg(ctx.args, "db-url");

    log("🗄️", "Applying database migrations...");

    // Use db:migrate:bun for proper migration tracking in staging/production
    const result = await $`cd ${dir} && DATABASE_URL=${dbUrl} bun run db:migrate:bun`.nothrow();

    if (result.exitCode !== 0) {
        console.error(result.stderr.toString());
        fail("Database migration failed");
    }

    success("Database migrations applied");
}

async function installDeps(ctx: CommandContext): Promise<void> {
    const dir = requireArg(ctx.args, "dir");

    log("📦", "Installing dependencies...");

    const result = await $`cd ${dir} && bun install --frozen-lockfile`.nothrow();

    if (result.exitCode !== 0) {
        console.error(result.stderr.toString());
        fail("Dependency installation failed");
    }

    success("Dependencies installed");
}

async function build(ctx: CommandContext): Promise<void> {
    const dir = requireArg(ctx.args, "dir");
    const dbUrl = requireArg(ctx.args, "db-url");

    log("🔨", "Building application...");

    const result = await $`cd ${dir} && DATABASE_URL=${dbUrl} bun run build`.nothrow();

    if (result.exitCode !== 0) {
        console.error(result.stderr.toString());
        fail("Build failed");
    }

    success("Build complete");
}

async function startServer(ctx: CommandContext): Promise<void> {
    const dir = requireArg(ctx.args, "dir");
    const port = requireArg(ctx.args, "port");
    const dbUrl = requireArg(ctx.args, "db-url");
    const logsDir = getArg(ctx.args, "logs-dir") || join(dirname(dir), "logs");

    log("🚀", `Starting server on port ${port}...`);

    // Start in background with detached process
    const proc = Bun.spawn(["bun", "run", "start"], {
        cwd: dir,
        detached: true,
        env: {
            ...process.env,
            DATABASE_URL: dbUrl,
            PORT: port,
        },
        stdout: Bun.file(join(logsDir, "stdout.log")),
        stderr: Bun.file(join(logsDir, "stderr.log")),
    });

    // Detach the process so the workflow can continue
    proc.unref();

    success(`Server starting (PID: ${proc.pid})`);
}

async function healthCheck(ctx: CommandContext): Promise<void> {
    const port = requireArg(ctx.args, "port");
    const token = getArg(ctx.args, "token");
    const maxAttempts = parseInt(getArg(ctx.args, "attempts") || "10");

    log("🏥", `Checking health at http://localhost:${port}/api/health`);

    for (let i = 1; i <= maxAttempts; i++) {
        try {
            const headers: Record<string, string> = {};
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            const response = await fetch(`http://localhost:${port}/api/health`, { headers });

            if (response.ok) {
                const data = await response.json() as { status?: string };
                if (data.status === "healthy") {
                    success("Health check passed");
                    console.log(JSON.stringify(data, null, 2));
                    return;
                }
            }
        } catch {
            // Connection not ready yet
        }

        console.log(`  Waiting... (${i}/${maxAttempts})`);
        await Bun.sleep(2000);
    }

    fail("Health check failed");
}

async function cleanup(ctx: CommandContext): Promise<void> {
    const dir = requireArg(ctx.args, "dir");

    if (existsSync(dir)) {
        rmSync(dir, { recursive: true, force: true });
        success(`Cleaned up: ${dir}`);
    } else {
        log("ℹ️", `Directory not found: ${dir}`);
    }
}

async function cloneDb(ctx: CommandContext): Promise<void> {
    const sourceDb = requireArg(ctx.args, "source");
    const targetDb = requireArg(ctx.args, "target");
    const allowFresh = getArg(ctx.args, "allow-fresh") === "true";

    if (existsSync(sourceDb)) {
        log("🗄️", "Cloning database...");
        await $`sqlite3 ${sourceDb} ".backup '${targetDb}'"`;
        success("Database cloned");
    } else if (allowFresh) {
        log("⚠️", "No source database (fresh deployment allowed)");
    } else {
        fail(`Source database not found: ${sourceDb}`);
    }
}

async function backupDb(ctx: CommandContext): Promise<void> {
    const dbPath = requireArg(ctx.args, "db");
    const backupDir = requireArg(ctx.args, "backup-dir");
    const runId = getArg(ctx.args, "run-id") || Date.now().toString();

    if (!existsSync(dbPath)) {
        log("ℹ️", "No database to backup");
        return;
    }

    mkdirSync(backupDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const backupFile = join(backupDir, `rubigo-${runId}-${timestamp}.db`);

    await $`cp ${dbPath} ${backupFile}`;
    success(`Database backed up: ${backupFile}`);

    // Keep last 10 backups
    const result = await $`ls -t ${backupDir}/*.db 2>/dev/null | tail -n +11`.nothrow().text();
    const oldFiles = result.trim().split("\n").filter(Boolean);
    for (const file of oldFiles) {
        rmSync(file, { force: true });
    }
}

/**
 * Stop a server running on a specific port.
 * SAFE: Uses port-based PID lookup to avoid killing unrelated processes.
 * 
 * Root cause of previous bug: pkill -f "bun.*" matched "ubuntu" in GNOME session processes!
 */
async function stopServer(ctx: CommandContext): Promise<void> {
    const port = getArg(ctx.args, "port");

    if (!port) {
        log("⚠️", "No --port specified - skipping server stop");
        return;
    }

    log("🛑", `Looking for process on port ${port}...`);

    // Use lsof to find PID by port (safe, specific)
    const result = await $`lsof -ti:${port} 2>/dev/null || true`.quiet();
    const pids = result.text().trim().split("\n").filter(p => p);

    if (pids.length === 0) {
        log("ℹ️", `No process found on port ${port}`);
        return;
    }

    for (const pid of pids) {
        // Verify the process command before killing
        const psResult = await $`ps -p ${pid} -o comm= 2>/dev/null || true`.quiet();
        const comm = psResult.text().trim();

        if (comm.includes("bun") || comm.includes("node") || comm.includes("next")) {
            // Safe to kill - it's a bun/node/next process
            await $`kill ${pid} 2>/dev/null || true`.quiet();
            success(`Killed server process (PID: ${pid}, cmd: ${comm}) on port ${port}`);
        } else if (comm) {
            log("⚠️", `Process on port ${port} is not bun/node: ${comm} (PID: ${pid}) - NOT killing`);
        }
    }
}

/**
 * Cleanup stale processes from previous staging runs.
 * SAFE: Uses port-based PID lookup for the staging port range.
 */
async function cleanupStale(_ctx: CommandContext): Promise<void> {
    log("🧹", "Cleaning up stale staging processes...");

    // Kill playwright processes by exact name (safe)
    await $`pkill -x "playwright" 2>/dev/null || true`.quiet();

    // Kill processes on staging port range (4530-4630) using safe port-based lookup
    const startPort = 4530;
    const endPort = 4630;
    let killed = 0;

    for (let port = startPort; port <= endPort; port++) {
        const result = await $`lsof -ti:${port} 2>/dev/null || true`.quiet();
        const pids = result.text().trim().split("\n").filter(p => p);

        for (const pid of pids) {
            const psResult = await $`ps -p ${pid} -o comm= 2>/dev/null || true`.quiet();
            const comm = psResult.text().trim();

            if (comm.includes("bun") || comm.includes("node") || comm.includes("next")) {
                await $`kill ${pid} 2>/dev/null || true`.quiet();
                log("  🗑️", `Killed stale process on port ${port} (PID: ${pid}, cmd: ${comm})`);
                killed++;
            }
        }
    }

    if (killed > 0) {
        success(`Cleaned up ${killed} stale process(es)`);
    } else {
        log("ℹ️", "No stale processes found");
    }
}

/**
 * Find an available port in the staging range.
 * Outputs: STAGING_PORT=<port> for workflow consumption.
 */
async function findPort(_ctx: CommandContext): Promise<void> {
    log("🔍", "Finding available port in range 4530-4630...");

    const startPort = 4530;
    const endPort = 4630;

    for (let port = startPort; port <= endPort; port++) {
        const result = await $`ss -tuln | grep -q ":${port} " && echo "used" || echo "free"`.quiet();
        const status = result.text().trim();

        if (status === "free") {
            success(`Found available port: ${port}`);
            // Output for workflow to capture
            console.log(`STAGING_PORT=${port}`);
            return;
        }
    }

    fail("No available port found in range 4530-4630");
}

/**
 * Initialize the staging server and capture the API token.
 * Handles both fresh databases (phrase init) and cloned databases (already initialized).
 */
async function initCaptureToken(ctx: CommandContext): Promise<void> {
    const port = requireArg(ctx.args, "port");
    const logsDir = requireArg(ctx.args, "logs-dir");
    const baseUrl = `http://localhost:${port}`;

    log("🔑", "Initializing and capturing API token...");

    // Wait for server to start
    log("⏳", "Waiting for server...");
    let ready = false;
    for (let i = 1; i <= 15; i++) {
        try {
            const response = await fetch(`${baseUrl}/api/init`);
            if (response.ok) {
                ready = true;
                break;
            }
        } catch {
            // Not ready yet
        }
        console.log(`  Waiting... (${i}/15)`);
        await Bun.sleep(2000);
    }

    if (!ready) {
        fail("Server did not start in time");
    }

    // Check initialization status
    let initResponse: { initialized?: boolean } = {};
    try {
        const response = await fetch(`${baseUrl}/api/init`);
        initResponse = await response.json() as { initialized?: boolean };
    } catch (e) {
        fail(`Failed to check init status: ${e}`);
    }

    let dbInitialized = false;

    if (initResponse.initialized === false) {
        log("🌱", "Fresh database detected - initializing via phrase...");

        // Read init words from server logs
        const stdoutLog = join(logsDir, "stdout.log");
        const logContent = await Bun.file(stdoutLog).text();
        const match = logContent.match(/INIT TOKEN: (.+)/);

        if (!match) {
            console.error("Server log content:");
            console.error(logContent);
            fail("Could not find INIT TOKEN in server logs");
        }

        const initWords = match[1].trim().split(" ");
        log("  📝", `Found init phrase: ${initWords.join(" ")}`);

        // Submit init phrase
        const postResponse = await fetch(`${baseUrl}/api/init`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ words: initWords }),
        });

        const postResult = await postResponse.json() as { success?: boolean };
        if (!postResult.success) {
            fail(`Initialization failed: ${JSON.stringify(postResult)}`);
        }

        success("System initialized successfully");
        dbInitialized = true;
    } else {
        log("ℹ️", "Database already initialized (copied from production)");
        dbInitialized = true;
    }

    // Wait a moment for token to appear in logs
    await Bun.sleep(2000);

    // Capture API token from logs
    const stdoutLog = join(logsDir, "stdout.log");
    const logContent = await Bun.file(stdoutLog).text();
    const tokenMatch = logContent.match(/API Token: ([a-f0-9]+)/);

    if (tokenMatch) {
        const token = tokenMatch[1];
        success(`API token captured (${token.length} chars)`);
        // Output for workflow to capture
        console.log(`STAGING_API_TOKEN=${token}`);
    } else {
        log("⚠️", "Could not capture API token from logs");
    }

    console.log(`DB_INITIALIZED=${dbInitialized}`);
}

/**
 * Generate the staging report JSON file.
 */
async function generateReport(ctx: CommandContext): Promise<void> {
    const baseDir = requireArg(ctx.args, "base-dir");
    const prNumber = requireArg(ctx.args, "pr-number");
    const branch = requireArg(ctx.args, "branch");
    const commit = requireArg(ctx.args, "commit");
    const runId = requireArg(ctx.args, "run-id");
    const port = getArg(ctx.args, "port") || "0";
    const dbInitialized = getArg(ctx.args, "db-initialized") === "true";
    const e2eOutcome = getArg(ctx.args, "e2e-outcome") || "unknown";

    log("📊", "Generating staging report...");

    const report = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        pr_number: parseInt(prNumber),
        branch,
        commit,
        workflow_run_id: parseInt(runId),
        staging_port: parseInt(port),
        db_initialized: dbInitialized,
        passed: e2eOutcome === "success",
        e2e_tests: {
            outcome: e2eOutcome,
        },
    };

    const reportPath = join(baseDir, "staging-report.json");
    await Bun.write(reportPath, JSON.stringify(report, null, 2));

    success(`Staging report generated: ${reportPath}`);
    console.log(JSON.stringify(report, null, 2));
}

/**
 * Copy database files to build directory for isolated Next.js build.
 */
async function copyBuildDb(ctx: CommandContext): Promise<void> {
    const dataDir = requireArg(ctx.args, "data-dir");
    const buildDir = requireArg(ctx.args, "build-dir");

    log("📦", "Copying database for build...");

    const files = ["rubigo.db", "rubigo.db-wal", "rubigo.db-shm"];
    for (const file of files) {
        const src = join(dataDir, file);
        const dest = join(buildDir, file);
        if (existsSync(src)) {
            cpSync(src, dest);
            log("  ✓", file);
        }
    }

    // Output build database path for workflow
    console.log(`BUILD_DB=${join(buildDir, "rubigo.db")}`);
    success("Database copied for build");
}

/**
 * Deploy by swapping symlink and starting service.
 */
async function deploySwap(ctx: CommandContext): Promise<void> {
    const buildDir = requireArg(ctx.args, "build-dir");
    const baseDir = requireArg(ctx.args, "base-dir");

    log("🔄", "Deploying (swap symlink and start service)...");

    // Swap symlink to new build
    const currentLink = join(baseDir, "current");
    await $`ln -sfn ${buildDir} ${currentLink}`;
    log("  ✓", `Symlink: ${currentLink} → ${buildDir}`);

    // Start service via systemd
    await $`systemctl --user start rubigo-react.service`;
    log("  ✓", "Service started");

    // Wait for service to initialize
    await Bun.sleep(3000);

    success(`Deployed: ${buildDir}`);
}

/**
 * Stop the production service gracefully.
 */
async function stopService(_ctx: CommandContext): Promise<void> {
    log("🛑", "Stopping rubigo-react.service...");

    await $`systemctl --user stop rubigo-react.service 2>/dev/null || true`.quiet();

    // Also stop by port in case systemd state is stale
    const result = await $`lsof -ti:4430 2>/dev/null || true`.quiet();
    const pids = result.text().trim().split("\n").filter(p => p);

    for (const pid of pids) {
        const psResult = await $`ps -p ${pid} -o comm= 2>/dev/null || true`.quiet();
        const comm = psResult.text().trim();
        if (comm.includes("bun") || comm.includes("node") || comm.includes("next")) {
            await $`kill ${pid} 2>/dev/null || true`.quiet();
            log("  ✓", `Killed process ${pid} (${comm})`);
        }
    }

    await Bun.sleep(2000);
    success("Service stopped");
}

/**
 * Cleanup old builds, keeping the most recent N.
 */
async function cleanupOldBuilds(ctx: CommandContext): Promise<void> {
    const baseDir = requireArg(ctx.args, "base-dir");
    const keep = parseInt(getArg(ctx.args, "keep") || "3");

    log("🧹", `Cleaning up old builds (keeping ${keep})...`);

    const buildsDir = join(baseDir, "builds");
    if (!existsSync(buildsDir)) {
        log("ℹ️", "No builds directory found");
        return;
    }

    // List builds sorted by modification time (newest first)
    const result = await $`ls -dt ${buildsDir}/*/ 2>/dev/null || true`.quiet();
    const builds = result.text().trim().split("\n").filter(b => b);

    if (builds.length <= keep) {
        log("ℹ️", `Only ${builds.length} builds exist, nothing to cleanup`);
        return;
    }

    // Remove old builds
    const toRemove = builds.slice(keep);
    for (const buildPath of toRemove) {
        rmSync(buildPath, { recursive: true, force: true });
        log("  🗑️", `Removed: ${buildPath}`);
    }

    success(`Cleaned up ${toRemove.length} old build(s), ${keep} remaining`);
}

// ============================================================================
// Main
// ============================================================================

const commands: Record<string, (ctx: CommandContext) => Promise<void>> = {
    "validate-env": validateEnv,
    "prepare": prepare,
    "sanity-check": sanityCheck,
    "cleanup-stale": cleanupStale,
    "find-port": findPort,
    "db-schema": dbSchema,
    "install-deps": installDeps,
    "copy-build-db": copyBuildDb,
    "build": build,
    "stop-service": stopService,
    "start-server": startServer,
    "deploy-swap": deploySwap,
    "init-capture-token": initCaptureToken,
    "stop-server": stopServer,
    "health-check": healthCheck,
    "generate-report": generateReport,
    "cleanup-old-builds": cleanupOldBuilds,
    "cleanup": cleanup,
    "clone-db": cloneDb,
    "backup-db": backupDb,
};

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command || command === "--help" || command === "-h") {
        console.log(`
Unified Deployment Script

Usage:
  bun run production/deploy.ts <command> [options]

Commands:
  validate-env                     Validate RUBIGO_DEPLOY_ROOT
  prepare --target <staging|production> --run-id <id> [--source <dir>]
  sanity-check --dir <path>
  db-schema --dir <path> --db-url <path>
  install-deps --dir <path>
  build --dir <path> --db-url <path>
  start-server --dir <path> --port <port> --db-url <path> [--logs-dir <path>]
  health-check --port <port> [--token <token>] [--attempts <n>]
  cleanup --dir <path>
  clone-db --source <path> --target <path> [--allow-fresh]
  backup-db --db <path> --backup-dir <path> [--run-id <id>]
`);
        process.exit(0);
    }

    const handler = commands[command];
    if (!handler) {
        fail(`Unknown command: ${command}`);
    }

    const ctx: CommandContext = {
        command,
        args: args.slice(1),
        env: process.env as Record<string, string | undefined>,
    };

    await handler(ctx);
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
