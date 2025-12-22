/**
 * Individual Folder API
 * 
 * Operations on a specific folder by ID
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

interface FolderParams {
    params: Promise<{ id: string }>;
}

// DELETE /api/files/folders/[id] - Delete a folder (must be empty)
export async function DELETE(request: NextRequest, { params }: FolderParams) {
    try {
        const { id: folderId } = await params;
        const db = getDb();

        // Check if folder exists
        const folder = db.prepare(`
            SELECT id, name FROM folders WHERE id = ?
        `).get(folderId) as { id: string; name: string } | undefined;

        if (!folder) {
            return NextResponse.json(
                { success: false, error: "Folder not found" },
                { status: 404 }
            );
        }

        // Check if folder has child folders
        const childFolders = db.prepare(`
            SELECT COUNT(*) as count FROM folders WHERE parent_id = ?
        `).get(folderId) as { count: number };

        if (childFolders.count > 0) {
            return NextResponse.json(
                { success: false, error: "Folder contains subfolders. Remove them first." },
                { status: 400 }
            );
        }

        // Check if folder has files
        const childFiles = db.prepare(`
            SELECT COUNT(*) as count FROM files WHERE folder_id = ? AND deleted_at IS NULL
        `).get(folderId) as { count: number };

        if (childFiles.count > 0) {
            return NextResponse.json(
                { success: false, error: "Folder contains files. Remove them first." },
                { status: 400 }
            );
        }

        // Delete the folder
        db.prepare(`DELETE FROM folders WHERE id = ?`).run(folderId);

        return NextResponse.json({
            success: true,
            message: `Folder "${folder.name}" deleted`,
        });
    } catch (error) {
        console.error("Error deleting folder:", error);
        return NextResponse.json(
            { success: false, error: "Failed to delete folder" },
            { status: 500 }
        );
    }
}

// PATCH /api/files/folders/[id] - Rename folder
export async function PATCH(request: NextRequest, { params }: FolderParams) {
    try {
        const { id: folderId } = await params;
        const body = await request.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json(
                { success: false, error: "name is required" },
                { status: 400 }
            );
        }

        const db = getDb();
        const now = new Date().toISOString();

        const result = db.prepare(`
            UPDATE folders SET name = ?, updated_at = ? WHERE id = ?
        `).run(name, now, folderId);

        if (result.changes === 0) {
            return NextResponse.json(
                { success: false, error: "Folder not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Folder renamed",
        });
    } catch (error) {
        console.error("Error renaming folder:", error);

        if (String(error).includes("UNIQUE constraint failed")) {
            return NextResponse.json(
                { success: false, error: "A folder with this name already exists" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { success: false, error: "Failed to rename folder" },
            { status: 500 }
        );
    }
}
