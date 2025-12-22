/**
 * File Versions API
 * 
 * List version history for a file
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { FileStorageService } from "@/lib/files";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/files/[id]/versions - Get version history
export async function GET(request: NextRequest, { params }: RouteParams) {
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

        const versions = storage.getVersionHistory(id);

        return NextResponse.json({
            success: true,
            data: {
                file: {
                    id: file.id,
                    name: file.name,
                    currentVersionId: file.currentVersionId,
                },
                versions,
            }
        });
    } catch (error) {
        console.error("Error getting version history:", error);
        return NextResponse.json(
            { success: false, error: "Failed to get version history" },
            { status: 500 }
        );
    }
}
