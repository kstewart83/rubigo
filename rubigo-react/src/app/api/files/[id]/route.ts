/**
 * Single File API
 * 
 * Download, update, and delete individual files
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { FileStorageService } from "@/lib/files";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/files/[id] - Download file content
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const versionId = searchParams.get("version"); // Optional: specific version

        const db = getDb();
        const storage = new FileStorageService(db);

        // Get file metadata
        const file = storage.getFile(id);
        if (!file) {
            return NextResponse.json(
                { success: false, error: "File not found" },
                { status: 404 }
            );
        }

        // Download file content
        const data = await storage.downloadFile(id, versionId || undefined);
        if (!data) {
            return NextResponse.json(
                { success: false, error: "File content not found" },
                { status: 404 }
            );
        }

        // Return file with appropriate headers
        const response = new NextResponse(data);
        response.headers.set("Content-Type", file.mimeType || "application/octet-stream");
        response.headers.set("Content-Disposition", `attachment; filename="${encodeURIComponent(file.name)}"`);
        response.headers.set("Content-Length", data.length.toString());

        // Cache headers for immutable content
        // The checksum-based ETag enables client-side caching
        response.headers.set("Cache-Control", "private, max-age=31536000, immutable");

        return response;
    } catch (error) {
        console.error("Error downloading file:", error);
        return NextResponse.json(
            { success: false, error: "Failed to download file" },
            { status: 500 }
        );
    }
}

// PATCH /api/files/[id] - Update file metadata (rename, move)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, folderId } = body;

        const db = getDb();
        const storage = new FileStorageService(db);

        // Verify file exists
        const file = storage.getFile(id);
        if (!file) {
            return NextResponse.json(
                { success: false, error: "File not found" },
                { status: 404 }
            );
        }

        let updated = false;

        // Rename if name provided
        if (name && name !== file.name) {
            updated = storage.renameFile(id, name);
        }

        // Move if folderId provided (including null for root)
        if (folderId !== undefined && folderId !== file.folderId) {
            updated = storage.moveFile(id, folderId);
        }

        if (!updated && !name && folderId === undefined) {
            return NextResponse.json(
                { success: false, error: "No updates provided" },
                { status: 400 }
            );
        }

        // Return updated file
        const updatedFile = storage.getFile(id);

        return NextResponse.json({ success: true, data: updatedFile });
    } catch (error) {
        console.error("Error updating file:", error);

        if (String(error).includes("UNIQUE constraint failed")) {
            return NextResponse.json(
                { success: false, error: "A file with this name already exists in the destination" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { success: false, error: "Failed to update file" },
            { status: 500 }
        );
    }
}

// DELETE /api/files/[id] - Soft delete file
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const db = getDb();
        const storage = new FileStorageService(db);

        // Verify file exists
        const file = storage.getFile(id);
        if (!file) {
            return NextResponse.json(
                { success: false, error: "File not found" },
                { status: 404 }
            );
        }

        const deleted = storage.deleteFile(id);

        if (!deleted) {
            return NextResponse.json(
                { success: false, error: "Failed to delete file" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, id });
    } catch (error) {
        console.error("Error deleting file:", error);
        return NextResponse.json(
            { success: false, error: "Failed to delete file" },
            { status: 500 }
        );
    }
}
