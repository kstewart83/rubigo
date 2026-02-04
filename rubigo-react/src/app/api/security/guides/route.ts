/**
 * Classification Guides REST API
 *
 * GET /api/security/guides - List all guides (optionally filter by type)
 * POST /api/security/guides - Create a new guide (requires API token)
 */

import { NextRequest, NextResponse } from "next/server";
import { validateApiToken } from "@/lib/initialization";
import { db } from "@/db";
import { classificationGuides } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { GuideType } from "@/lib/security-actions";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") as GuideType | null;

    try {
        let guides;
        if (type) {
            guides = await db.select().from(classificationGuides)
                .where(eq(classificationGuides.guideType, type))
                .all();
        } else {
            guides = await db.select().from(classificationGuides).all();
        }

        return NextResponse.json({
            success: true,
            guides,
        });
    } catch (error) {
        console.error("Failed to fetch guides:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch guides" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    // Validate API token
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") ?? null;

    const auth = await validateApiToken(token);
    if (!auth.valid) {
        return NextResponse.json(
            { success: false, error: auth.error },
            { status: 401 }
        );
    }

    // Parse request body
    let input: {
        id?: string;
        title: string;
        guideType: GuideType;
        level: string;
        contentMarkdown: string;
        icon?: string;
        color?: string;
        status?: "draft" | "active" | "superseded";
    };

    try {
        input = await request.json();
    } catch {
        return NextResponse.json(
            { success: false, error: "Invalid JSON" },
            { status: 400 }
        );
    }

    // Validate required fields
    if (!input.title || !input.guideType || !input.level || !input.contentMarkdown) {
        return NextResponse.json(
            { success: false, error: "title, guideType, level, and contentMarkdown are required" },
            { status: 400 }
        );
    }

    const id = input.id || `${input.guideType}-${input.level}`;
    const now = new Date().toISOString();

    try {
        // Check if already exists - if so, update
        const existing = await db.select().from(classificationGuides)
            .where(eq(classificationGuides.id, id))
            .get();

        if (existing) {
            await db.update(classificationGuides)
                .set({
                    title: input.title,
                    contentMarkdown: input.contentMarkdown,
                    icon: input.icon,
                    color: input.color,
                    status: input.status ?? existing.status,
                    version: existing.version + 1,
                    updatedAt: now,
                })
                .where(eq(classificationGuides.id, id));

            return NextResponse.json({
                success: true,
                id,
                existed: true,
            });
        }

        // Create new guide
        await db.insert(classificationGuides).values({
            id,
            version: 1,
            title: input.title,
            guideType: input.guideType,
            level: input.level,
            contentMarkdown: input.contentMarkdown,
            icon: input.icon,
            color: input.color,
            status: input.status ?? "active",
            createdAt: now,
            createdBy: auth.actorId ?? "system",
        });

        return NextResponse.json({
            success: true,
            id,
        }, { status: 201 });
    } catch (error) {
        console.error("Failed to create guide:", error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
