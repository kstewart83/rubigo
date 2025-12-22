/**
 * Slides Collection API Routes
 * GET /api/slides - List all slides (for reuse across presentations)
 * POST /api/slides - Create a standalone slide (not linked to a presentation)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { slides, presentationSlides, presentations, actionLogs } from "@/db/schema";
import { desc, sql, eq, inArray } from "drizzle-orm";

function generateId(): string {
    return crypto.randomUUID().split("-")[0];
}

// GET - List all slides with usage info
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const excludePresentationId = searchParams.get("excludePresentation");

        // Get all slides
        let allSlides = await db
            .select()
            .from(slides)
            .orderBy(desc(slides.updatedAt));

        // If excluding a presentation, filter out slides already in it
        if (excludePresentationId) {
            const existingSlideIds = await db
                .select({ slideId: presentationSlides.slideId })
                .from(presentationSlides)
                .where(eq(presentationSlides.presentationId, parseInt(excludePresentationId)));

            const excludeIds = new Set(existingSlideIds.map(s => s.slideId));
            allSlides = allSlides.filter(s => !excludeIds.has(s.id));
        }

        // Get usage counts (how many presentations use each slide)
        const usageCounts = await db
            .select({
                slideId: presentationSlides.slideId,
                count: sql<number>`COUNT(DISTINCT ${presentationSlides.presentationId})`.as("count"),
            })
            .from(presentationSlides)
            .groupBy(presentationSlides.slideId);

        const usageMap = new Map(usageCounts.map(u => [u.slideId, u.count]));

        // Get presentation names for each slide
        const slideUsage = await db
            .select({
                slideId: presentationSlides.slideId,
                presentationId: presentationSlides.presentationId,
                presentationTitle: presentations.title,
            })
            .from(presentationSlides)
            .leftJoin(presentations, eq(presentations.id, presentationSlides.presentationId));

        // Group presentations by slide
        const presentationsBySlide = new Map<number, string[]>();
        for (const usage of slideUsage) {
            if (!presentationsBySlide.has(usage.slideId)) {
                presentationsBySlide.set(usage.slideId, []);
            }
            if (usage.presentationTitle) {
                presentationsBySlide.get(usage.slideId)!.push(usage.presentationTitle);
            }
        }

        // Combine results
        const result = allSlides.map(slide => {
            let content: Record<string, unknown> = {};
            try {
                content = JSON.parse(slide.contentJson || "{}");
            } catch {
                content = {};
            }

            return {
                id: slide.id,
                title: slide.title || (content.title as string) || "Untitled Slide",
                layout: slide.layout,
                content,
                createdAt: slide.createdAt,
                updatedAt: slide.updatedAt,
                usageCount: usageMap.get(slide.id) || 0,
                usedIn: presentationsBySlide.get(slide.id) || [],
            };
        });

        return NextResponse.json({ slides: result });
    } catch (error) {
        console.error("Failed to fetch slides:", error);
        return NextResponse.json(
            { error: "Failed to fetch slides" },
            { status: 500 }
        );
    }
}

// POST - Create a standalone slide
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, layout, contentJson, notes, createdBy } = body;

        const now = new Date().toISOString();

        const [slide] = await db
            .insert(slides)
            .values({
                title: title || "New Slide",
                layout: layout || "content",
                contentJson: contentJson || JSON.stringify({ title: title || "New Slide", body: "" }),
                notes: notes || null,
                createdBy: createdBy || null,
                createdAt: now,
                updatedAt: now,
            })
            .returning();

        return NextResponse.json({
            id: slide.id,
            title: slide.title,
            layout: slide.layout,
        });
    } catch (error) {
        console.error("Failed to create slide:", error);
        return NextResponse.json(
            { error: "Failed to create slide" },
            { status: 500 }
        );
    }
}
