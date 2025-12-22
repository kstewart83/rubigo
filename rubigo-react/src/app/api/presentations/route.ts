/**
 * Presentations API Routes
 * GET /api/presentations - List all presentations
 * POST /api/presentations - Create a new presentation
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { presentations, presentationSlides, slides, actionLogs } from "@/db/schema";
import { desc, sql } from "drizzle-orm";

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

// GET - List all presentations
export async function GET() {
    try {
        // Get presentations with slide count
        const result = await db
            .select({
                id: presentations.id,
                title: presentations.title,
                description: presentations.description,
                theme: presentations.theme,
                aspectRatio: presentations.aspectRatio,
                transition: presentations.transition,
                createdBy: presentations.createdBy,
                createdAt: presentations.createdAt,
                updatedAt: presentations.updatedAt,
                slideCount: sql<number>`(
                    SELECT COUNT(*) FROM presentation_slides 
                    WHERE presentation_slides.presentation_id = ${presentations.id}
                )`,
            })
            .from(presentations)
            .orderBy(desc(presentations.updatedAt));

        return NextResponse.json({ presentations: result });
    } catch (error) {
        console.error("Failed to fetch presentations:", error);
        return NextResponse.json(
            { error: "Failed to fetch presentations" },
            { status: 500 }
        );
    }
}

// POST - Create a new presentation
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, description, theme, aspectRatio, createdBy } = body;

        if (!title?.trim()) {
            return NextResponse.json(
                { error: "Title is required" },
                { status: 400 }
            );
        }

        const now = new Date().toISOString();

        // Create the presentation
        const [presentation] = await db
            .insert(presentations)
            .values({
                title: title.trim(),
                description: description || null,
                theme: theme || "dark",
                aspectRatio: aspectRatio || "16:9",
                createdBy: createdBy || null,
                createdAt: now,
                updatedAt: now,
            })
            .returning();

        // Create a blank first slide
        const [firstSlide] = await db
            .insert(slides)
            .values({
                title: "Title Slide",
                layout: "title",
                contentJson: JSON.stringify({
                    title: title.trim(),
                    subtitle: "Click to add subtitle",
                }),
                createdBy: createdBy || null,
                createdAt: now,
                updatedAt: now,
            })
            .returning();

        // Link the slide to the presentation
        await db.insert(presentationSlides).values({
            presentationId: presentation.id,
            slideId: firstSlide.id,
            position: 0,
            verticalPosition: 0,
        });

        // Log action
        await logAction(
            "createPresentation",
            "presentation",
            String(presentation.id),
            "create",
            createdBy || "system",
            "System",
            { title: presentation.title }
        );

        return NextResponse.json({
            id: presentation.id,
            title: presentation.title,
            slideCount: 1,
        });
    } catch (error) {
        console.error("Failed to create presentation:", error);
        return NextResponse.json(
            { error: "Failed to create presentation" },
            { status: 500 }
        );
    }
}
