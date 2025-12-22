/**
 * Individual Slide API Routes
 * GET /api/slides/[id] - Get a slide
 * PUT /api/slides/[id] - Update a slide
 * DELETE /api/slides/[id] - Delete a slide from presentation
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { slides, presentationSlides, actionLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

function generateId(): string {
    return crypto.randomUUID().split("-")[0];
}

async function logAction(
    operationId: string,
    entityType: string,
    entityId: string,
    action: "create" | "update" | "delete",
    actorId: string,
    actorName: string,
    changes?: Record<string, unknown>
) {
    await db.insert(actionLogs).values({
        id: generateId(),
        timestamp: new Date().toISOString(),
        operationId,
        entityType,
        entityId,
        action,
        actorId,
        actorName,
        requestId: null,
        changes: changes ? JSON.stringify(changes) : null,
        metadata: null,
        source: "api",
    });
}

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET - Get a single slide
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const slideId = parseInt(id, 10);

        if (isNaN(slideId)) {
            return NextResponse.json(
                { error: "Invalid slide ID" },
                { status: 400 }
            );
        }

        const [slide] = await db
            .select()
            .from(slides)
            .where(eq(slides.id, slideId))
            .limit(1);

        if (!slide) {
            return NextResponse.json(
                { error: "Slide not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            slide: {
                ...slide,
                content: JSON.parse(slide.contentJson || "{}"),
            },
        });
    } catch (error) {
        console.error("Failed to fetch slide:", error);
        return NextResponse.json(
            { error: "Failed to fetch slide" },
            { status: 500 }
        );
    }
}

// PUT - Update a slide
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const slideId = parseInt(id, 10);
        const body = await request.json();

        if (isNaN(slideId)) {
            return NextResponse.json(
                { error: "Invalid slide ID" },
                { status: 400 }
            );
        }

        const { title, layout, content, notes } = body;
        const now = new Date().toISOString();

        const [updated] = await db
            .update(slides)
            .set({
                ...(title !== undefined && { title }),
                ...(layout && { layout }),
                ...(content !== undefined && { contentJson: JSON.stringify(content) }),
                ...(notes !== undefined && { notes }),
                updatedAt: now,
            })
            .where(eq(slides.id, slideId))
            .returning();

        if (!updated) {
            return NextResponse.json(
                { error: "Slide not found" },
                { status: 404 }
            );
        }

        await logAction(
            "updateSlide",
            "slide",
            String(slideId),
            "update",
            body.actorId || "system",
            "System",
            body
        );

        return NextResponse.json({
            slide: {
                ...updated,
                content: JSON.parse(updated.contentJson || "{}"),
            },
        });
    } catch (error) {
        console.error("Failed to update slide:", error);
        return NextResponse.json(
            { error: "Failed to update slide" },
            { status: 500 }
        );
    }
}

// DELETE - Delete a slide
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const slideId = parseInt(id, 10);

        if (isNaN(slideId)) {
            return NextResponse.json(
                { error: "Invalid slide ID" },
                { status: 400 }
            );
        }

        // First, remove from any presentations
        await db
            .delete(presentationSlides)
            .where(eq(presentationSlides.slideId, slideId));

        // Then delete the slide itself
        const [deleted] = await db
            .delete(slides)
            .where(eq(slides.id, slideId))
            .returning();

        if (!deleted) {
            return NextResponse.json(
                { error: "Slide not found" },
                { status: 404 }
            );
        }

        await logAction(
            "deleteSlide",
            "slide",
            String(slideId),
            "delete",
            "system",
            "System"
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete slide:", error);
        return NextResponse.json(
            { error: "Failed to delete slide" },
            { status: 500 }
        );
    }
}
