/**
 * Files Module
 * File management with content-addressable storage
 */

import { AppShell } from "@/components/layout/app-shell";
import { PersonaProvider } from "@/contexts/persona-context";
import { getAllPersonnel } from "@/lib/personnel";
import { getVersion } from "@/lib/config";
import { FilesPageContent } from "@/components/files-page-content";

export const dynamic = "force-dynamic";

export default async function FilesPage() {
    const allPersonnel = getAllPersonnel();
    const version = getVersion();

    return (
        <PersonaProvider>
            <AppShell personnel={allPersonnel} version={version}>
                <FilesPageContent />
            </AppShell>
        </PersonaProvider>
    );
}
