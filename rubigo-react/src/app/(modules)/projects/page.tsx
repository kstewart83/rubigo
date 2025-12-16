import { AppShell } from "@/components/layout/app-shell";
import { PersonaProvider } from "@/contexts/persona-context";
import { LoggingProjectDataProvider } from "@/contexts/logging-project-data-provider";
import { getAllPersonnel } from "@/lib/personnel";
import { getProjectData } from "@/lib/projects";
import { ProjectOverviewWithCRUD } from "./project-overview-crud";

// Get data at build time
const personnel = getAllPersonnel();
const projectData = getProjectData();

function ProjectsContent() {
    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                    Project Management
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400">
                    Strategic objectives, KPIs, and initiative tracking
                </p>
            </div>

            <ProjectOverviewWithCRUD />
        </div>
    );
}

export default function ProjectsPage() {
    return (
        <PersonaProvider>
            <LoggingProjectDataProvider initialData={projectData}>
                <AppShell personnel={personnel}>
                    <ProjectsContent />
                </AppShell>
            </LoggingProjectDataProvider>
        </PersonaProvider>
    );
}

