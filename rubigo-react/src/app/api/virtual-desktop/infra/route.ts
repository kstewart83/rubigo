/**
 * VDI Infrastructure API Routes
 *
 * GET /api/virtual-desktop/infra - Get infrastructure status
 * POST /api/virtual-desktop/infra - Install/update Cloud Hypervisor
 * 
 * Auth: Accepts either Bearer token OR X-Persona-Id header
 */

import { NextRequest, NextResponse } from "next/server";
import {
    getCloudHypervisorInfo,
    ensureCloudHypervisor,
    verifyCloudHypervisor,
} from "@/lib/vdi";
import { validateApiToken } from "@/lib/initialization";

/**
 * Helper to validate request auth
 */
async function validateRequest(request: NextRequest): Promise<{ valid: boolean; actorId?: string; error?: string }> {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") ?? null;

    if (token) {
        const auth = await validateApiToken(token);
        if (auth.valid && auth.actorId) {
            return { valid: true, actorId: auth.actorId };
        }
    }

    const personaId = request.headers.get("X-Persona-Id");
    if (personaId) {
        return { valid: true, actorId: personaId };
    }

    return { valid: false, error: "Unauthorized" };
}

/**
 * GET /api/virtual-desktop/infra
 * Get VDI infrastructure status (admin only)
 */
export async function GET(request: NextRequest) {
    try {
        const auth = await validateRequest(request);
        if (!auth.valid) {
            return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 });
        }

        const info = await getCloudHypervisorInfo();
        const verified = info.installed ? await verifyCloudHypervisor() : false;

        return NextResponse.json({
            cloudHypervisor: {
                ...info,
                verified,
            },
            // Future: add guacd status, KVM availability, etc.
        });
    } catch (error) {
        console.error("Error getting infra status:", error);
        return NextResponse.json(
            { error: "Failed to get infrastructure status" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/virtual-desktop/infra
 * Install or update Cloud Hypervisor binary (admin only)
 * Body: { action: "install" | "update" }
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await validateRequest(request);
        if (!auth.valid) {
            return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { action } = body;

        if (action !== "install" && action !== "update") {
            return NextResponse.json(
                { error: "Invalid action. Must be 'install' or 'update'" },
                { status: 400 }
            );
        }

        // Both actions do the same thing - ensure latest is installed
        const binaryPath = await ensureCloudHypervisor();
        const info = await getCloudHypervisorInfo();
        const verified = await verifyCloudHypervisor();

        return NextResponse.json({
            success: true,
            cloudHypervisor: {
                ...info,
                verified,
            },
        });
    } catch (error) {
        console.error("Error managing Cloud Hypervisor:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to manage Cloud Hypervisor" },
            { status: 500 }
        );
    }
}
