import { AppShell } from "@/components/layout/app-shell";
import { PersonaProvider } from "@/contexts/persona-context";
import { ActionLogProvider } from "@/contexts/action-log-context";
import { getAllPersonnel } from "@/lib/personnel";
import { ActionLogList } from "./action-log-list";

const personnel = getAllPersonnel();

export default function ActionsPage() {
    return (
        <PersonaProvider>
            <ActionLogProvider>
                <AppShell personnel={personnel}>
                    <div>
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                                Action Logs
                            </h1>
                            <p className="text-zinc-600 dark:text-zinc-400">
                                Audit trail of all create, update, and delete operations
                            </p>
                        </div>
                        <ActionLogList />
                    </div>
                </AppShell>
            </ActionLogProvider>
        </PersonaProvider>
    );
}
