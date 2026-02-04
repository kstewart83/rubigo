/**
 * ACO Registry
 *
 * Manages the immutable registry of Access Control Objects.
 * Provides canonicalization, hashing, and lookup/creation.
 */

import { db } from "@/db";
import { acoObjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { SensitivityLevel } from "./types";
import { createHash } from "crypto";

// ============================================================================
// Types
// ============================================================================

export interface AcoInput {
    sensitivity: SensitivityLevel;
    compartments?: string[];
    roles?: string[];
}

// ============================================================================
// Canonicalization
// ============================================================================

/**
 * Canonicalize an ACO into a deterministic JSON string.
 * Sorts arrays to ensure consistent hashing regardless of input order.
 */
export function canonicalizeAco(aco: AcoInput): string {
    const canonical = {
        sensitivity: aco.sensitivity,
        compartments: [...(aco.compartments || [])].sort(),
        roles: [...(aco.roles || [])].sort(),
    };
    return JSON.stringify(canonical);
}

/**
 * Generate SHA-256 hash of canonical ACO string.
 */
export function hashAco(canonical: string): string {
    return createHash("sha256").update(canonical).digest("hex");
}

// ============================================================================
// Registry Operations
// ============================================================================

/**
 * Get or create an ACO object in the registry.
 * Returns the integer ID for foreign key references.
 *
 * @param aco - The ACO specification
 * @returns The ACO's unique integer ID
 */
export async function getOrCreateAcoId(aco: AcoInput): Promise<number> {
    const canonical = canonicalizeAco(aco);
    const hash = hashAco(canonical);

    // Try to find existing
    const existing = await db
        .select({ id: acoObjects.id })
        .from(acoObjects)
        .where(eq(acoObjects.hash, hash))
        .limit(1);

    if (existing.length > 0) {
        return existing[0].id;
    }

    // Create new (immutable insert)
    const now = new Date().toISOString();
    const result = await db
        .insert(acoObjects)
        .values({
            hash,
            sensitivity: aco.sensitivity,
            compartments: JSON.stringify([...(aco.compartments || [])].sort()),
            roles: JSON.stringify([...(aco.roles || [])].sort()),
            createdAt: now,
        })
        .returning({ id: acoObjects.id });

    return result[0].id;
}

/**
 * Get an ACO by its ID.
 */
export async function getAcoById(id: number): Promise<AcoInput | null> {
    const result = await db
        .select()
        .from(acoObjects)
        .where(eq(acoObjects.id, id))
        .limit(1);

    if (result.length === 0) return null;

    const row = result[0];
    return {
        sensitivity: row.sensitivity as SensitivityLevel,
        compartments: JSON.parse(row.compartments),
        roles: JSON.parse(row.roles),
    };
}

/**
 * Get the highest ACO ID (for staleness detection).
 */
export async function getMaxAcoId(): Promise<number> {
    const result = await db
        .select({ id: acoObjects.id })
        .from(acoObjects)
        .orderBy(acoObjects.id)
        .limit(1);

    // Note: This query is inefficient - in production use MAX()
    // For SQLite with Drizzle, we'd need a raw query or different approach
    return result.length > 0 ? result[0].id : 0;
}
