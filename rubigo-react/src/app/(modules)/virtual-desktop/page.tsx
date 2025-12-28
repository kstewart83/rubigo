/**
 * Virtual Desktop Module
 * Access cloud desktops from anywhere
 */

import { AppShell } from "@/components/layout/app-shell";
import { PersonaProvider } from "@/contexts/persona-context";
import { getAllPersonnel } from "@/lib/personnel";
import { getVersion } from "@/lib/config";
import { VirtualDesktopContent } from "@/components/virtual-desktop/virtual-desktop-content";
import { cookies } from "next/headers";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export const metadata = {
    title: "Virtual Desktops | Rubigo",
    description: "Access your cloud desktops from anywhere",
};

export default async function VirtualDesktopPage() {
    const allPersonnel = getAllPersonnel();
    const version = getVersion();

    // Get API token from auth cookie
    const cookieStore = await cookies();
    const apiToken = cookieStore.get("rubigo-api-token")?.value || "";

    return (
        <PersonaProvider>
            <AppShell personnel={allPersonnel} version={version}>
                <div className="h-full px-6 py-4">
                    <VirtualDesktopContent apiToken={apiToken} />
                </div>
            </AppShell>
        </PersonaProvider>
    );
}
