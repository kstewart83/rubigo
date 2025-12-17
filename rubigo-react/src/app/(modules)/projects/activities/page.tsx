import { AppShell } from "@/components/layout/app-shell";
import { PersonaProvider } from "@/contexts/persona-context";
import { LoggingProjectDataProvider } from "@/contexts/logging-project-data-provider";
import { getAllPersonnel } from "@/lib/personnel";
import { getProjectData } from "@/lib/projects";
import { getVersion } from "@/lib/config";
import { ActivitiesListWithCRUD } from "./activities-list";

const personnel = getAllPersonnel();
const projectData = getProjectData();
const version = getVersion();

export default function ActivitiesPage() {
    return (
        <PersonaProvider>
            <LoggingProjectDataProvider initialData={projectData}>
                <AppShell personnel={personnel} version={version}>
                    <div>
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                                Activities
                            </h1>
                            <p className="text-zinc-600 dark:text-zinc-400">
                                Individual work items and their assignments
                            </p>
                        </div>
                        <ActivitiesListWithCRUD personnel={personnel} />
                    </div>
                </AppShell>
            </LoggingProjectDataProvider>
        </PersonaProvider>
    );
}
