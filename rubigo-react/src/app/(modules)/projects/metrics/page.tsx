import { AppShell } from "@/components/layout/app-shell";
import { PersonaProvider } from "@/contexts/persona-context";
import { ProjectDataProvider } from "@/contexts/project-data-context";
import { getAllPersonnel } from "@/lib/personnel";
import { getProjectData } from "@/lib/projects";
import { MetricsListWithCRUD } from "./metrics-list";

const personnel = getAllPersonnel();
const projectData = getProjectData();

export default function MetricsPage() {
    return (
        <PersonaProvider>
            <ProjectDataProvider initialData={projectData}>
                <AppShell personnel={personnel}>
                    <div>
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                                Metrics & KPIs
                            </h1>
                            <p className="text-zinc-600 dark:text-zinc-400">
                                Measurements and key performance indicators
                            </p>
                        </div>
                        <MetricsListWithCRUD />
                    </div>
                </AppShell>
            </ProjectDataProvider>
        </PersonaProvider>
    );
}
