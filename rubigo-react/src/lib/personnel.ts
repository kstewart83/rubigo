/**
 * Personnel Data Access Layer
 * 
 * All personnel queries go through the database. TOML seed data is handled
 * by the sync process (src/db/sync.ts) which runs separately.
 */

import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import type { Person, Department } from "@/types/personnel";

/**
 * Map database row to Person type
 */
function mapDbToPerson(p: typeof schema.personnel.$inferSelect): Person {
    return {
        id: p.id,
        name: p.name,
        email: p.email,
        title: p.title ?? undefined,
        department: (p.department as Department) ?? "Executive",
        site: p.site ?? undefined,
        building: p.building ?? undefined,
        level: p.level ?? undefined,
        space: p.space ?? undefined,
        manager: p.manager ?? undefined,
        photo: p.photo ?? undefined,
        deskPhone: p.deskPhone ?? undefined,
        cellPhone: p.cellPhone ?? undefined,
        bio: p.bio ?? undefined,
        isGlobalAdmin: p.isGlobalAdmin ?? false,
        // Security/ABAC fields
        clearanceLevel: p.clearanceLevel ?? undefined,
        compartmentClearances: p.compartmentClearances ?? undefined,
        accessRoles: p.accessRoles ?? undefined,
    };
}

/**
 * Get all personnel from database
 */
export function getAllPersonnel(): Person[] {
    try {
        const rows = db.select().from(schema.personnel).all();
        return rows.map(mapDbToPerson);
    } catch {
        // Table might not exist yet during initial setup
        return [];
    }
}

/**
 * Get person by ID
 */
export function getPersonById(id: string): Person | undefined {
    try {
        const row = db
            .select()
            .from(schema.personnel)
            .where(eq(schema.personnel.id, id))
            .get();
        return row ? mapDbToPerson(row) : undefined;
    } catch {
        return undefined;
    }
}

/**
 * Get person by name
 */
export function getPersonByName(name: string): Person | undefined {
    return getAllPersonnel().find((p) => p.name === name);
}

/**
 * Get personnel grouped by department
 */
export function getPersonnelByDepartment(): Record<Department, Person[]> {
    const personnel = getAllPersonnel();
    const byDept: Record<Department, Person[]> = {
        Executive: [],
        IT: [],
        HR: [],
        Engineering: [],
        Finance: [],
        Sales: [],
        Operations: [],
    };

    for (const person of personnel) {
        byDept[person.department].push(person);
    }

    return byDept;
}

/**
 * Get personnel count
 */
export function getPersonnelCount(): number {
    try {
        const result = db
            .select({ count: schema.personnel.id })
            .from(schema.personnel)
            .all();
        return result.length;
    } catch {
        return 0;
    }
}
