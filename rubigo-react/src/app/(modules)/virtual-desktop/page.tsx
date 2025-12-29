/**
 * Virtual Desktop Module
 * Access cloud desktops from anywhere
 */

import { AppShell } from "@/components/layout/app-shell";
import { getAllPersonnel } from "@/lib/personnel";
import { getVersion } from "@/lib/config";
import { VirtualDesktopContent } from "@/components/virtual-desktop/virtual-desktop-content";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export const metadata = {
    title: "Virtual Desktops | Rubigo",
    description: "Access your cloud desktops from anywhere",
};

export default async function VirtualDesktopPage() {
    const allPersonnel = getAllPersonnel();
    const version = getVersion();

    return (
        <AppShell personnel={allPersonnel} version={version}>
            <div className="h-full px-6 py-4">
                <VirtualDesktopContent />
            </div>
        </AppShell>
    );
}
