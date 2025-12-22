/**
 * Presentations Module
 * Create, edit, and deliver presentations
 */

import { AppShell } from "@/components/layout/app-shell";
import { PersonaProvider } from "@/contexts/persona-context";
import { getAllPersonnel } from "@/lib/personnel";
import { getVersion } from "@/lib/config";
import { PresentationsPageContent } from "@/components/presentations/presentations-page-content";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default async function PresentationsPage() {
    const allPersonnel = getAllPersonnel();
    const version = getVersion();

    return (
        <PersonaProvider>
            <AppShell personnel={allPersonnel} version={version}>
                <div className="container mx-auto py-8 h-[calc(100vh-8rem)]">
                    <PresentationsPageContent />
                </div>
            </AppShell>
        </PersonaProvider>
    );
}
