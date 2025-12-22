/**
 * Screen Share Module
 * 
 * Share your screen with colleagues for remote collaboration.
 */

import { AppShell } from "@/components/layout/app-shell";
import { PersonaProvider } from "@/contexts/persona-context";
import { getAllPersonnel } from "@/lib/personnel";
import { getVersion } from "@/lib/config";
import { ScreenSharePageContent } from "@/components/screen-share/ScreenSharePageContent";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default async function ScreenSharePage() {
    const allPersonnel = getAllPersonnel();
    const version = getVersion();

    return (
        <PersonaProvider>
            <AppShell personnel={allPersonnel} version={version}>
                <ScreenSharePageContent />
            </AppShell>
        </PersonaProvider>
    );
}
