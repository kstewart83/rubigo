/**
 * Virtual Desktop Server Actions
 *
 * Server-side functions for managing virtual desktops.
 * Uses inline VM management (no separate ch-manager service).
 * 
 * Set VDI_MOCK_MODE=true to use mock mode with existing test VM.
 */

"use server";

import { db } from "@/db";
import { virtualDesktops } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import {
    createVm,
    startVm,
    stopVm,
    destroyVm,
    getVm,
    getVmStatus,
} from "@/lib/vdi";
import type {
    VirtualDesktop,
    DesktopStatus,
    DesktopTemplate,
    DesktopConnection,
    DesktopTemplateInfo,
} from "@/types/virtual-desktop";

// Guacamole daemon URL
const GUACD_HOST = process.env.GUACD_HOST || "localhost";
const GUACD_PORT = process.env.GUACD_PORT || "4822";

// VNC host from guacd's perspective (Docker uses host.docker.internal to reach host)
const VNC_HOST = process.env.VNC_HOST || "host.docker.internal";

// Mock mode: skip real VM provisioning, use existing test VM
const MOCK_MODE = process.env.VDI_MOCK_MODE === "true";
const MOCK_VNC_PORT = parseInt(process.env.VDI_MOCK_VNC_PORT || "15901");

/**
 * Generate a unique ID for new desktops
 */
function generateId(): string {
    return crypto.randomUUID();
}

/**
 * Get current ISO timestamp
 */
function now(): string {
    return new Date().toISOString();
}

/**
 * List available desktop templates
 */
export async function listTemplates(): Promise<DesktopTemplateInfo[]> {
    return [
        {
            id: "ubuntu-desktop",
            name: "Ubuntu Desktop",
            description: "Ubuntu 24.04 with XFCE desktop environment",
            cpus: 2,
            memoryMb: 2048,
            os: "linux",
        },
        {
            id: "ubuntu-server",
            name: "Ubuntu Server",
            description: "Ubuntu 24.04 Server (command-line only)",
            cpus: 2,
            memoryMb: 1024,
            os: "linux",
        },
        {
            id: "windows-11",
            name: "Windows 11",
            description: "Windows 11 Enterprise (requires license)",
            cpus: 4,
            memoryMb: 4096,
            os: "windows",
        },
    ];
}

/**
 * List desktops for the current user
 */
export async function listDesktops(userId: string): Promise<VirtualDesktop[]> {
    const results = await db
        .select()
        .from(virtualDesktops)
        .where(eq(virtualDesktops.userId, userId))
        .orderBy(desc(virtualDesktops.createdAt));

    // Reconcile status with actual VM state
    return results.map((row) => {
        const vmStatus = row.vmId ? getVmStatus(row.vmId) : "stopped";
        const status: DesktopStatus = vmStatus === "running" ? "running" : (row.status as DesktopStatus);

        return {
            id: row.id,
            userId: row.userId,
            name: row.name,
            template: row.template as DesktopTemplate,
            status,
            vncPort: row.vncPort ?? undefined,
            createdAt: row.createdAt,
            lastAccessedAt: row.lastAccessedAt ?? undefined,
        };
    });
}

/**
 * Get a single desktop by ID
 */
export async function getDesktop(
    userId: string,
    desktopId: string
): Promise<VirtualDesktop | null> {
    const results = await db
        .select()
        .from(virtualDesktops)
        .where(
            and(eq(virtualDesktops.id, desktopId), eq(virtualDesktops.userId, userId))
        );

    if (results.length === 0) {
        return null;
    }

    const row = results[0];
    const vmStatus = row.vmId ? getVmStatus(row.vmId) : "stopped";

    return {
        id: row.id,
        userId: row.userId,
        name: row.name,
        template: row.template as DesktopTemplate,
        status: vmStatus === "running" ? "running" : (row.status as DesktopStatus),
        vncPort: row.vncPort ?? undefined,
        createdAt: row.createdAt,
        lastAccessedAt: row.lastAccessedAt ?? undefined,
    };
}

/**
 * Create a new desktop
 */
export async function createDesktop(
    userId: string,
    name: string,
    template: DesktopTemplate
): Promise<VirtualDesktop> {
    const id = generateId();
    const timestamp = now();

    // MOCK MODE: Skip real VM creation
    if (MOCK_MODE) {
        console.log(`[VDI Mock] Creating mock desktop: ${name}`);

        await db.insert(virtualDesktops).values({
            id,
            userId,
            name,
            template,
            status: "stopped",
            vmId: `mock-${id}`,
            vncPort: MOCK_VNC_PORT,
            createdAt: timestamp,
        });

        return {
            id,
            userId,
            name,
            template,
            status: "stopped",
            vncPort: MOCK_VNC_PORT,
            createdAt: timestamp,
        };
    }

    // Create in database first with 'creating' status
    await db.insert(virtualDesktops).values({
        id,
        userId,
        name,
        template,
        status: "creating",
        createdAt: timestamp,
    });

    try {
        // Create VM using inline manager
        const vmConfig = await createVm(id, name, template);

        // Update database with VM info
        await db
            .update(virtualDesktops)
            .set({
                vmId: vmConfig.id,
                vncPort: vmConfig.vncPort,
                status: "stopped",
            })
            .where(eq(virtualDesktops.id, id));

        return {
            id,
            userId,
            name,
            template,
            status: "stopped",
            vncPort: vmConfig.vncPort,
            createdAt: timestamp,
        };
    } catch (error) {
        // Mark as error on failure
        await db
            .update(virtualDesktops)
            .set({ status: "error" })
            .where(eq(virtualDesktops.id, id));

        throw error;
    }
}

/**
 * Start a desktop
 */
export async function startDesktop(
    userId: string,
    desktopId: string
): Promise<VirtualDesktop> {
    const desktop = await getDesktop(userId, desktopId);
    if (!desktop) {
        throw new Error("Desktop not found");
    }

    // MOCK MODE: Just update status without starting real VM
    if (MOCK_MODE) {
        console.log(`[VDI Mock] Starting mock desktop: ${desktopId}`);
        await db
            .update(virtualDesktops)
            .set({ status: "running", lastAccessedAt: now() })
            .where(eq(virtualDesktops.id, desktopId));
        return { ...desktop, status: "running" };
    }

    // Get VM ID from database
    const results = await db
        .select({ vmId: virtualDesktops.vmId })
        .from(virtualDesktops)
        .where(eq(virtualDesktops.id, desktopId));

    const vmId = results[0]?.vmId;
    if (!vmId) {
        throw new Error("Desktop has no associated VM");
    }

    // Update status to starting
    await db
        .update(virtualDesktops)
        .set({ status: "starting" })
        .where(eq(virtualDesktops.id, desktopId));

    try {
        // Start VM process
        await startVm(vmId);

        // Update status to running
        await db
            .update(virtualDesktops)
            .set({ status: "running", lastAccessedAt: now() })
            .where(eq(virtualDesktops.id, desktopId));

        return { ...desktop, status: "running" };
    } catch (error) {
        await db
            .update(virtualDesktops)
            .set({ status: "error" })
            .where(eq(virtualDesktops.id, desktopId));

        throw error;
    }
}

/**
 * Stop a desktop
 */
export async function stopDesktop(
    userId: string,
    desktopId: string
): Promise<VirtualDesktop> {
    const desktop = await getDesktop(userId, desktopId);
    if (!desktop) {
        throw new Error("Desktop not found");
    }

    // MOCK MODE: Just update status without stopping real VM
    if (MOCK_MODE) {
        console.log(`[VDI Mock] Stopping mock desktop: ${desktopId}`);
        await db
            .update(virtualDesktops)
            .set({ status: "stopped" })
            .where(eq(virtualDesktops.id, desktopId));
        return { ...desktop, status: "stopped" };
    }

    const results = await db
        .select({ vmId: virtualDesktops.vmId })
        .from(virtualDesktops)
        .where(eq(virtualDesktops.id, desktopId));

    const vmId = results[0]?.vmId;
    if (!vmId) {
        throw new Error("Desktop has no associated VM");
    }

    // Update status to stopping
    await db
        .update(virtualDesktops)
        .set({ status: "stopping" })
        .where(eq(virtualDesktops.id, desktopId));

    try {
        // Stop VM process
        await stopVm(vmId);

        await db
            .update(virtualDesktops)
            .set({ status: "stopped" })
            .where(eq(virtualDesktops.id, desktopId));

        return { ...desktop, status: "stopped" };
    } catch (error) {
        await db
            .update(virtualDesktops)
            .set({ status: "error" })
            .where(eq(virtualDesktops.id, desktopId));

        throw error;
    }
}

/**
 * Destroy a desktop (permanently delete)
 */
export async function destroyDesktop(
    userId: string,
    desktopId: string
): Promise<void> {
    const results = await db
        .select({ vmId: virtualDesktops.vmId })
        .from(virtualDesktops)
        .where(
            and(eq(virtualDesktops.id, desktopId), eq(virtualDesktops.userId, userId))
        );

    if (results.length === 0) {
        throw new Error("Desktop not found");
    }

    const vmId = results[0]?.vmId;

    // Destroy VM if exists
    if (vmId) {
        try {
            await destroyVm(vmId);
        } catch (error) {
            console.error("Failed to destroy VM:", error);
            // Continue anyway to clean up database
        }
    }

    // Delete from database
    await db.delete(virtualDesktops).where(eq(virtualDesktops.id, desktopId));
}

/**
 * Get connection info for a running desktop
 */
export async function getDesktopConnection(
    userId: string,
    desktopId: string
): Promise<DesktopConnection> {
    const desktop = await getDesktop(userId, desktopId);
    if (!desktop) {
        throw new Error("Desktop not found");
    }

    if (desktop.status !== "running") {
        throw new Error("Desktop is not running");
    }

    if (!desktop.vncPort) {
        throw new Error("Desktop has no VNC port assigned");
    }

    // Update last accessed time
    await db
        .update(virtualDesktops)
        .set({ lastAccessedAt: now() })
        .where(eq(virtualDesktops.id, desktopId));

    // Generate connection token (in production, this would be a signed JWT)
    const token = crypto.randomUUID();

    // Determine protocol based on template
    const protocol =
        desktop.template === "windows-11" ? ("rdp" as const) : ("vnc" as const);

    // Tunnel server port (Bun WebSocket server)
    const tunnelPort = process.env.TUNNEL_PORT || "4823";
    const tunnelHost = process.env.TUNNEL_HOST || "localhost";

    return {
        tunnelUrl: `ws://${tunnelHost}:${tunnelPort}/tunnel?hostname=${VNC_HOST}&port=${desktop.vncPort}&password=rubigo`,
        token,
        connectionParams: {
            hostname: VNC_HOST,
            port: desktop.vncPort,
            protocol,
            password: "rubigo",
        },
    };
}
