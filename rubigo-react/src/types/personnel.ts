/**
 * Personnel type definitions based on common/schemas/personnel.schema.json
 */

export type Department =
    | "Executive"
    | "IT"
    | "HR"
    | "Engineering"
    | "Finance"
    | "Sales"
    | "Operations";

export interface Person {
    id: string;
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
    isGlobalAdmin?: boolean;
}

export interface PersonnelData {
    description: {
        overview: string;
    };
    people: Person[];
}
