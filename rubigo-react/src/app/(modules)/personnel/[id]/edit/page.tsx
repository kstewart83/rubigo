import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PersonaProvider } from "@/contexts/persona-context";
import { PersonnelEditor } from "@/components/personnel/personnel-editor";
import { getAllPersonnel } from "@/lib/personnel";
import { getVersion } from "@/lib/config";
import type { Person } from "@/types/personnel";

// Force dynamic rendering
export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EditPersonnelPage({ params }: PageProps) {
    const { id } = await params;

    // Fetch the person to edit
    const person = await db
        .select()
        .from(schema.personnel)
        .where(eq(schema.personnel.id, id))
        .limit(1);

    if (person.length === 0) {
        notFound();
    }

    // Fetch all personnel for AppShell and manager selector
    const allPersonnel = getAllPersonnel();
    const version = getVersion();

    const personData: Person = {
        id: person[0].id,
        name: person[0].name,
        email: person[0].email,
        title: person[0].title ?? undefined,
        department: person[0].department as Person["department"],
        site: person[0].site ?? undefined,
        building: person[0].building ?? undefined,
        level: person[0].level ?? undefined,
        space: person[0].space ?? undefined,
        manager: person[0].manager ?? undefined,
        photo: person[0].photo ?? undefined,
        deskPhone: person[0].deskPhone ?? undefined,
        cellPhone: person[0].cellPhone ?? undefined,
        bio: person[0].bio ?? undefined,
        isGlobalAdmin: Boolean(person[0].isGlobalAdmin),
        isAgent: Boolean(person[0].isAgent),
        clearanceLevel: person[0].clearanceLevel ?? undefined,
        compartmentClearances: person[0].compartmentClearances ?? undefined,
        accessRoles: person[0].accessRoles ?? undefined,
    };

    return (
        <PersonaProvider>
            <AppShell personnel={allPersonnel} version={version}>
                <PersonnelEditor
                    mode="edit"
                    person={personData}
                    allPersonnel={allPersonnel}
                />
            </AppShell>
        </PersonaProvider>
    );
}
