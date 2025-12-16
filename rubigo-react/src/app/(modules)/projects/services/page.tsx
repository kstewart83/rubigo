import { AppShell } from "@/components/layout/app-shell";
import { PersonaProvider } from "@/contexts/persona-context";
import { ProjectDataProvider } from "@/contexts/project-data-context";
import { getAllPersonnel } from "@/lib/personnel";
import { getProjectData } from "@/lib/projects";
import { ServicesListWithCRUD } from "./services-list";

const personnel = getAllPersonnel();
const projectData = getProjectData();

export default function ServicesPage() {
    return (
        <PersonaProvider>
            <ProjectDataProvider initialData={projectData}>
                <AppShell personnel={personnel}>
                    <div>
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                                Products & Services
                            </h1>
                            <p className="text-zinc-600 dark:text-zinc-400">
                                Manage your product and service portfolio
                            </p>
                        </div>
                        <ServicesListWithCRUD />
                    </div>
                </AppShell>
            </ProjectDataProvider>
        </PersonaProvider>
    );
}
