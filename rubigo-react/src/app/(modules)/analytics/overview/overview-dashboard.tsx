'use client';

import { useEffect, useState } from 'react';
import { fetchOverviewData } from '../analytics-data';
import { Activity, AlertTriangle, Clock, Users } from 'lucide-react';

interface OverviewStats {
    active_sessions: number;
    total_requests: number;
    error_rate: number;
    avg_response_time: number;
}

interface WebVital {
    name: string;
    p50: number;
    good_pct: number;
}

interface PageView {
    path: string;
    views: number;
    unique_sessions: number;
}

interface OverviewData {
    stats: OverviewStats | null;
    vitals: WebVital[];
    topPages: PageView[];
    error: string | null;
}

function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
}: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: React.ElementType;
    trend?: 'up' | 'down' | 'neutral';
}) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        {title}
                    </p>
                    <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                        {value}
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                        {subtitle}
                    </p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
            </div>
        </div>
    );
}

function VitalCard({ vital }: { vital: WebVital }) {
    const rating =
        vital.good_pct >= 75 ? 'good' : vital.good_pct >= 50 ? 'needs-improvement' : 'poor';
    const colors = {
        good: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
        'needs-improvement': 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
        poor: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {vital.name}
                </span>
                <span
                    className={`text-xs font-medium px-2 py-1 rounded ${colors[rating]}`}
                >
                    {Math.round(vital.good_pct)}% good
                </span>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
                {vital.name === 'CLS' ? vital.p50.toFixed(3) : `${Math.round(vital.p50)}ms`}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">p50</p>
        </div>
    );
}

export function OverviewDashboard() {
    const [data, setData] = useState<OverviewData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOverviewData('24h')
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
                <p className="text-yellow-800 dark:text-yellow-200">
                    {data.error}. Analytics data requires OTel instrumentation to be active.
                </p>
            </div>
        );
    }

    const stats = data?.stats;

    return (
        <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Active Sessions"
                    value={stats?.active_sessions ?? 0}
                    subtitle="Last 24 hours"
                    icon={Users}
                />
                <StatCard
                    title="Total Requests"
                    value={Number(stats?.total_requests ?? 0).toLocaleString()}
                    subtitle="Last 24 hours"
                    icon={Activity}
                />
                <StatCard
                    title="Error Rate"
                    value={`${stats?.error_rate ?? 0}%`}
                    subtitle="Failed requests"
                    icon={AlertTriangle}
                />
                <StatCard
                    title="Avg Response Time"
                    value={`${Math.round(stats?.avg_response_time ?? 0)}ms`}
                    subtitle="Server-side"
                    icon={Clock}
                />
            </div>

            {/* Web Vitals */}
            {data?.vitals && data.vitals.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                        Core Web Vitals
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {data.vitals.map((vital) => (
                            <VitalCard key={vital.name} vital={vital} />
                        ))}
                    </div>
                </div>
            )}

            {/* Top Pages */}
            {data?.topPages && data.topPages.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                        Top Pages
                    </h2>
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
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {data.topPages.map((page) => (
                                    <tr key={page.path}>
                                        <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                            {page.path}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 text-right">
                                            {Number(page.views).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 text-right">
                                            {Number(page.unique_sessions).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Empty state */}
            {(!data?.vitals || data.vitals.length === 0) &&
                (!data?.topPages || data.topPages.length === 0) && (
                    <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No analytics data yet.</p>
                        <p className="text-sm mt-1">
                            Data will appear as users interact with the platform.
                        </p>
                    </div>
                )}
        </div>
    );
}
