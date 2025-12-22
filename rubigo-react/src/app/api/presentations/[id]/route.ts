/**
 * Individual Presentation API Routes
 * GET /api/presentations/[id] - Get presentation with slides
 * PUT /api/presentations/[id] - Update presentation
 * DELETE /api/presentations/[id] - Delete presentation
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { presentations, presentationSlides, slides, actionLogs } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

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

// GET - Get presentation with slides
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const presentationId = parseInt(id, 10);

        if (isNaN(presentationId)) {
            return NextResponse.json(
                { error: "Invalid presentation ID" },
                { status: 400 }
            );
        }

        // Get the presentation
        const [presentation] = await db
            .select()
            .from(presentations)
            .where(eq(presentations.id, presentationId))
            .limit(1);

        if (!presentation) {
            return NextResponse.json(
                { error: "Presentation not found" },
                { status: 404 }
            );
        }

        // Get slides in order
        const slideData = await db
            .select({
                slideId: slides.id,
                title: slides.title,
                layout: slides.layout,
                contentJson: slides.contentJson,
                notes: slides.notes,
                position: presentationSlides.position,
                verticalPosition: presentationSlides.verticalPosition,
                customTransition: presentationSlides.customTransition,
            })
            .from(presentationSlides)
            .innerJoin(slides, eq(presentationSlides.slideId, slides.id))
            .where(eq(presentationSlides.presentationId, presentationId))
            .orderBy(
                asc(presentationSlides.position),
                asc(presentationSlides.verticalPosition)
            );

        // Parse content JSON
        const slidesWithContent = slideData.map((s) => ({
            ...s,
            content: JSON.parse(s.contentJson || "{}"),
        }));

        return NextResponse.json({
            presentation,
            slides: slidesWithContent,
        });
    } catch (error) {
        console.error("Failed to fetch presentation:", error);
        return NextResponse.json(
            { error: "Failed to fetch presentation" },
            { status: 500 }
        );
    }
}

// PUT - Update presentation metadata
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const presentationId = parseInt(id, 10);
        const body = await request.json();

        if (isNaN(presentationId)) {
            return NextResponse.json(
                { error: "Invalid presentation ID" },
                { status: 400 }
            );
        }

        const { title, description, theme, aspectRatio, transition } = body;
        const now = new Date().toISOString();

        const [updated] = await db
            .update(presentations)
            .set({
                ...(title && { title }),
                ...(description !== undefined && { description }),
                ...(theme && { theme }),
                ...(aspectRatio && { aspectRatio }),
                ...(transition && { transition }),
                updatedAt: now,
            })
            .where(eq(presentations.id, presentationId))
            .returning();

        if (!updated) {
            return NextResponse.json(
                { error: "Presentation not found" },
                { status: 404 }
            );
        }

        await logAction(
            "updatePresentation",
            "presentation",
            String(presentationId),
            "update",
            body.actorId || "system",
            "System",
            body
        );

        return NextResponse.json({ presentation: updated });
    } catch (error) {
        console.error("Failed to update presentation:", error);
        return NextResponse.json(
            { error: "Failed to update presentation" },
            { status: 500 }
        );
    }
}

// DELETE - Delete presentation
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const presentationId = parseInt(id, 10);

        if (isNaN(presentationId)) {
            return NextResponse.json(
                { error: "Invalid presentation ID" },
                { status: 400 }
            );
        }

        // Delete presentation (cascade will delete presentation_slides)
        const [deleted] = await db
            .delete(presentations)
            .where(eq(presentations.id, presentationId))
            .returning();

        if (!deleted) {
            return NextResponse.json(
                { error: "Presentation not found" },
                { status: 404 }
            );
        }

        await logAction(
            "deletePresentation",
            "presentation",
            String(presentationId),
            "delete",
            "system",
            "System"
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete presentation:", error);
        return NextResponse.json(
            { error: "Failed to delete presentation" },
            { status: 500 }
        );
    }
}
