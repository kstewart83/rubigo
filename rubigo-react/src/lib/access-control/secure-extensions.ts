/**
 * Secure Extensions
 *
 * Uniform access layer for classified extension content.
 * Extensions allow object fields to have higher classification than the base object.
 */

import { db } from "@/db";
import { secureDescriptions, acoObjects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { SecuritySession } from "./session-manager";
import type { SensitivityLevel } from "./types";
import { sensitivityIndex } from "./types";
import { getOrCreateAcoId, getAcoById, type AcoInput } from "./aco-registry";

// ============================================================================
// Types
// ============================================================================

/** Result of fetching an extension */
export type ExtensionResult<T> = T | "REDACTED" | null;

/** Supported extension types */
export type ExtensionType = "description" | "participants";

// ============================================================================
// Read Operations
// ============================================================================

/**
 * Get a secure extension with access control check.
 *
 * @param parentType - Type of parent object (e.g., 'calendar_event')
 * @param parentId - ID of parent object
 * @param extensionType - Type of extension (e.g., 'description')
 * @param session - Current security session with validated ACO IDs
 * @returns Content if accessible, "REDACTED" if exists but not accessible, null if not exists
 */
export async function getExtension<T>(
    parentType: string,
    parentId: string,
    extensionType: ExtensionType,
    session: SecuritySession
): Promise<ExtensionResult<T>> {
    // Currently only descriptions are supported
    if (extensionType !== "description") {
        return null;
    }

    const result = await db
        .select()
        .from(secureDescriptions)
        .where(
            and(
                eq(secureDescriptions.parentType, parentType),
                eq(secureDescriptions.parentId, parentId)
            )
        )
        .limit(1);

    if (result.length === 0) {
        return null; // Extension doesn't exist
    }

    const extension = result[0];

    // Check if session can access this ACO
    if (!session.validatedAcoIds.includes(extension.acoId)) {
        return "REDACTED";
    }

    // Parse and return content
    try {
        return JSON.parse(extension.content) as T;
    } catch {
        // If content is plain string (like description), return as-is
        return extension.content as unknown as T;
    }
}

/**
 * Get description extension specifically (convenience wrapper).
 */
export async function getDescription(
    parentType: string,
    parentId: string,
    session: SecuritySession
): Promise<ExtensionResult<string>> {
    return getExtension<string>(parentType, parentId, "description", session);
}

// ============================================================================
// Write Operations
// ============================================================================

/**
 * Set a secure extension with classification validation.
 *
 * @param parentType - Type of parent object
 * @param parentId - ID of parent object
 * @param extensionType - Type of extension
 * @param content - The content to store
 * @param aco - Access control for this extension
 * @param baseAcoId - ACO ID of the base object (for validation)
 * @throws Error if extension classification is lower than base object
 */
export async function setExtension<T>(
    parentType: string,
    parentId: string,
    extensionType: ExtensionType,
    content: T,
    aco: AcoInput,
    baseAcoId: number
): Promise<void> {
    // Validate extension >= base classification
    const baseAco = await getAcoById(baseAcoId);
    if (!baseAco) {
        throw new Error("Base object ACO not found");
    }

    if (sensitivityIndex(aco.sensitivity) < sensitivityIndex(baseAco.sensitivity)) {
        throw new Error(
            `Extension classification (${aco.sensitivity}) cannot be lower than base object (${baseAco.sensitivity})`
        );
    }

    // Get or create ACO for extension
    const acoId = await getOrCreateAcoId(aco);

    // Serialize content
    const contentStr = typeof content === "string" ? content : JSON.stringify(content);

    // Currently only descriptions are supported
    if (extensionType !== "description") {
        throw new Error(`Extension type '${extensionType}' not implemented`);
    }

    // Upsert extension
    const existing = await db
        .select()
        .from(secureDescriptions)
        .where(
            and(
                eq(secureDescriptions.parentType, parentType),
                eq(secureDescriptions.parentId, parentId)
            )
        )
        .limit(1);

    if (existing.length > 0) {
        await db
            .update(secureDescriptions)
            .set({ acoId, content: contentStr })
            .where(
                and(
                    eq(secureDescriptions.parentType, parentType),
                    eq(secureDescriptions.parentId, parentId)
                )
            );
    } else {
        await db.insert(secureDescriptions).values({
            parentType,
            parentId,
            acoId,
            content: contentStr,
        });
    }
}

/**
 * Set description extension specifically (convenience wrapper).
 */
export async function setDescription(
    parentType: string,
    parentId: string,
    content: string,
    aco: AcoInput,
    baseAcoId: number
): Promise<void> {
    return setExtension(parentType, parentId, "description", content, aco, baseAcoId);
}

/**
 * Delete a secure extension.
 */
export async function deleteExtension(
    parentType: string,
    parentId: string,
    extensionType: ExtensionType
): Promise<void> {
    if (extensionType !== "description") {
        return; // Only descriptions supported currently
    }

    await db
        .delete(secureDescriptions)
        .where(
            and(
                eq(secureDescriptions.parentType, parentType),
                eq(secureDescriptions.parentId, parentId)
            )
        );
}
