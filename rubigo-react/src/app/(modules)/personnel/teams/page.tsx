import { AppShell } from "@/components/layout/app-shell";
import { PersonaProvider } from "@/contexts/persona-context";
import { getAllPersonnel } from "@/lib/personnel";
import { getTeams } from "@/lib/teams-actions";
import { TeamsPageContent } from "@/components/teams-page-content";
import { getVersion } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
    const teamsResult = await getTeams();
    const teams = teamsResult.success ? teamsResult.data || [] : [];
    const allPersonnel = getAllPersonnel();
    const version = getVersion();

    return (
        <PersonaProvider>
            <AppShell personnel={allPersonnel} version={version}>
                <TeamsPageContent teams={teams} allPersonnel={allPersonnel} />
            </AppShell>
        </PersonaProvider>
    );
}
