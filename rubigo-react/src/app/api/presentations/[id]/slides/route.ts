/**
 * Slides API Routes for a Presentation
 * GET /api/presentations/[id]/slides - Get slides for a presentation
 * POST /api/presentations/[id]/slides - Add a slide to a presentation
 * PUT /api/presentations/[id]/slides - Reorder slides
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { presentations, presentationSlides, slides, actionLogs } from "@/db/schema";
import { eq, max } from "drizzle-orm";

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

// POST - Add a new slide or insert existing slide to presentation
export async function POST(request: NextRequest, { params }: RouteParams) {
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

        // Verify presentation exists
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

        const { layout, title, content, notes, afterPosition, isVertical, existingSlideId } = body;
        const now = new Date().toISOString();

        // Get the max position
        const [maxPos] = await db
            .select({ maxPosition: max(presentationSlides.position) })
            .from(presentationSlides)
            .where(eq(presentationSlides.presentationId, presentationId));

        const newPosition = afterPosition !== undefined
            ? afterPosition + 1
            : (maxPos?.maxPosition ?? -1) + 1;

        let slideId: number;
        let slideTitle: string | null;
        let slideLayout: string | null;

        // Check if inserting an existing slide or creating a new one
        if (existingSlideId) {
            // Verify the slide exists
            const [existingSlide] = await db
                .select()
                .from(slides)
                .where(eq(slides.id, existingSlideId))
                .limit(1);

            if (!existingSlide) {
                return NextResponse.json(
                    { error: "Slide not found" },
                    { status: 404 }
                );
            }

            slideId = existingSlide.id;
            slideTitle = existingSlide.title;
            slideLayout = existingSlide.layout;
        } else {
            // Create a new slide
            const [newSlide] = await db
                .insert(slides)
                .values({
                    title: title || null,
                    layout: layout || "content",
                    contentJson: JSON.stringify(content || {}),
                    notes: notes || null,
                    createdBy: presentation.createdBy,
                    createdAt: now,
                    updatedAt: now,
                })
                .returning();

            slideId = newSlide.id;
            slideTitle = newSlide.title;
            slideLayout = newSlide.layout;
        }

        // Link to presentation
        let verticalPos = 0;
        if (isVertical && afterPosition !== undefined) {
            // Get max vertical position for this horizontal position
            const [maxVert] = await db
                .select({ maxVert: max(presentationSlides.verticalPosition) })
                .from(presentationSlides)
                .where(eq(presentationSlides.presentationId, presentationId));
            verticalPos = (maxVert?.maxVert ?? 0) + 1;
        }

        await db.insert(presentationSlides).values({
            presentationId,
            slideId,
            position: isVertical ? afterPosition ?? 0 : newPosition,
            verticalPosition: verticalPos,
        });

        // Update presentation timestamp
        await db
            .update(presentations)
            .set({ updatedAt: now })
            .where(eq(presentations.id, presentationId));

        await logAction(
            existingSlideId ? "insertSlide" : "addSlide",
            "slide",
            String(slideId),
            "create",
            presentation.createdBy || "system",
            "System",
            { presentationId, position: newPosition, existingSlide: !!existingSlideId }
        );

        return NextResponse.json({
            slide: {
                id: slideId,
                title: slideTitle,
                layout: slideLayout,
                content: content || {},
                notes: notes || null,
                position: newPosition,
                verticalPosition: verticalPos,
            },
        });
    } catch (error) {
        console.error("Failed to add slide:", error);
        return NextResponse.json(
            { error: "Failed to add slide" },
            { status: 500 }
        );
    }
}

// PUT - Reorder slides
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

        const { slideOrder } = body; // Array of { slideId, position, verticalPosition }

        if (!Array.isArray(slideOrder)) {
            return NextResponse.json(
                { error: "slideOrder must be an array" },
                { status: 400 }
            );
        }

        const now = new Date().toISOString();

        // Update each slide's position
        for (const item of slideOrder) {
            await db
                .update(presentationSlides)
                .set({
                    position: item.position,
                    verticalPosition: item.verticalPosition ?? 0,
                })
                .where(
                    eq(presentationSlides.slideId, item.slideId)
                );
        }

        // Update presentation timestamp
        await db
            .update(presentations)
            .set({ updatedAt: now })
            .where(eq(presentations.id, presentationId));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to reorder slides:", error);
        return NextResponse.json(
            { error: "Failed to reorder slides" },
            { status: 500 }
        );
    }
}
