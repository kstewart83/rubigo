/**
 * Security Guides page - displays classification guidance list
 */

import { AppShell } from "@/components/layout/app-shell";
import { PersonaProvider } from "@/contexts/persona-context";
import { getAllPersonnel } from "@/lib/personnel";
import { getVersion } from "@/lib/config";
import { GuidesPageContent } from "@/components/security/guides-page-content";
import { getClassificationGuides } from "@/lib/security-actions";

export const metadata = {
    title: "Classification Guides | Security | Rubigo",
    description: "Browse classification guides for sensitivity levels and compartments",
};

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default async function GuidesPage() {
    const allPersonnel = getAllPersonnel();
    const version = getVersion();
    const guides = await getClassificationGuides();

    return (
        <PersonaProvider>
            <AppShell personnel={allPersonnel} version={version}>
                <GuidesPageContent guides={guides} />
            </AppShell>
        </PersonaProvider>
    );
}
