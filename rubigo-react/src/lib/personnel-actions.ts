"use server";

/**
 * Personnel Server Actions
 * 
 * CRUD operations for personnel records with action logging
 */

import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { Department } from "@/types/personnel";

// ============================================================================
// Types
// ============================================================================

export interface PersonnelInput {
    name: string;
    email: string;
    title?: string;
    department: Department;
    site?: string;
    building?: string;
    level?: number;
    space?: string;
    manager?: string;
    photo?: string;
    deskPhone?: string;
    cellPhone?: string;
    bio?: string;
    isAgent?: boolean;
    // Security fields
    clearanceLevel?: string;
    tenantClearances?: string;
    accessRoles?: string;
}

export interface ActionResult {
    success: boolean;
    error?: string;
    id?: string;
}

// ============================================================================
// Helper: Generate ID
// ============================================================================

function generateId(): string {
    return Math.random().toString(16).substring(2, 8);
}

// ============================================================================
// Helper: Log Action
// ============================================================================

async function logAction(
    actorId: string,
    actorName: string,
    entityType: string,
    entityId: string,
    action: "create" | "update" | "delete",
    changes: Record<string, unknown>,
    source: "ui" | "api" | "mcp" = "ui"
) {
    await db.insert(schema.actionLogs).values({
        id: generateId(),
        timestamp: new Date().toISOString(),
        operationId: `${action}Personnel`,
        entityType,
        entityId,
        action,
        actorId,
        actorName,
        requestId: null,
        changes: JSON.stringify(changes),
        metadata: null,
        source,
    });
}

// ============================================================================
// Create Personnel
// ============================================================================

export async function createPersonnel(
    input: PersonnelInput,
    actorId: string,
    actorName: string,
    source: "ui" | "api" | "mcp" = "ui"
): Promise<ActionResult> {
    try {
        // Validation
        if (!input.name?.trim()) {
            return { success: false, error: "Name is required" };
        }
        if (!input.email?.trim()) {
            return { success: false, error: "Email is required" };
        }
        if (!input.department) {
            return { success: false, error: "Department is required" };
        }

        // Check email uniqueness
        const existing = db
            .select()
            .from(schema.personnel)
            .where(eq(schema.personnel.email, input.email.trim()))
            .all();

        if (existing.length > 0) {
            return { success: false, error: "Email already exists" };
        }

        const id = generateId();

        await db.insert(schema.personnel).values({
            id: id,
            name: input.name.trim(),
            email: input.email.trim().toLowerCase(),
            title: input.title?.trim() || null,
            department: input.department,
            site: input.site?.trim() || null,
            building: input.building?.trim() || null,
            level: input.level || null,
            space: input.space?.trim() || null,
            manager: input.manager?.trim() || null,
            photo: input.photo?.trim() || null,
            deskPhone: input.deskPhone?.trim() || null,
            cellPhone: input.cellPhone?.trim() || null,
            bio: input.bio?.trim() || null,
            isGlobalAdmin: false,
            isAgent: input.isAgent ?? false,
            clearanceLevel: (input.clearanceLevel || "low") as "public" | "low" | "moderate" | "high",
            tenantClearances: input.tenantClearances || "[]",
            accessRoles: input.accessRoles || "[]",
        });

        await logAction(actorId, actorName, "personnel", id, "create", {
            name: input.name,
            email: input.email,
            department: input.department,
        }, source);

        revalidatePath("/personnel");
        return { success: true, id };
    } catch (error) {
        console.error("Create personnel error:", error);
        return { success: false, error: "Failed to create personnel" };
    }
}

// ============================================================================
// Update Personnel
// ============================================================================

export async function updatePersonnel(
    id: string,
    input: Partial<PersonnelInput>,
    actorId: string,
    actorName: string,
    source: "ui" | "api" | "mcp" = "ui"
): Promise<ActionResult> {
    try {
        // Check exists
        const existing = db
            .select()
            .from(schema.personnel)
            .where(eq(schema.personnel.id, id))
            .all();

        if (existing.length === 0) {
            return { success: false, error: "Personnel not found" };
        }

        // Build update object
        const updates: Record<string, unknown> = {};

        if (input.name !== undefined) updates.name = input.name.trim();
        if (input.email !== undefined) updates.email = input.email.trim().toLowerCase();
        if (input.title !== undefined) updates.title = input.title?.trim() || null;
        if (input.department !== undefined) updates.department = input.department;
        if (input.site !== undefined) updates.site = input.site?.trim() || null;
        if (input.building !== undefined) updates.building = input.building?.trim() || null;
        if (input.level !== undefined) updates.level = input.level || null;
        if (input.space !== undefined) updates.space = input.space?.trim() || null;
        if (input.manager !== undefined) updates.manager = input.manager?.trim() || null;
        if (input.photo !== undefined) updates.photo = input.photo?.trim() || null;
        if (input.deskPhone !== undefined) updates.deskPhone = input.deskPhone?.trim() || null;
        if (input.cellPhone !== undefined) updates.cellPhone = input.cellPhone?.trim() || null;
        if (input.bio !== undefined) updates.bio = input.bio?.trim() || null;
        if (input.isAgent !== undefined) updates.isAgent = input.isAgent ? 1 : 0;
        if (input.clearanceLevel !== undefined) updates.clearanceLevel = input.clearanceLevel;
        if (input.tenantClearances !== undefined) updates.tenantClearances = input.tenantClearances;
        if (input.accessRoles !== undefined) updates.accessRoles = input.accessRoles;

        if (Object.keys(updates).length === 0) {
            return { success: false, error: "No updates provided" };
        }

        // Check email uniqueness if changing
        if (updates.email && updates.email !== existing[0].email) {
            const emailExists = db
                .select()
                .from(schema.personnel)
                .where(eq(schema.personnel.email, updates.email as string))
                .all();

            if (emailExists.length > 0) {
                return { success: false, error: "Email already exists" };
            }
        }

        await db
            .update(schema.personnel)
            .set(updates)
            .where(eq(schema.personnel.id, id));

        await logAction(actorId, actorName, "personnel", id, "update", updates, source);

        revalidatePath("/personnel");
        return { success: true, id };
    } catch (error) {
        console.error("Update personnel error:", error);
        return { success: false, error: "Failed to update personnel" };
    }
}

// ============================================================================
// Delete Personnel
// ============================================================================

export async function deletePersonnel(
    id: string,
    actorId: string,
    actorName: string,
    source: "ui" | "api" | "mcp" = "ui"
): Promise<ActionResult> {
    try {
        // Check exists
        const existing = db
            .select()
            .from(schema.personnel)
            .where(eq(schema.personnel.id, id))
            .all();

        if (existing.length === 0) {
            return { success: false, error: "Personnel not found" };
        }

        // Prevent deleting Global Admin
        if (existing[0].isGlobalAdmin) {
            return { success: false, error: "Cannot delete Global Administrator" };
        }

        await db
            .delete(schema.personnel)
            .where(eq(schema.personnel.id, id));

        await logAction(actorId, actorName, "personnel", id, "delete", {
            name: existing[0].name,
            email: existing[0].email,
        }, source);

        revalidatePath("/personnel");
        return { success: true, id };
    } catch (error) {
        console.error("Delete personnel error:", error);
        return { success: false, error: "Failed to delete personnel" };
    }
}

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginationParams {
    page?: number;        // 1-indexed, default 1
    pageSize?: number;    // default 10, options: 10, 25, 50, 100
    search?: string;      // filter by name/email
    department?: string;  // filter by department ("all" or specific)
}

export interface PaginatedPersonnel {
    data: Array<{
        id: string;
        name: string;
        email: string;
        title: string | null;
        department: string;
        site: string | null;
        building: string | null;
        level: number | null;
        space: string | null;
        manager: string | null;
        photo: string | null;
        deskPhone: string | null;
        cellPhone: string | null;
        bio: string | null;
        isGlobalAdmin: boolean;
    }>;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// ============================================================================
// Get Paginated Personnel
// ============================================================================

export async function getPersonnelPage(
    params: PaginationParams = {}
): Promise<PaginatedPersonnel> {
    const page = Math.max(1, params.page ?? 1);
    // Allow any pageSize from 1-100 (for auto mode), default to 10
    const rawPageSize = params.pageSize ?? 10;
    const pageSize = rawPageSize >= 1 && rawPageSize <= 100 ? rawPageSize : 10;
    const search = params.search?.trim().toLowerCase() || "";
    const department = params.department && params.department !== "all"
        ? params.department
        : null;

    try {
        // Get all personnel (we'll filter in JS for now, can optimize with SQL later)
        let allPersonnel = db.select().from(schema.personnel).all();

        // Apply search filter
        if (search) {
            allPersonnel = allPersonnel.filter(
                (p) =>
                    p.name.toLowerCase().includes(search) ||
                    p.email.toLowerCase().includes(search) ||
                    (p.title?.toLowerCase().includes(search) ?? false)
            );
        }

        // Apply department filter
        if (department) {
            allPersonnel = allPersonnel.filter((p) => p.department === department);
        }

        // Calculate pagination
        const total = allPersonnel.length;
        const totalPages = Math.ceil(total / pageSize);
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        // Slice for current page
        const pageData = allPersonnel.slice(startIndex, endIndex);

        return {
            data: pageData.map((p) => ({
                id: p.id,
                name: p.name,
                email: p.email,
                title: p.title,
                department: p.department ?? "Executive",
                site: p.site,
                building: p.building,
                level: p.level,
                space: p.space,
                manager: p.manager,
                photo: p.photo,
                deskPhone: p.deskPhone,
                cellPhone: p.cellPhone,
                bio: p.bio,
                isGlobalAdmin: p.isGlobalAdmin ?? false,
                isAgent: p.isAgent ?? false,
                // Security/ABAC fields (subject attributes)
                clearanceLevel: p.clearanceLevel,
                tenantClearances: p.tenantClearances,
                accessRoles: p.accessRoles,
                // Access Control Object (record classification)
                aco: p.aco,
            })),
            total,
            page,
            pageSize,
            totalPages,
        };
    } catch (error) {
        console.error("Get personnel page error:", error);
        return {
            data: [],
            total: 0,
            page: 1,
            pageSize,
            totalPages: 0,
        };
    }
}

