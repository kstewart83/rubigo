/**
 * VDI Admin API Routes
 * 
 * Admin-only endpoints for managing VDI infrastructure.
 * Uses subprocess calls to vdi/lib/test.ts for operations.
 * 
 * GET  /api/virtual-desktop/admin - Get VDI status (images, VM state)
 * POST /api/virtual-desktop/admin - Execute VDI commands (start, stop, bake, finalize)
 * 
 * Auth: Requires API token with admin privileges
 */

import { NextRequest, NextResponse } from "next/server";
import { validateApiToken } from "@/lib/initialization";
import { exec } from "child_process";
import { promisify } from "util";
import { existsSync, statSync } from "fs";
import { join } from "path";

const execAsync = promisify(exec);

// Get VDI paths
function getVdiPaths() {
    // rubigo-react is in virtual-desktop/, so go up one level
    const vdiDir = join(process.cwd(), "..", "vdi");
    return {
        imagesDir: join(vdiDir, "images"),
        workImage: join(vdiDir, "images", "ubuntu-desktop.qcow2"),
        goldenImage: join(vdiDir, "images", "ubuntu-desktop-golden.qcow2"),
        backupImage: join(vdiDir, "images", "ubuntu-desktop-backup.qcow2"),
        testScript: join(vdiDir, "lib", "test.ts"),
    };
}

// Format bytes
function formatBytes(bytes: number): string {
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

// Get image info
function getImageInfo(path: string): { exists: boolean; size?: string } {
    if (!existsSync(path)) return { exists: false };
    return { exists: true, size: formatBytes(statSync(path).size) };
}

// Check if VM is running
async function isVmRunning(): Promise<{ running: boolean; pid?: number }> {
    try {
        const { stdout } = await execAsync("pgrep -f ubuntu-desktop");
        const pid = parseInt(stdout.trim().split("\n")[0]);
        return { running: true, pid };
    } catch {
        return { running: false };
    }
}

/**
 * Helper to validate request auth
 * Checks Bearer token first, falls back to X-Persona-Id header
 */
async function validateRequest(request: NextRequest): Promise<{ valid: boolean; actorId?: string; error?: string }> {
    // Try Bearer token first
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") ?? null;

    if (token) {
        const auth = await validateApiToken(token);
        if (auth.valid && auth.actorId) {
            return { valid: true, actorId: auth.actorId };
        }
    }

    // Fall back to X-Persona-Id header (for browser requests)
    const personaId = request.headers.get("X-Persona-Id");
    if (personaId) {
        return { valid: true, actorId: personaId };
    }

    return { valid: false, error: "Unauthorized" };
}

/**
 * GET /api/virtual-desktop/admin
 * Get VDI infrastructure status
 */
export async function GET(request: NextRequest) {
    try {
        // Validate access (accepts Bearer token or X-Persona-Id)
        const auth = await validateRequest(request);
        if (!auth.valid) {
            return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 });
        }

        const paths = getVdiPaths();
        const vmStatus = await isVmRunning();

        return NextResponse.json({
            status: "ok",
            images: {
                work: getImageInfo(paths.workImage),
                golden: getImageInfo(paths.goldenImage),
                backup: getImageInfo(paths.backupImage),
            },
            vm: vmStatus.running ? {
                status: "running",
                pid: vmStatus.pid,
                vncPort: 15901,
                sshPort: 2222,
            } : {
                status: "stopped",
            },
        });
    } catch (error) {
        console.error("[VDI Admin] Error:", error);
        return NextResponse.json(
            { error: "Failed to get VDI status" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/virtual-desktop/admin
 * Execute VDI commands
 * 
 * Body: { action: "start" | "stop" | "start-dev" | "bake" | "finalize" }
 */
export async function POST(request: NextRequest) {
    try {
        // Validate access (accepts Bearer token or X-Persona-Id)
        const auth = await validateRequest(request);
        if (!auth.valid) {
            return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { action } = body;

        if (!action) {
            return NextResponse.json(
                { error: "Action is required" },
                { status: 400 }
            );
        }

        const paths = getVdiPaths();
        const vdiDir = join(process.cwd(), "..", "vdi");

        // Map actions to test.ts commands
        const actionMap: Record<string, string> = {
            "start": "start",
            "start-dev": "start-dev",
            "stop": "stop",
            "bake": "bake",
            "finalize": "finalize",
            "status": "status",
            "test-ssh": "test-ssh",
        };

        const cmd = actionMap[action];
        if (!cmd) {
            return NextResponse.json(
                { error: `Unknown action: ${action}` },
                { status: 400 }
            );
        }

        // Execute via bun
        console.log(`[VDI Admin] Executing: bun run ${paths.testScript} ${cmd}`);

        const { stdout, stderr } = await execAsync(
            `bun run ${paths.testScript} ${cmd}`,
            { cwd: vdiDir, timeout: 120000, shell: "/bin/bash" }
        );

        return NextResponse.json({
            action,
            success: true,
            output: stdout,
            errors: stderr || undefined,
        });
    } catch (error) {
        console.error("[VDI Admin] Error:", error);
        const execError = error as { stdout?: string; stderr?: string; message?: string };
        return NextResponse.json({
            action: "unknown",
            success: false,
            error: execError.message || "Action failed",
            output: execError.stdout || undefined,
            errors: execError.stderr || undefined,
        }, { status: 500 });
    }
}
