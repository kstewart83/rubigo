/**
 * Releases REST API
 * 
 * GET /api/releases - List all releases
 * POST /api/releases - Create a new release
 * 
 * Requires Authorization: Bearer <token> header
 */

import { NextRequest, NextResponse } from "next/server";
import { validateApiToken } from "@/lib/initialization";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { revalidatePath } from "next/cache";

function generateId(): string {
    return crypto.randomUUID().split("-")[0];
}

async function logAction(
    actorId: string,
    actorName: string,
    entityId: string,
    action: "create" | "update" | "delete",
    changes: Record<string, unknown>
) {
    await db.insert(schema.actionLogs).values({
        id: generateId(),
        timestamp: new Date().toISOString(),
        operationId: `${action}Release`,
        entityType: "release",
        entityId,
        action,
        actorId,
        actorName,
        requestId: null,
        changes: JSON.stringify(changes),
        metadata: null,
        source: "api",
    });
}

interface ReleaseInput {
    id?: string;
    product_id: string;
    version: string;
    release_date?: string;
    status?: "planned" | "released" | "deprecated";
}


export async function GET(request: NextRequest) {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") ?? null;

    const auth = await validateApiToken(token);
    if (!auth.valid) {
        return NextResponse.json(
            { success: false, error: auth.error },
            { status: 401 }
        );
    }

    try {
        const items = await db.select().from(schema.releases);
        return NextResponse.json({ success: true, data: items });
    } catch (error) {
        console.error("GET releases error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to list releases" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    // Validate API token
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") ?? null;

    const auth = await validateApiToken(token);
    if (!auth.valid) {
        return NextResponse.json(
            { success: false, error: auth.error },
            { status: 401 }
        );
    }

    // Parse request body
    let input: ReleaseInput;
    try {
        input = await request.json();
    } catch {
        return NextResponse.json(
            { success: false, error: "Invalid JSON" },
            { status: 400 }
        );
    }

    // Validation
    if (!input.product_id) {
        return NextResponse.json(
            { success: false, error: "product_id is required" },
            { status: 400 }
        );
    }
    if (!input.version) {
        return NextResponse.json(
            { success: false, error: "version is required" },
            { status: 400 }
        );
    }

    try {
        const id = input.id || generateId();

        await db.insert(schema.releases).values({
            id,
            productId: input.product_id,
            version: input.version,
            releaseDate: input.release_date || null,
            status: input.status || null,
        });

        await logAction(auth.actorId!, auth.actorName!, id, "create", {
            product_id: input.product_id,
            version: input.version,
        });

        revalidatePath("/projects");
        return NextResponse.json({ success: true, id }, { status: 201 });
    } catch (error) {
        console.error("Create release error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create release" },
            { status: 500 }
        );
    }
}
