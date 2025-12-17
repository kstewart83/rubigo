import { AppShell } from "@/components/layout/app-shell";
import { PersonaProvider } from "@/contexts/persona-context";
import { LoggingProjectDataProvider } from "@/contexts/logging-project-data-provider";
import { getAllPersonnel } from "@/lib/personnel";
import { getProjectData } from "@/lib/projects";
import { getVersion } from "@/lib/config";
import { ServicesListWithCRUD } from "./services-list";

const personnel = getAllPersonnel();
const projectData = getProjectData();
const version = getVersion();

export default function ServicesPage() {
    return (
        <PersonaProvider>
            <LoggingProjectDataProvider initialData={projectData}>
                <AppShell personnel={personnel} version={version}>
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
            </LoggingProjectDataProvider>
        </PersonaProvider>
    );
}
