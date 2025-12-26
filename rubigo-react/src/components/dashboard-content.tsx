"use client";

import { usePersona } from "@/contexts/persona-context";
import { ModuleHeader } from "@/components/module-header";

interface DashboardContentProps {
    personnelCount: number;
    version: string;
}

export function DashboardContent({ personnelCount, version }: DashboardContentProps) {
    const { currentPersona } = usePersona();

    // Get first name for greeting
    const firstName = currentPersona?.name.split(" ")[0] ?? "there";

    return (
        <div className="max-w-4xl">
            <ModuleHeader
                title={`Welcome back, ${firstName}!`}
                description={currentPersona ? `${currentPersona.title} • ${currentPersona.department}` : undefined}
            />

            <div className="grid gap-6 sm:grid-cols-2">
                <a
                    href="/personnel"
                    className="group block p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-orange-300 dark:hover:border-orange-800 hover:shadow-lg transition-all"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <span className="text-4xl">👥</span>
                        <div>
                            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                Personnel
                            </h2>
                            <p className="text-sm text-zinc-500">{personnelCount} employees</p>
                        </div>
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        View and manage employee directory, roles, and organizational structure.
                    </p>
                </a>

                <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 opacity-50">
                    <div className="flex items-center gap-4 mb-4">
                        <span className="text-4xl">📅</span>
                        <div>
                            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                                Calendar
                            </h2>
                            <p className="text-sm text-zinc-500">Coming soon</p>
                        </div>
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Schedule events, meetings, and manage time effectively.
                    </p>
                </div>
            </div>

            <p className="mt-8 text-xs text-zinc-400">v{version}</p>
        </div>
    );
}
