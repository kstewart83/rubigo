import { AppShell } from "@/components/layout/app-shell";
import { PersonaProvider } from "@/contexts/persona-context";
import { getAllPersonnel } from "@/lib/personnel";
import { PersonnelTable } from "@/components/personnel-table";

// Get personnel data at build time
const personnel = getAllPersonnel();

function PersonnelContent() {
    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                    Personnel Directory
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400">
                    Browse and search the employee directory
                </p>
            </div>

            <PersonnelTable personnel={personnel} />
        </div>
    );
}

export default function PersonnelPage() {
    return (
        <PersonaProvider>
            <AppShell personnel={personnel}>
                <PersonnelContent />
            </AppShell>
        </PersonaProvider>
    );
}
