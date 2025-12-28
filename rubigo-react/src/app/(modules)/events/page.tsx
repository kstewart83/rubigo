import { AppShell } from "@/components/layout/app-shell";
import { PersonaProvider } from "@/contexts/persona-context";
import { getAllPersonnel } from "@/lib/personnel";
import { getVersion } from "@/lib/config";
import EventsDebugPage from "@/components/events-debug-page";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
    const personnel = getAllPersonnel();
    const version = getVersion();

    // Create a simple lookup map for client
    const personnelMap = Object.fromEntries(
        personnel.map(p => [p.id, p.name])
    );

    return (
        <PersonaProvider>
            <AppShell personnel={personnel} version={version}>
                <EventsDebugPage personnelMap={personnelMap} />
            </AppShell>
        </PersonaProvider>
    );
}
