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

// Ensure Bun shell inherits process.env (including PATH from GitHub Actions)
$.env(process.env);

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

    // Check executables using Bun.which (uses process.env.PATH)
    log("🔍", "Checking required executables...");

    const executables = ["sqlite3", "curl", "jq", "ss"];
    for (const exe of executables) {
        const path = Bun.which(exe);
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

    log("🗄️", "Applying database schema...");

    // Use db:push --force for idempotent schema application
    // This is safe on existing tables and doesn't require migration tracking
    const result = await $`cd ${dir} && DATABASE_URL=${dbUrl} bun run db:push --force`.nothrow();

    if (result.exitCode !== 0) {
        console.error(result.stderr.toString());
        fail("Database schema application failed");
    }

    success("Database schema applied");
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

    // Start in background
    const proc = Bun.spawn(["bun", "run", "start"], {
        cwd: dir,
        env: {
            ...process.env,
            DATABASE_URL: dbUrl,
            PORT: port,
        },
        stdout: Bun.file(join(logsDir, "stdout.log")),
        stderr: Bun.file(join(logsDir, "stderr.log")),
    });

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

// ============================================================================
// Main
// ============================================================================

const commands: Record<string, (ctx: CommandContext) => Promise<void>> = {
    "validate-env": validateEnv,
    "prepare": prepare,
    "sanity-check": sanityCheck,
    "db-schema": dbSchema,
    "install-deps": installDeps,
    "build": build,
    "start-server": startServer,
    "health-check": healthCheck,
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
