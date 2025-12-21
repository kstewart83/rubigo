/**
 * Folders API
 * 
 * CRUD operations for file manager folders
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/** Generate a short random ID */
function generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
}

export interface Folder {
    id: string;
    profileId: string;
    parentId: string | null;
    name: string;
    ownerId: number;
    createdAt: string;
    updatedAt: string;
}

// GET /api/files/folders - List folders in a directory
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const profileId = searchParams.get("profileId") || "mmc";
        const parentId = searchParams.get("parentId"); // null for root

        const db = getDb();

        const query = parentId
            ? `SELECT * FROM folders WHERE profile_id = ? AND parent_id = ? ORDER BY name`
            : `SELECT * FROM folders WHERE profile_id = ? AND parent_id IS NULL ORDER BY name`;

        const stmt = db.prepare(query);
        const rows = parentId ? stmt.all(profileId, parentId) : stmt.all(profileId);

        const folders: Folder[] = (rows as Record<string, unknown>[]).map(row => ({
            id: row.id as string,
            profileId: row.profile_id as string,
            parentId: row.parent_id as string | null,
            name: row.name as string,
            ownerId: row.owner_id as number,
            createdAt: row.created_at as string,
            updatedAt: row.updated_at as string,
        }));

        return NextResponse.json({ success: true, data: folders });
    } catch (error) {
        console.error("Error listing folders:", error);
        return NextResponse.json(
            { success: false, error: "Failed to list folders" },
            { status: 500 }
        );
    }
}

// POST /api/files/folders - Create a new folder
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { profileId = "mmc", parentId, name, ownerId } = body;

        if (!name) {
            return NextResponse.json(
                { success: false, error: "name is required" },
                { status: 400 }
            );
        }

        if (!ownerId) {
            return NextResponse.json(
                { success: false, error: "ownerId is required" },
                { status: 400 }
            );
        }

        const db = getDb();
        const folderId = generateId();
        const now = new Date().toISOString();

        db.prepare(`
            INSERT INTO folders (id, profile_id, parent_id, name, owner_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(folderId, profileId, parentId || null, name, ownerId, now, now);

        return NextResponse.json({
            success: true,
            id: folderId,
            data: {
                id: folderId,
                profileId,
                parentId: parentId || null,
                name,
                ownerId,
                createdAt: now,
                updatedAt: now,
            }
        });
    } catch (error) {
        console.error("Error creating folder:", error);

        // Check for unique constraint violation
        if (String(error).includes("UNIQUE constraint failed")) {
            return NextResponse.json(
                { success: false, error: "A folder with this name already exists in this location" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { success: false, error: "Failed to create folder" },
            { status: 500 }
        );
    }
}
