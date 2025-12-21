/**
 * Files API
 * 
 * List and upload files to the content-addressable storage
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { FileStorageService } from "@/lib/files";

/** Generate a short random ID */
function generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
}

export interface FileMetadata {
    id: string;
    profileId: string;
    folderId: string | null;
    name: string;
    currentVersionId: string | null;
    mimeType: string | null;
    detectedType: string | null;
    typeMismatch: boolean;
    totalSize: number;
    ownerId: number;
    createdAt: string;
    updatedAt: string;
}

// GET /api/files - List files in a folder
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const profileId = searchParams.get("profileId") || "mmc";
        const folderId = searchParams.get("folderId"); // null for root

        const db = getDb();
        const storage = new FileStorageService(db);

        const files = storage.listFiles(profileId, folderId || null);

        return NextResponse.json({ success: true, data: files });
    } catch (error) {
        console.error("Error listing files:", error);
        return NextResponse.json(
            { success: false, error: "Failed to list files" },
            { status: 500 }
        );
    }
}

// POST /api/files - Upload a new file
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        const file = formData.get("file") as File | null;
        const profileId = (formData.get("profileId") as string) || "mmc";
        const folderId = formData.get("folderId") as string | null;
        const ownerId = parseInt(formData.get("ownerId") as string, 10);
        const existingFileId = formData.get("fileId") as string | null; // For new version

        if (!file) {
            return NextResponse.json(
                { success: false, error: "file is required" },
                { status: 400 }
            );
        }

        if (!ownerId || isNaN(ownerId)) {
            return NextResponse.json(
                { success: false, error: "ownerId is required" },
                { status: 400 }
            );
        }

        // Read file contents
        const arrayBuffer = await file.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);

        const db = getDb();
        const storage = new FileStorageService(db);

        // Upload with deduplication
        const result = await storage.uploadFile({
            profileId,
            folderId: folderId || null,
            name: file.name,
            data,
            mimeType: file.type || undefined,
            ownerId,
            existingFileId: existingFileId || undefined,
        });

        return NextResponse.json({
            success: true,
            data: {
                fileId: result.fileId,
                versionId: result.versionId,
                size: result.size,
                chunkCount: result.chunkCount,
                checksum: result.checksum,
                // Deduplication stats
                duplicatedBytes: result.duplicatedBytes,
                newBytes: result.newBytes,
                deduplicationRatio: result.size > 0
                    ? (result.duplicatedBytes / result.size).toFixed(2)
                    : "0.00",
            }
        });
    } catch (error) {
        console.error("Error uploading file:", error);

        // Check for unique constraint violation
        if (String(error).includes("UNIQUE constraint failed")) {
            return NextResponse.json(
                { success: false, error: "A file with this name already exists in this folder" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { success: false, error: "Failed to upload file" },
            { status: 500 }
        );
    }
}
