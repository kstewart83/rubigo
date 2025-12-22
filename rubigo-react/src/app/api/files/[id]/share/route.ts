/**
 * File Share API
 * 
 * Create and manage share links for files
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/** Generate a URL-safe random token */
function generateToken(length: number = 32): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => chars[b % chars.length]).join("");
}

/** Generate a short unique ID */
function generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
}

// GET /api/files/[id]/share - List share links for a file
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const db = getDb();

        // Verify file exists
        const file = db.prepare(`
            SELECT id, name FROM files WHERE id = ? AND deleted_at IS NULL
        `).get(id) as { id: string; name: string } | undefined;

        if (!file) {
            return NextResponse.json(
                { success: false, error: "File not found" },
                { status: 404 }
            );
        }

        // Get share links
        const shares = db.prepare(`
            SELECT id, token, expires_at, access_count, created_at
            FROM file_shares
            WHERE file_id = ?
            ORDER BY created_at DESC
        `).all(id) as Array<{
            id: string;
            token: string;
            expires_at: string | null;
            access_count: number;
            created_at: string;
        }>;

        // Build full URLs
        const baseUrl = request.headers.get("host") || "localhost:3000";
        const protocol = request.headers.get("x-forwarded-proto") || "http";

        const data = shares.map(share => ({
            id: share.id,
            url: `${protocol}://${baseUrl}/share/${share.token}`,
            token: share.token,
            expiresAt: share.expires_at,
            accessCount: share.access_count,
            createdAt: share.created_at,
            isExpired: share.expires_at ? new Date(share.expires_at) < new Date() : false,
        }));

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Error listing share links:", error);
        return NextResponse.json(
            { success: false, error: "Failed to list share links" },
            { status: 500 }
        );
    }
}

// POST /api/files/[id]/share - Create a new share link
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        let expiresInDays: number | null = null;

        // Parse body if present
        try {
            const body = await request.json();
            expiresInDays = body.expiresInDays ?? null;
        } catch {
            // No body or invalid JSON - use defaults
        }

        const db = getDb();

        // Verify file exists
        const file = db.prepare(`
            SELECT id, name, owner_id FROM files WHERE id = ? AND deleted_at IS NULL
        `).get(id) as { id: string; name: string; owner_id: number } | undefined;

        if (!file) {
            return NextResponse.json(
                { success: false, error: "File not found" },
                { status: 404 }
            );
        }

        const shareId = generateId();
        const token = generateToken();
        const now = new Date().toISOString();

        // Calculate expiration if specified
        let expiresAt: string | null = null;
        if (expiresInDays !== null && expiresInDays > 0) {
            const expDate = new Date();
            expDate.setDate(expDate.getDate() + expiresInDays);
            expiresAt = expDate.toISOString();
        }

        db.prepare(`
            INSERT INTO file_shares (id, file_id, token, expires_at, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(shareId, id, token, expiresAt, file.owner_id, now);

        // Build share URL
        const baseUrl = request.headers.get("host") || "localhost:3000";
        const protocol = request.headers.get("x-forwarded-proto") || "http";
        const shareUrl = `${protocol}://${baseUrl}/share/${token}`;

        return NextResponse.json({
            success: true,
            data: {
                id: shareId,
                url: shareUrl,
                token,
                expiresAt,
                createdAt: now,
            }
        });
    } catch (error) {
        console.error("Error creating share link:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create share link" },
            { status: 500 }
        );
    }
}

// DELETE /api/files/[id]/share - Revoke a share link
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const shareId = searchParams.get("shareId");

        if (!shareId) {
            return NextResponse.json(
                { success: false, error: "shareId query parameter is required" },
                { status: 400 }
            );
        }

        const db = getDb();

        const result = db.prepare(`
            DELETE FROM file_shares WHERE id = ? AND file_id = ?
        `).run(shareId, id);

        if (result.changes === 0) {
            return NextResponse.json(
                { success: false, error: "Share link not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, id: shareId });
    } catch (error) {
        console.error("Error deleting share link:", error);
        return NextResponse.json(
            { success: false, error: "Failed to delete share link" },
            { status: 500 }
        );
    }
}
