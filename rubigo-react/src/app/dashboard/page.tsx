import { AppShell } from "@/components/layout/app-shell";
import { PersonaProvider } from "@/contexts/persona-context";
import { getAllPersonnel } from "@/lib/personnel";
import { getVersion } from "@/lib/config";
import { DashboardContent } from "@/components/dashboard-content";

// Get personnel data at build time (server component)
const personnel = getAllPersonnel();
const version = getVersion();

export default function DashboardPage() {
    return (
        <PersonaProvider>
            <AppShell personnel={personnel}>
                <DashboardContent personnelCount={personnel.length} version={version} />
            </AppShell>
        </PersonaProvider>
    );
}
