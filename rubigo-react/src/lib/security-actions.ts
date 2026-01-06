"use server";

import { db } from "@/db";
import { classificationGuides } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

// ============================================================================
// Types
// ============================================================================

export type GuideType = "sensitivity" | "compartment" | "role";

export interface ClassificationGuide {
    id: string;
    version: number;
    title: string;
    guideType: GuideType;
    level: string;
    contentMarkdown: string;
    icon?: string | null;
    color?: string | null;
    status: "draft" | "active" | "superseded";
    effectiveDate?: string | null;
    createdAt: string;
    createdBy: string;
    updatedAt?: string | null;
    // Computed fields
    excerpt: string;
    // Draft info (if any)
    hasDraft: boolean;
    draftBy?: string | null;
    draftStartedAt?: string | null;
}

export interface DraftInfo {
    guideId: string;
    draftBy: string;
    draftStartedAt: string;
    baseVersion: number;
    draftTitle: string;
    draftContent: string;
}

export interface CreateGuideInput {
    title: string;
    guideType: GuideType;
    level: string;
    contentMarkdown: string;
    icon?: string;
    color?: string;
    createdBy: string;
}

export interface SaveDraftInput {
    title?: string;
    contentMarkdown?: string;
    icon?: string;
    color?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateExcerpt(markdown: string): string {
    const lines = markdown.split("\n");
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && !trimmed.startsWith("---") && !trimmed.startsWith(">")) {
            const excerpt = trimmed.slice(0, 200);
            return trimmed.length > 200 ? excerpt + "..." : excerpt;
        }
    }
    return "";
}

function mapDbToGuide(row: typeof classificationGuides.$inferSelect): ClassificationGuide {
    return {
        id: row.id,
        version: row.version,
        title: row.title,
        guideType: row.guideType as GuideType,
        level: row.level,
        contentMarkdown: row.contentMarkdown,
        icon: row.icon,
        color: row.color,
        status: row.status as "draft" | "active" | "superseded",
        effectiveDate: row.effectiveDate,
        createdAt: row.createdAt,
        createdBy: row.createdBy,
        updatedAt: row.updatedAt,
        excerpt: generateExcerpt(row.contentMarkdown),
        hasDraft: !!row.draftContent,
        draftBy: row.draftBy,
        draftStartedAt: row.draftStartedAt,
    };
}

function sortGuides(guides: ClassificationGuide[]): ClassificationGuide[] {
    const typeOrder: Record<GuideType, number> = { sensitivity: 0, compartment: 1, role: 2 };
    const sensitivityOrder: Record<string, number> = { public: 0, low: 1, moderate: 2, high: 3 };

    return guides.sort((a, b) => {
        // Sort by type first
        const typeCompare = typeOrder[a.guideType] - typeOrder[b.guideType];
        if (typeCompare !== 0) return typeCompare;

        // For sensitivity, use predefined order
        if (a.guideType === "sensitivity") {
            return (sensitivityOrder[a.level] ?? 99) - (sensitivityOrder[b.level] ?? 99);
        }

        // For others, sort alphabetically by level
        return a.level.localeCompare(b.level);
    });
}

// ============================================================================
// Public API - Queries
// ============================================================================

/**
 * Get all classification guides from database
 */
export async function getGuides(type?: GuideType): Promise<ClassificationGuide[]> {
    const dbGuides = type
        ? await db.select().from(classificationGuides).where(eq(classificationGuides.guideType, type)).all()
        : await db.select().from(classificationGuides).all();

    const guides = dbGuides.map(mapDbToGuide);
    return sortGuides(guides);
}

/**
 * Get a single guide by type and level
 */
export async function getGuideByLevel(type: GuideType, level: string): Promise<ClassificationGuide | null> {
    const dbGuide = await db.select().from(classificationGuides)
        .where(and(eq(classificationGuides.guideType, type), eq(classificationGuides.level, level)))
        .get();

    if (dbGuide) {
        return mapDbToGuide(dbGuide);
    }

    return null;
}

/**
 * Get a single guide by ID
 */
export async function getGuideById(id: string): Promise<ClassificationGuide | null> {
    const dbGuide = await db.select().from(classificationGuides)
        .where(eq(classificationGuides.id, id))
        .get();

    if (dbGuide) {
        return mapDbToGuide(dbGuide);
    }

    // Try parsing id as type-level
    const match = id.match(/^(sensitivity|compartment|role)-(.+)$/);
    if (match) {
        const [, type, level] = match;
        return getGuideByLevel(type as GuideType, level);
    }

    return null;
}

/**
 * Get the current draft for a guide (if any)
 */
export async function getDraft(guideId: string): Promise<DraftInfo | null> {
    const dbGuide = await db.select().from(classificationGuides)
        .where(eq(classificationGuides.id, guideId))
        .get();

    if (!dbGuide || !dbGuide.draftContent) {
        return null;
    }

    return {
        guideId: dbGuide.id,
        draftBy: dbGuide.draftBy!,
        draftStartedAt: dbGuide.draftStartedAt!,
        baseVersion: dbGuide.baseVersion!,
        draftTitle: dbGuide.draftTitle ?? dbGuide.title,
        draftContent: dbGuide.draftContent,
    };
}

// ============================================================================
// Public API - Draft Operations
// ============================================================================

/**
 * Start or continue editing a draft
 * Uses atomic UPDATE to prevent race conditions
 */
export async function startDraft(guideId: string, userId: string): Promise<{
    success: boolean;
    draft?: DraftInfo;
    error?: string;
    lockedBy?: string;
    lockedByName?: string;
    lockedAt?: string;
}> {
    const guide = await db.select().from(classificationGuides)
        .where(eq(classificationGuides.id, guideId))
        .get();

    if (!guide) {
        return { success: false, error: "Guide not found" };
    }

    // If user already has a draft, return it
    if (guide.draftContent && guide.draftBy === userId) {
        return {
            success: true,
            draft: {
                guideId: guide.id,
                draftBy: guide.draftBy,
                draftStartedAt: guide.draftStartedAt!,
                baseVersion: guide.baseVersion!,
                draftTitle: guide.draftTitle ?? guide.title,
                draftContent: guide.draftContent,
            }
        };
    }

    // Check if there's an existing draft by another user
    if (guide.draftBy && guide.draftBy !== userId) {
        // Look up the lock owner's name
        const { getPersonByEmail } = await import("@/lib/personnel");
        const lockOwner = getPersonByEmail(guide.draftBy);

        return {
            success: false,
            error: `Draft in progress by another user`,
            lockedBy: guide.draftBy,
            lockedByName: lockOwner?.name,
            lockedAt: guide.draftStartedAt ?? undefined
        };
    }

    // ATOMIC: Create new draft only if no one else has claimed it
    // This prevents race conditions when two users click Edit simultaneously
    const now = new Date().toISOString();

    const result = await db.update(classificationGuides)
        .set({
            draftTitle: guide.title,
            draftContent: guide.contentMarkdown,
            draftBy: userId,
            draftStartedAt: now,
            baseVersion: guide.version,
        })
        .where(and(
            eq(classificationGuides.id, guideId),
            // Only update if draft_by is still null (atomic check)
            isNull(classificationGuides.draftBy)
        ));

    // Check if we actually got the lock by re-reading
    const updated = await db.select().from(classificationGuides)
        .where(eq(classificationGuides.id, guideId))
        .get();

    if (!updated || updated.draftBy !== userId) {
        // Someone else grabbed the lock between our check and update
        return {
            success: false,
            error: `Draft in progress by another user`,
            lockedBy: updated?.draftBy ?? undefined,
            lockedAt: updated?.draftStartedAt ?? undefined
        };
    }

    return {
        success: true,
        draft: {
            guideId: guide.id,
            draftBy: userId,
            draftStartedAt: now,
            baseVersion: guide.version,
            draftTitle: guide.title,
            draftContent: guide.contentMarkdown,
        }
    };
}

/**
 * Save draft changes (auto-save, no version bump)
 */
export async function saveDraft(guideId: string, input: SaveDraftInput, userId: string): Promise<{
    success: boolean;
    error?: string
}> {
    const guide = await db.select().from(classificationGuides)
        .where(eq(classificationGuides.id, guideId))
        .get();

    if (!guide) {
        return { success: false, error: "Guide not found" };
    }

    // Verify user owns the draft
    if (!guide.draftContent || guide.draftBy !== userId) {
        return { success: false, error: "You don't have an active draft for this guide" };
    }

    // Update draft content
    await db.update(classificationGuides)
        .set({
            draftTitle: input.title ?? guide.draftTitle,
            draftContent: input.contentMarkdown ?? guide.draftContent,
        })
        .where(eq(classificationGuides.id, guideId));

    return { success: true };
}

/**
 * Discard the current draft
 */
export async function discardDraft(guideId: string, userId: string): Promise<{
    success: boolean;
    error?: string
}> {
    const guide = await db.select().from(classificationGuides)
        .where(eq(classificationGuides.id, guideId))
        .get();

    if (!guide) {
        return { success: false, error: "Guide not found" };
    }

    // Verify user owns the draft (or allow admin override in future)
    if (!guide.draftContent) {
        return { success: false, error: "No draft to discard" };
    }

    if (guide.draftBy !== userId) {
        return { success: false, error: "Only the draft owner can discard the draft" };
    }

    // Clear draft fields
    await db.update(classificationGuides)
        .set({
            draftTitle: null,
            draftContent: null,
            draftBy: null,
            draftStartedAt: null,
            baseVersion: null,
        })
        .where(eq(classificationGuides.id, guideId));

    return { success: true };
}

/**
 * Publish draft as new version
 * Checks for conflicts if published version changed since draft started
 */
export async function publishDraft(guideId: string, userId: string): Promise<{
    success: boolean;
    newVersion?: number;
    error?: string;
    conflict?: boolean;
    currentVersion?: number;
    yourBaseVersion?: number;
}> {
    const guide = await db.select().from(classificationGuides)
        .where(eq(classificationGuides.id, guideId))
        .get();

    if (!guide) {
        return { success: false, error: "Guide not found" };
    }

    if (!guide.draftContent) {
        return { success: false, error: "No draft to publish" };
    }

    if (guide.draftBy !== userId) {
        return { success: false, error: "Only the draft owner can publish" };
    }

    // Check for conflicts - published version changed since draft started
    if (guide.baseVersion !== guide.version) {
        return {
            success: false,
            error: "Guide was updated since you started editing",
            conflict: true,
            currentVersion: guide.version,
            yourBaseVersion: guide.baseVersion ?? undefined,
        };
    }

    const now = new Date().toISOString();
    const newVersion = guide.version + 1;

    // Publish: copy draft to main, bump version, clear draft
    await db.update(classificationGuides)
        .set({
            title: guide.draftTitle ?? guide.title,
            contentMarkdown: guide.draftContent,
            version: newVersion,
            status: "active",
            effectiveDate: now,
            updatedAt: now,
            // Clear draft
            draftTitle: null,
            draftContent: null,
            draftBy: null,
            draftStartedAt: null,
            baseVersion: null,
        })
        .where(eq(classificationGuides.id, guideId));

    return { success: true, newVersion };
}

// ============================================================================
// Public API - CRUD Operations (for initial creation/sync)
// ============================================================================

/**
 * Create a new guide (starts as active for sync, or draft for UI creation)
 */
export async function createGuide(input: CreateGuideInput): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
        const id = `${input.guideType}-${input.level}`;
        const now = new Date().toISOString();

        await db.insert(classificationGuides).values({
            id,
            version: 1,
            title: input.title,
            guideType: input.guideType,
            level: input.level,
            contentMarkdown: input.contentMarkdown,
            icon: input.icon,
            color: input.color,
            status: "active", // Sync'd guides are active by default
            effectiveDate: now,
            createdAt: now,
            createdBy: input.createdBy,
        });

        return { success: true, id };
    } catch (error) {
        console.error("Failed to create guide:", error);
        return { success: false, error: String(error) };
    }
}

/**
 * Archive a guide (active -> superseded)
 */
export async function archiveGuide(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const now = new Date().toISOString();

        await db.update(classificationGuides)
            .set({
                status: "superseded",
                updatedAt: now,
            })
            .where(eq(classificationGuides.id, id));

        return { success: true };
    } catch (error) {
        console.error("Failed to archive guide:", error);
        return { success: false, error: String(error) };
    }
}

// ============================================================================
// Backward Compatibility Wrappers
// ============================================================================

/**
 * @deprecated Use getGuides() instead
 */
export async function getClassificationGuides(): Promise<ClassificationGuide[]> {
    return getGuides();
}

/**
 * @deprecated Use getGuideByLevel() instead
 */
export async function getGuide(type: GuideType, level: string): Promise<ClassificationGuide | null> {
    return getGuideByLevel(type, level);
}

/**
 * @deprecated Use getGuides(type) instead
 */
export async function getGuidesByType(type: GuideType): Promise<ClassificationGuide[]> {
    return getGuides(type);
}

/**
 * @deprecated Use startDraft + saveDraft + publishDraft workflow instead
 */
export async function updateGuide(id: string, input: SaveDraftInput): Promise<{ success: boolean; error?: string }> {
    // For backward compatibility, directly update published content
    const guide = await db.select().from(classificationGuides)
        .where(eq(classificationGuides.id, id))
        .get();

    if (!guide) {
        return { success: false, error: "Guide not found" };
    }

    const now = new Date().toISOString();

    await db.update(classificationGuides)
        .set({
            title: input.title ?? guide.title,
            contentMarkdown: input.contentMarkdown ?? guide.contentMarkdown,
            updatedAt: now,
        })
        .where(eq(classificationGuides.id, id));

    return { success: true };
}

/**
 * @deprecated Use publishDraft instead
 */
export async function publishGuide(id: string): Promise<{ success: boolean; error?: string }> {
    const now = new Date().toISOString();

    await db.update(classificationGuides)
        .set({
            status: "active",
            effectiveDate: now,
            updatedAt: now,
        })
        .where(eq(classificationGuides.id, id));

    return { success: true };
}
