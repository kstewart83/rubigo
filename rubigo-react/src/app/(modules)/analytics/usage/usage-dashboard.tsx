'use client';

import { useEffect, useState } from 'react';
import { fetchUsageData } from '../analytics-data';
import { BarChart3, FileText, Users } from 'lucide-react';

interface ModuleUsage {
    module: string;
    event_count: number;
    unique_sessions: number;
}

interface PageView {
    path: string;
    views: number;
    unique_sessions: number;
}

interface UsageData {
    modules: ModuleUsage[];
    pages: PageView[];
    sessions: number;
    error: string | null;
}

function ModuleCard({ module }: { module: ModuleUsage }) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 capitalize">
                    {module.module}
                </span>
                <BarChart3 className="h-4 w-4 text-zinc-400" />
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {module.event_count.toLocaleString()}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {module.unique_sessions} unique sessions
            </p>
        </div>
    );
}

export function UsageDashboard() {
    const [data, setData] = useState<UsageData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsageData('24h')
            .then(setData)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (data?.error) {
        return (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-yellow-800 dark:text-yellow-200">{data.error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Active Sessions Summary */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-lg">
                        <Users className="h-8 w-8" />
                    </div>
                    <div>
                        <p className="text-sm opacity-80">Active Sessions (Last Hour)</p>
                        <p className="text-4xl font-bold">{data?.sessions ?? 0}</p>
                    </div>
                </div>
            </div>

            {/* Module Usage */}
            <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Feature Usage by Module
                </h2>
                {data?.modules && data.modules.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {data.modules.map((module) => (
                            <ModuleCard key={module.module} module={module} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No feature usage data yet</p>
                        <p className="text-sm mt-1">
                            Use the useAnalytics hook to track feature events
                        </p>
                    </div>
                )}
            </div>

            {/* Top Pages */}
            <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Page Views
                </h2>
                {data?.pages && data.pages.length > 0 ? (
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        Page
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        Views
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        Unique Sessions
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        Views/Session
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {data.pages.map((page, i) => (
                                    <tr key={page.path}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500 w-6">
                                                    #{i + 1}
                                                </span>
                                                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                                    {page.path}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 text-right">
                                            {page.views.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 text-right">
                                            {page.unique_sessions.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 text-right">
                                            {(page.views / Math.max(page.unique_sessions, 1)).toFixed(1)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                        No page view data available
                    </div>
                )}
            </div>
        </div>
    );
}
