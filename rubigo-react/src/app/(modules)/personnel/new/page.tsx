import { AppShell } from "@/components/layout/app-shell";
import { PersonaProvider } from "@/contexts/persona-context";
import { PersonnelEditor } from "@/components/personnel/personnel-editor";
import { getAllPersonnel } from "@/lib/personnel";
import { getVersion } from "@/lib/config";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default async function NewPersonnelPage() {
    // Fetch all personnel for AppShell and manager selector
    const allPersonnel = getAllPersonnel();
    const version = getVersion();

    return (
        <PersonaProvider>
            <AppShell personnel={allPersonnel} version={version}>
                <PersonnelEditor
                    mode="create"
                    allPersonnel={allPersonnel}
                />
            </AppShell>
        </PersonaProvider>
    );
}
