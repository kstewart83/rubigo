/**
 * Files API
 * 
 * List and upload files to the content-addressable storage
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { FileStorageService } from "@/lib/files";
import { validateUpload } from "@/lib/files/magika";

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
        const ownerId = formData.get("ownerId") as string | null;
        const existingFileId = formData.get("fileId") as string | null; // For new version
        const skipValidation = formData.get("skipValidation") === "true";

        if (!file) {
            return NextResponse.json(
                { success: false, error: "file is required" },
                { status: 400 }
            );
        }

        if (!ownerId) {
            return NextResponse.json(
                { success: false, error: "ownerId is required" },
                { status: 400 }
            );
        }

        // Read file contents
        const arrayBuffer = await file.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);

        // Magika validation
        let detectedType: string | null = null;
        let typeMismatch = false;
        let warnings: string[] = [];

        if (!skipValidation) {
            try {
                const validation = await validateUpload(data, file.name, file.type);
                detectedType = validation.detected.label;
                typeMismatch = !validation.detected.extensionMatch;
                warnings = validation.warnings;

                // Block dangerous uploads
                if (validation.blocked) {
                    return NextResponse.json({
                        success: false,
                        error: "Upload blocked for security reasons",
                        warnings,
                    }, { status: 403 });
                }
            } catch (err) {
                console.warn("Magika validation failed, proceeding without:", err);
            }
        }

        const db = getDb();
        const storage = new FileStorageService(db);

        // Upload with deduplication
        const result = await storage.uploadFile({
            profileId,
            folderId: folderId || null,
            name: file.name,
            data,
            mimeType: file.type || undefined,
            detectedType: detectedType || undefined,
            typeMismatch,
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
                // Type detection
                detectedType,
                typeMismatch,
                warnings: warnings.length > 0 ? warnings : undefined,
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
