/**
 * Storage Stats API
 * 
 * Get storage statistics including deduplication ratio
 */

import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { FileStorageService } from "@/lib/files";

// GET /api/files/stats - Get storage statistics
export async function GET() {
    try {
        const db = getDb();
        const storage = new FileStorageService(db);

        const stats = storage.getStorageStats();

        // Get additional stats
        const fileCount = db.prepare(`
            SELECT COUNT(*) as count FROM files WHERE deleted_at IS NULL
        `).get() as { count: number };

        const folderCount = db.prepare(`
            SELECT COUNT(*) as count FROM folders
        `).get() as { count: number };

        const versionCount = db.prepare(`
            SELECT COUNT(*) as count FROM file_versions
        `).get() as { count: number };

        return NextResponse.json({
            success: true,
            data: {
                // Chunk stats
                totalChunks: stats.totalChunks,
                uniqueBytes: stats.uniqueBytes,
                totalBytes: stats.totalBytes,
                deduplicationRatio: (stats.deduplicationRatio * 100).toFixed(1) + "%",
                savedBytes: stats.totalBytes - stats.uniqueBytes,

                // Entity counts
                fileCount: fileCount.count,
                folderCount: folderCount.count,
                versionCount: versionCount.count,

                // Human-readable sizes
                uniqueBytesFormatted: formatBytes(stats.uniqueBytes),
                totalBytesFormatted: formatBytes(stats.totalBytes),
                savedBytesFormatted: formatBytes(stats.totalBytes - stats.uniqueBytes),
            }
        });
    } catch (error) {
        console.error("Error getting storage stats:", error);
        return NextResponse.json(
            { success: false, error: "Failed to get storage stats" },
            { status: 500 }
        );
    }
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";

    const units = ["B", "KB", "MB", "GB", "TB"];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + units[i];
}
