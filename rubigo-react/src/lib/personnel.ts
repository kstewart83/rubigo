import { parse } from "@iarna/toml";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { Person, PersonnelData, Department } from "@/types/personnel";

interface RawPerson {
    id: string;
    name: string;
    email: string;
    title: string;
    department: string;
    site?: string;
    building?: string;
    level?: number;
    space?: string;
    manager?: string;
    photo?: string;
    desk_phone?: string;
    cell_phone?: string;
    bio?: string;
}

interface RawPersonnelData {
    description?: {
        overview?: string;
    };
    people: RawPerson[];
}

let cachedData: PersonnelData | null = null;

/**
 * Get the seed directory from environment variable
 * Returns null if RUBIGO_SEED_DIR is not set (clean mode)
 */
function getSeedDir(): string | null {
    return process.env.RUBIGO_SEED_DIR || null;
}

/**
 * Load and parse personnel data from TOML file in seed directory
 * Returns empty data if no seed directory is configured
 */
export function getPersonnelData(): PersonnelData {
    if (cachedData) {
        return cachedData;
    }

    const seedDir = getSeedDir();

    // No seed directory configured - return empty personnel data
    if (!seedDir) {
        cachedData = {
            description: { overview: "" },
            people: [],
        };
        return cachedData;
    }

    const dataPath = join(seedDir, "personnel.toml");

    // Seed directory configured but file doesn't exist
    if (!existsSync(dataPath)) {
        console.warn(`[Personnel] RUBIGO_SEED_DIR is set but ${dataPath} not found`);
        cachedData = {
            description: { overview: "" },
            people: [],
        };
        return cachedData;
    }

    const content = readFileSync(dataPath, "utf-8");
    const raw = parse(content) as unknown as RawPersonnelData;

    // Determine photo base path (for headshots directory)
    const photoBasePath = seedDir.startsWith("/") ? seedDir : join(process.cwd(), seedDir);

    // Transform to camelCase and proper types
    cachedData = {
        description: {
            overview: raw.description?.overview ?? "",
        },
        people: raw.people.map((p): Person => ({
            id: p.id,
            name: p.name,
            email: p.email,
            title: p.title,
            department: p.department as Department,
            site: p.site,
            building: p.building,
            level: p.level,
            space: p.space,
            manager: p.manager,
            photo: p.photo ? `/${p.photo}` : undefined, // Prefix with / for public path
            deskPhone: p.desk_phone,
            cellPhone: p.cell_phone,
            bio: p.bio,
        })),
    };

    return cachedData;
}

import { db } from "@/db";
import * as schema from "@/db/schema";

/**
 * Get all personnel from database (includes Global Admin)
 */
export function getDbPersonnel(): Person[] {
    try {
        const dbPersonnel = db.select().from(schema.personnel).all();
        return dbPersonnel.map((p): Person => ({
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
        }));
    } catch {
        // Table might not exist yet
        return [];
    }
}

/**
 * Get all personnel (combines seed TOML and database sources)
 * 
 * If RUBIGO_SEED_DIR is not set, only returns database personnel.
 * If RUBIGO_SEED_DIR is set, includes both seed TOML and database personnel.
 */
export function getAllPersonnel(): Person[] {
    const dbPersonnel = getDbPersonnel();
    const seedPersonnel = getPersonnelData().people;

    // Merge, with DB taking precedence for duplicates
    const byId = new Map<string, Person>();
    for (const p of seedPersonnel) {
        byId.set(p.id, p);
    }
    for (const p of dbPersonnel) {
        byId.set(p.id, p);
    }

    return Array.from(byId.values());
}

/**
 * Get person by ID
 */
export function getPersonById(id: string): Person | undefined {
    return getAllPersonnel().find((p) => p.id === id);
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
