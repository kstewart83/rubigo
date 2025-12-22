import { AppShell } from "@/components/layout/app-shell";
import { PersonaProvider } from "@/contexts/persona-context";
import { getAllPersonnel } from "@/lib/personnel";
import { getVersion } from "@/lib/config";
import { AgentSimulationContent } from "./agent-simulation-content";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default async function AgentsPage() {
    const allPersonnel = getAllPersonnel();
    const version = getVersion();

    return (
        <PersonaProvider>
            <AppShell personnel={allPersonnel} version={version}>
                <AgentSimulationContent />
            </AppShell>
        </PersonaProvider>
    );
}
