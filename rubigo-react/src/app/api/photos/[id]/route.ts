import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/photos/[id]
 * 
 * Serves a photo from the database with proper caching headers.
 * Uses ETag and Cache-Control for browser caching.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Query the photo from database
        const photo = db
            .select()
            .from(schema.photoBlobs)
            .where(eq(schema.photoBlobs.id, id))
            .get();

        if (!photo) {
            return NextResponse.json(
                { error: "Photo not found" },
                { status: 404 }
            );
        }

        // Generate ETag from ID and createdAt timestamp
        const etag = `"${photo.id}-${new Date(photo.createdAt).getTime()}"`;

        // Check if client has cached version
        const ifNoneMatch = request.headers.get("if-none-match");
        if (ifNoneMatch === etag) {
            return new NextResponse(null, { status: 304 });
        }

        // Decode base64 data
        const buffer = Buffer.from(photo.data, "base64");

        // Return image with caching headers
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": photo.mimeType,
                "Content-Length": String(buffer.length),
                // Cache for 1 year (immutable content addressed by ID)
                "Cache-Control": "public, max-age=31536000, immutable",
                "ETag": etag,
                // Last-Modified for additional cache validation
                "Last-Modified": new Date(photo.createdAt).toUTCString(),
            },
        });
    } catch (error) {
        console.error("Photo serve error:", error);
        return NextResponse.json(
            { error: "Failed to serve photo" },
            { status: 500 }
        );
    }
}
