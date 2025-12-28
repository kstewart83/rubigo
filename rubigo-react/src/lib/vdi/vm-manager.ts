/**
 * VM Process Manager
 *
 * Manages Cloud Hypervisor VM processes:
 * - Spawning VMs from templates
 * - Process lifecycle (start, stop, kill)
 * - Unix socket communication
 * - State tracking
 */

import { spawn, ChildProcess } from "child_process";
import { existsSync, mkdirSync } from "fs";
import { writeFile, readFile, unlink, copyFile } from "fs/promises";
import { join } from "path";
import { getCloudHypervisorPath, ensureCloudHypervisor } from "./cloud-hypervisor";

// Configuration
const VMS_DIR = process.env.VDI_VMS_DIR || join(process.cwd(), ".vdi", "vms");
const IMAGES_DIR = process.env.VDI_IMAGES_DIR || join(process.cwd(), ".vdi", "images");
const STATE_FILE = join(VMS_DIR, "state.json");

// In-memory process tracking
const runningProcesses = new Map<string, ChildProcess>();
let nextVncPort = 5901;

export interface VmConfig {
    id: string;
    name: string;
    template: string;
    cpus: number;
    memoryMb: number;
    diskPath: string;
    socketPath: string;
    vncPort: number;
}

export interface VmState {
    vms: Record<string, VmConfig>;
    nextVncPort: number;
}

/**
 * Ensure directories exist
 */
function ensureDirs(): void {
    if (!existsSync(VMS_DIR)) mkdirSync(VMS_DIR, { recursive: true });
    if (!existsSync(IMAGES_DIR)) mkdirSync(IMAGES_DIR, { recursive: true });
}

/**
 * Load VM state from disk
 */
async function loadState(): Promise<VmState> {
    try {
        const data = await readFile(STATE_FILE, "utf-8");
        const state = JSON.parse(data);
        nextVncPort = state.nextVncPort || 5901;
        return state;
    } catch {
        return { vms: {}, nextVncPort: 5901 };
    }
}

/**
 * Save VM state to disk
 */
async function saveState(state: VmState): Promise<void> {
    await writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

/**
 * Get template disk image path
 */
function getTemplateImage(template: string): string {
    const imageName = `${template}.qcow2`;
    return join(IMAGES_DIR, imageName);
}

/**
 * Allocate a VNC port
 */
function allocateVncPort(): number {
    return nextVncPort++;
}

/**
 * Create a VM from template
 */
export async function createVm(
    id: string,
    name: string,
    template: string
): Promise<VmConfig> {
    ensureDirs();

    const templateImage = getTemplateImage(template);
    if (!existsSync(templateImage)) {
        throw new Error(`Template image not found: ${templateImage}`);
    }

    // Template configs
    const templates: Record<string, { cpus: number; memoryMb: number }> = {
        "ubuntu-desktop": { cpus: 2, memoryMb: 2048 },
        "ubuntu-server": { cpus: 2, memoryMb: 1024 },
        "windows-11": { cpus: 4, memoryMb: 4096 },
    };

    const tmpl = templates[template];
    if (!tmpl) {
        throw new Error(`Unknown template: ${template}`);
    }

    const vmDir = join(VMS_DIR, id);
    mkdirSync(vmDir, { recursive: true });

    const diskPath = join(vmDir, "disk.qcow2");
    const socketPath = join(vmDir, "api.sock");

    // Copy template image (COW would be better but this works)
    await copyFile(templateImage, diskPath);

    const config: VmConfig = {
        id,
        name,
        template,
        cpus: tmpl.cpus,
        memoryMb: tmpl.memoryMb,
        diskPath,
        socketPath,
        vncPort: allocateVncPort(),
    };

    // Save to state
    const state = await loadState();
    state.vms[id] = config;
    state.nextVncPort = nextVncPort;
    await saveState(state);

    return config;
}

/**
 * Start a VM
 */
export async function startVm(id: string): Promise<void> {
    const state = await loadState();
    const config = state.vms[id];

    if (!config) {
        throw new Error(`VM not found: ${id}`);
    }

    if (runningProcesses.has(id)) {
        throw new Error(`VM ${id} is already running`);
    }

    // Ensure Cloud Hypervisor is installed
    const chPath = await ensureCloudHypervisor();

    console.log(`[VM] Starting VM ${id} (${config.name})...`);

    // Build command arguments
    const args = [
        "--api-socket", config.socketPath,
        "--cpus", `boot=${config.cpus}`,
        "--memory", `size=${config.memoryMb}M`,
        "--disk", `path=${config.diskPath}`,
        "--net", "tap=,mac=,ip=,mask=",
        "--serial", "tty",
        "--console", "off",
    ];

    const proc = spawn(chPath, args, {
        detached: true,
        stdio: ["ignore", "pipe", "pipe"],
    });

    proc.stdout?.on("data", (data) => {
        console.log(`[VM ${id}] ${data}`);
    });

    proc.stderr?.on("data", (data) => {
        console.error(`[VM ${id}] ${data}`);
    });

    proc.on("exit", (code) => {
        console.log(`[VM ${id}] Exited with code ${code}`);
        runningProcesses.delete(id);
    });

    proc.on("error", (err) => {
        console.error(`[VM ${id}] Error:`, err);
        runningProcesses.delete(id);
    });

    runningProcesses.set(id, proc);

    // Wait a moment for startup
    await new Promise((resolve) => setTimeout(resolve, 500));
}

/**
 * Stop a VM gracefully
 */
export async function stopVm(id: string): Promise<void> {
    const proc = runningProcesses.get(id);

    if (!proc) {
        console.log(`[VM] VM ${id} is not running`);
        return;
    }

    console.log(`[VM] Stopping VM ${id}...`);

    // Send SIGTERM for graceful shutdown
    proc.kill("SIGTERM");

    // Wait for exit
    await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
            // Force kill if needed
            proc.kill("SIGKILL");
            resolve();
        }, 10000);

        proc.once("exit", () => {
            clearTimeout(timeout);
            resolve();
        });
    });

    runningProcesses.delete(id);
}

/**
 * Destroy a VM (stop and delete)
 */
export async function destroyVm(id: string): Promise<void> {
    // Stop if running
    await stopVm(id);

    const state = await loadState();
    const config = state.vms[id];

    if (!config) {
        return;
    }

    // Delete VM directory
    const vmDir = join(VMS_DIR, id);
    if (existsSync(vmDir)) {
        const { rm } = await import("fs/promises");
        await rm(vmDir, { recursive: true, force: true });
    }

    // Remove from state
    delete state.vms[id];
    await saveState(state);
}

/**
 * Get VM status
 */
export function getVmStatus(id: string): "running" | "stopped" {
    return runningProcesses.has(id) ? "running" : "stopped";
}

/**
 * List all VMs
 */
export async function listVms(): Promise<VmConfig[]> {
    const state = await loadState();
    return Object.values(state.vms);
}

/**
 * Get VM by ID
 */
export async function getVm(id: string): Promise<VmConfig | null> {
    const state = await loadState();
    return state.vms[id] || null;
}

/**
 * Check if VM process is actually running (reconcile state)
 */
export function isVmRunning(id: string): boolean {
    const proc = runningProcesses.get(id);
    if (!proc) return false;

    // Check if process is still alive
    try {
        process.kill(proc.pid!, 0);
        return true;
    } catch {
        runningProcesses.delete(id);
        return false;
    }
}
