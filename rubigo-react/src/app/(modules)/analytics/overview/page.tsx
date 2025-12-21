import { AppShell } from "@/components/layout/app-shell";
import { PersonaProvider } from "@/contexts/persona-context";
import { getAllPersonnel } from "@/lib/personnel";
import { getVersion } from "@/lib/config";
import { AnalyticsTabs } from "../analytics-tabs";
import { OverviewDashboard } from "./overview-dashboard";

const personnel = getAllPersonnel();
const version = getVersion();

export default function OverviewPage() {
    return (
        <PersonaProvider>
            <AppShell personnel={personnel} version={version}>
                <div>
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                            Analytics
                        </h1>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            Platform observability and performance insights
                        </p>
                    </div>
                    <AnalyticsTabs />
                    <OverviewDashboard />
                </div>
            </AppShell>
        </PersonaProvider>
    );
}
