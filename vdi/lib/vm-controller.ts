/**
 * VM Controller
 * 
 * Controls QEMU VM lifecycle (start, stop, status).
 * Replaces start-vm.sh functionality.
 */

import { $ } from "bun";
import { existsSync } from "fs";
import { join } from "path";
import type { VdiConfig, VmState } from "./types";

export interface VmOptions {
    /** RAM in MB */
    memoryMb?: number;
    /** Number of CPUs */
    cpus?: number;
    /** Host VNC port (maps to guest 5901) */
    vncPort?: number;
    /** Host SSH port (maps to guest 22) */
    sshPort?: number;
    /** QEMU VNC display number (e.g., ":0" for port 5900) */
    qemuVncDisplay?: string;
    /** Attach cloud-init ISO (for first boot) */
    cloudInitIso?: string;
}

const DEFAULT_OPTIONS: Required<Omit<VmOptions, "cloudInitIso">> = {
    memoryMb: 4096,
    cpus: 2,
    vncPort: 15901,
    sshPort: 2222,
    qemuVncDisplay: ":0",
};

/**
 * Start a VM from an image
 */
export async function startVm(
    config: VdiConfig,
    imagePath: string,
    options: VmOptions = {}
): Promise<VmState> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    if (!existsSync(imagePath)) {
        throw new Error(`Image not found: ${imagePath}`);
    }

    // Check if already running
    if (await isVmRunning("ubuntu-desktop")) {
        throw new Error("A VM is already running. Stop it first with stopVm()");
    }

    console.log(`[VmController] Starting VM from ${imagePath}...`);

    // Build QEMU command
    let qemuCmd = `qemu-system-x86_64 \\
        -enable-kvm \\
        -cpu host \\
        -m ${opts.memoryMb} \\
        -smp ${opts.cpus} \\
        -drive file=${imagePath},format=qcow2 \\
        -vnc ${opts.qemuVncDisplay} \\
        -nic user,hostfwd=tcp::${opts.vncPort}-:5901,hostfwd=tcp::${opts.sshPort}-:22`;

    // Add cloud-init ISO if specified
    if (opts.cloudInitIso && existsSync(opts.cloudInitIso)) {
        qemuCmd += ` -cdrom ${opts.cloudInitIso} -vga std`;
    }

    // Run in background using nohup
    await $`bash -c ${`nohup ${qemuCmd} > /dev/null 2>&1 &`}`;

    // Wait for process to start
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Verify it started
    if (!(await isVmRunning("ubuntu-desktop"))) {
        throw new Error("Failed to start QEMU - process not running");
    }

    // Get PID
    let pid: number | null = null;
    try {
        const result = await $`pgrep -f ubuntu-desktop`.quiet();
        pid = parseInt(result.stdout.toString().trim().split("\n")[0]);
    } catch {
        // Ignore
    }

    console.log(`[VmController] VM started (PID: ${pid})`);
    console.log(`  QEMU Console: localhost:5900`);
    console.log(`  LXQt Desktop: localhost:${opts.vncPort} (password: rubigo)`);
    console.log(`  SSH: ssh -p ${opts.sshPort} rubigo@localhost`);

    return {
        id: "primary",
        name: "Rubigo Desktop",
        status: "running",
        vncPort: opts.vncPort,
        sshPort: opts.sshPort,
        pid,
    };
}

/**
 * Start VM in bake mode (with cloud-init ISO)
 */
export async function startVmBakeMode(
    config: VdiConfig,
    templateName: string = "ubuntu-desktop",
    options: VmOptions = {}
): Promise<VmState> {
    const imagePath = join(config.imagesDir, `${templateName}.qcow2`);
    const cloudInitIso = join(config.workDir, "cloud-init.iso");

    return startVm(config, imagePath, {
        ...options,
        cloudInitIso: existsSync(cloudInitIso) ? cloudInitIso : undefined,
    });
}

/**
 * Start VM from golden image (production mode)
 */
export async function startVmFromGolden(
    config: VdiConfig,
    templateName: string = "ubuntu-desktop",
    options: VmOptions = {}
): Promise<VmState> {
    const imagePath = join(config.imagesDir, `${templateName}-golden.qcow2`);

    if (!existsSync(imagePath)) {
        throw new Error(
            `Golden image not found: ${imagePath}\n` +
            "Run the full workflow: buildTemplate → startVmBakeMode → bakeImage → finalizeImage"
        );
    }

    return startVm(config, imagePath, options);
}

/**
 * Start VM from work image (development mode)
 */
export async function startVmDevMode(
    config: VdiConfig,
    templateName: string = "ubuntu-desktop",
    options: VmOptions = {}
): Promise<VmState> {
    const imagePath = join(config.imagesDir, `${templateName}.qcow2`);
    return startVm(config, imagePath, options);
}

/**
 * Stop a running VM gracefully
 */
export async function stopVm(graceful: boolean = true): Promise<void> {
    console.log("[VmController] Stopping VM...");

    try {
        if (graceful) {
            // Try graceful shutdown via SSH first
            await $`ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=5 -p 2222 rubigo@localhost 'sudo shutdown -h now'`.quiet();

            // Wait for shutdown
            for (let i = 0; i < 15; i++) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                if (!(await isVmRunning("ubuntu-desktop"))) {
                    console.log("[VmController] VM stopped gracefully");
                    return;
                }
            }
        }

        // Force kill
        console.log("[VmController] Force stopping VM...");
        await $`pkill -f ubuntu-desktop`.quiet();

        await new Promise((resolve) => setTimeout(resolve, 2000));
        console.log("[VmController] VM stopped");
    } catch {
        console.log("[VmController] VM was not running or already stopped");
    }
}

/**
 * Check if a VM is running
 */
export async function isVmRunning(imagePattern: string = "ubuntu-desktop"): Promise<boolean> {
    try {
        const result = await $`pgrep -f ${imagePattern}`.quiet();
        return result.exitCode === 0;
    } catch {
        return false;
    }
}

/**
 * Get current VM status
 */
export async function getVmStatus(): Promise<VmState | null> {
    const running = await isVmRunning("ubuntu-desktop");

    if (!running) {
        return null;
    }

    // Try to get PID
    let pid: number | null = null;
    try {
        const result = await $`pgrep -f ubuntu-desktop`.quiet();
        pid = parseInt(result.stdout.toString().trim().split("\n")[0]);
    } catch {
        // Ignore
    }

    return {
        id: "primary",
        name: "Rubigo Desktop",
        status: "running",
        vncPort: 15901,
        sshPort: 2222,
        pid,
    };
}

/**
 * Wait for VM to be ready (SSH accessible)
 */
export async function waitForVmReady(
    maxWaitSeconds: number = 120,
    sshPort: number = 2222
): Promise<boolean> {
    console.log("[VmController] Waiting for VM to be ready...");

    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitSeconds * 1000) {
        try {
            const result = await $`ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=5 -p ${sshPort} rubigo@localhost 'echo ready'`.quiet();

            if (result.stdout.toString().includes("ready")) {
                console.log("[VmController] VM is ready!");
                return true;
            }
        } catch {
            // Not ready yet
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    console.log("[VmController] Timed out waiting for VM");
    return false;
}
