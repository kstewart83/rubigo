import { parse } from "@iarna/toml";
import { readFileSync } from "fs";
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
 * Load and parse personnel data from TOML file
 */
export function getPersonnelData(): PersonnelData {
    if (cachedData) {
        return cachedData;
    }

    const dataPath = join(process.cwd(), "src/data/personnel.toml");
    const content = readFileSync(dataPath, "utf-8");
    const raw = parse(content) as unknown as RawPersonnelData;

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

/**
 * Get all personnel
 */
export function getAllPersonnel(): Person[] {
    return getPersonnelData().people;
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
