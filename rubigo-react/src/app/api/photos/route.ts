import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";

/**
 * POST /api/photos
 * 
 * Uploads a photo and stores it in the database as base64.
 * Returns the photo ID which can be used to retrieve it via GET /api/photos/[id]
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const id = formData.get("id") as string | null;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: "File too large. Maximum size: 5MB" },
                { status: 400 }
            );
        }

        // Generate unique ID if not provided
        const photoId = id || `photo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

        // Convert file to base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Data = buffer.toString("base64");

        // Store in database
        await db.insert(schema.photoBlobs).values({
            id: photoId,
            data: base64Data,
            mimeType: file.type,
            size: file.size,
            createdAt: new Date().toISOString(),
        }).onConflictDoUpdate({
            target: schema.photoBlobs.id,
            set: {
                data: base64Data,
                mimeType: file.type,
                size: file.size,
                createdAt: new Date().toISOString(),
            },
        });

        // Return the URL path for this photo
        const photoPath = `/api/photos/${photoId}`;

        return NextResponse.json({
            success: true,
            id: photoId,
            path: photoPath,
            size: file.size,
        });
    } catch (error) {
        console.error("Photo upload error:", error);
        return NextResponse.json(
            { error: "Failed to upload photo" },
            { status: 500 }
        );
    }
}
