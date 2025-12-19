/**
 * Email Module
 * Internal messaging and communication
 */

import { AppShell } from "@/components/layout/app-shell";
import { PersonaProvider } from "@/contexts/persona-context";
import { getAllPersonnel } from "@/lib/personnel";
import { getVersion } from "@/lib/config";
import { EmailPageContent } from "@/components/email-page-content";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default async function EmailPage() {
    const allPersonnel = getAllPersonnel();
    const version = getVersion();

    return (
        <PersonaProvider>
            <AppShell personnel={allPersonnel} version={version}>
                <EmailPageContent />
            </AppShell>
        </PersonaProvider>
    );
}

