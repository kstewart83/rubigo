import { AppShell } from "@/components/layout/app-shell";
import { PersonaProvider } from "@/contexts/persona-context";
import { LoggingProjectDataProvider } from "@/contexts/logging-project-data-provider";
import { getAllPersonnel } from "@/lib/personnel";
import { getProjectData } from "@/lib/projects";
import { FeaturesListWithCRUD } from "./features-list";

const personnel = getAllPersonnel();
const projectData = getProjectData();

export default function FeaturesPage() {
    return (
        <PersonaProvider>
            <LoggingProjectDataProvider initialData={projectData}>
                <AppShell personnel={personnel}>
                    <div>
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                                Features
                            </h1>
                            <p className="text-zinc-600 dark:text-zinc-400">
                                Capabilities that realize strategic objectives
                            </p>
                        </div>
                        <FeaturesListWithCRUD />
                    </div>
                </AppShell>
            </LoggingProjectDataProvider>
        </PersonaProvider>
    );
}
