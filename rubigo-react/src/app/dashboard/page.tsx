import { AppShell } from "@/components/layout/app-shell";
import { PersonaProvider } from "@/contexts/persona-context";
import { getAllPersonnel } from "@/lib/personnel";
import { getVersion } from "@/lib/config";
import { DashboardContent } from "@/components/dashboard-content";

// Force dynamic rendering - personnel data must be fetched at request time
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    // Get personnel data at request time (not build time)
    const personnel = getAllPersonnel();
    const version = getVersion();

    return (
        <PersonaProvider>
            <AppShell personnel={personnel}>
                <DashboardContent personnelCount={personnel.length} version={version} />
            </AppShell>
        </PersonaProvider>
    );
}
