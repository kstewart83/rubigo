/**
 * File Manager Maintenance API
 * 
 * Garbage collection and storage maintenance
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

interface GCResult {
    deletedChunks: number;
    freedBytes: number;
    deletedNodes: number;
    duration: number;
}

// POST /api/files/maintenance/gc - Run garbage collection
export async function POST(request: NextRequest) {
    try {
        const start = Date.now();
        const db = getDb();

        // 1. Delete chunks with ref_count = 0
        const orphanedChunks = db.prepare(`
            SELECT hash, size FROM chunks WHERE ref_count = 0
        `).all() as Array<{ hash: string; size: number }>;

        let freedBytes = 0;
        for (const chunk of orphanedChunks) {
            freedBytes += chunk.size;
        }

        const chunkResult = db.prepare(`
            DELETE FROM chunks WHERE ref_count = 0
        `).run();

        // 2. Find orphaned file_nodes (not referenced by any file_versions)
        const orphanedNodes = db.prepare(`
            DELETE FROM file_nodes
            WHERE hash NOT IN (
                SELECT root_hash FROM file_versions
            )
            AND hash NOT IN (
                SELECT json_extract(value, '$.hash') as child_hash
                FROM file_nodes, json_each(data)
                WHERE json_valid(data)
            )
        `).run();

        // 3. Clean up expired upload sessions
        db.prepare(`
            DELETE FROM upload_sessions
            WHERE expires_at < datetime('now')
        `).run();

        // 4. Clean up expired share links
        db.prepare(`
            DELETE FROM file_shares
            WHERE expires_at IS NOT NULL AND expires_at < datetime('now')
        `).run();

        const duration = Date.now() - start;

        const result: GCResult = {
            deletedChunks: chunkResult.changes,
            freedBytes,
            deletedNodes: orphanedNodes.changes,
            duration,
        };

        return NextResponse.json({
            success: true,
            data: result,
            message: `Garbage collection completed in ${duration}ms. Freed ${formatBytes(freedBytes)}.`,
        });
    } catch (error) {
        console.error("Garbage collection error:", error);
        return NextResponse.json(
            { success: false, error: "Garbage collection failed" },
            { status: 500 }
        );
    }
}

// GET /api/files/maintenance/gc - Get GC statistics (what would be cleaned up)
export async function GET(request: NextRequest) {
    try {
        const db = getDb();

        // Count orphaned chunks
        const orphanedChunks = db.prepare(`
            SELECT COUNT(*) as count, COALESCE(SUM(size), 0) as bytes
            FROM chunks WHERE ref_count = 0
        `).get() as { count: number; bytes: number };

        // Count expired sessions
        const expiredSessions = db.prepare(`
            SELECT COUNT(*) as count FROM upload_sessions
            WHERE expires_at < datetime('now')
        `).get() as { count: number };

        // Count expired shares
        const expiredShares = db.prepare(`
            SELECT COUNT(*) as count FROM file_shares
            WHERE expires_at IS NOT NULL AND expires_at < datetime('now')
        `).get() as { count: number };

        // Soft-deleted files older than 30 days
        const trashedFiles = db.prepare(`
            SELECT COUNT(*) as count FROM files
            WHERE deleted_at IS NOT NULL
            AND datetime(deleted_at, '+30 days') < datetime('now')
        `).get() as { count: number };

        return NextResponse.json({
            success: true,
            data: {
                orphanedChunks: orphanedChunks.count,
                orphanedBytes: orphanedChunks.bytes,
                orphanedBytesFormatted: formatBytes(orphanedChunks.bytes),
                expiredSessions: expiredSessions.count,
                expiredShares: expiredShares.count,
                trashedFiles: trashedFiles.count,
                canRunGC: orphanedChunks.count > 0 || expiredSessions.count > 0 || expiredShares.count > 0,
            },
        });
    } catch (error) {
        console.error("GC stats error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to get GC stats" },
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
