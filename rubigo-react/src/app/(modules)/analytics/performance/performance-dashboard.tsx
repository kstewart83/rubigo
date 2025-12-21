'use client';

import { useEffect, useState } from 'react';
import { fetchPerformanceData } from '../analytics-data';
import { TrendingUp, AlertCircle } from 'lucide-react';

interface RouteLatency {
    route: string;
    p50: number;
    p95: number;
    p99: number;
    avg: number;
    count: number;
}

interface RouteError {
    route: string;
    total: number;
    errors: number;
    error_pct: number;
}

interface WebVital {
    name: string;
    p50: number;
    p75: number;
    p95: number;
    good_pct: number;
    count: number;
}

interface PerformanceData {
    latency: RouteLatency[];
    errors: RouteError[];
    vitals: WebVital[];
    error: string | null;
}

function formatMs(ms: number): string {
    if (ms < 1) return '<1ms';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
}

function getLatencyColor(ms: number): string {
    if (ms < 100) return 'text-green-600 dark:text-green-400';
    if (ms < 500) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
}

export function PerformanceDashboard() {
    const [data, setData] = useState<PerformanceData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPerformanceData('24h')
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
            {/* Route Latency */}
            <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Route Latency
                </h2>
                {data?.latency && data.latency.length > 0 ? (
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        Route
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        p50
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        p95
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        p99
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        Requests
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {data.latency.map((row) => (
                                    <tr key={row.route}>
                                        <td className="px-6 py-4 text-sm font-mono text-zinc-900 dark:text-zinc-100">
                                            {row.route}
                                        </td>
                                        <td className={`px-6 py-4 text-sm text-right font-medium ${getLatencyColor(row.p50)}`}>
                                            {formatMs(row.p50)}
                                        </td>
                                        <td className={`px-6 py-4 text-sm text-right font-medium ${getLatencyColor(row.p95)}`}>
                                            {formatMs(row.p95)}
                                        </td>
                                        <td className={`px-6 py-4 text-sm text-right font-medium ${getLatencyColor(row.p99)}`}>
                                            {formatMs(row.p99)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 text-right">
                                            {row.count.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                        No latency data available
                    </div>
                )}
            </div>

            {/* Error Rates */}
            <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Error Rates by Route
                </h2>
                {data?.errors && data.errors.length > 0 ? (
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        Route
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        Total
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        Errors
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        Error Rate
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {data.errors.map((row) => (
                                    <tr key={row.route}>
                                        <td className="px-6 py-4 text-sm font-mono text-zinc-900 dark:text-zinc-100">
                                            {row.route}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 text-right">
                                            {row.total.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-red-600 dark:text-red-400 text-right font-medium">
                                            {row.errors.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span
                                                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${row.error_pct < 1
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                        : row.error_pct < 5
                                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                    }`}
                                            >
                                                {row.error_pct.toFixed(2)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                        No error data available (this is good!)
                    </div>
                )}
            </div>

            {/* Web Vitals Detail */}
            <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                    Web Vitals Detail
                </h2>
                {data?.vitals && data.vitals.length > 0 ? (
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        Metric
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        p50
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        p75
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        p95
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        Good %
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        Samples
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {data.vitals.map((row) => (
                                    <tr key={row.name}>
                                        <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                            {row.name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 text-right">
                                            {row.name === 'CLS' ? row.p50.toFixed(3) : `${Math.round(row.p50)}ms`}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 text-right">
                                            {row.name === 'CLS' ? row.p75.toFixed(3) : `${Math.round(row.p75)}ms`}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 text-right">
                                            {row.name === 'CLS' ? row.p95.toFixed(3) : `${Math.round(row.p95)}ms`}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span
                                                className={`text-sm font-medium ${row.good_pct >= 75
                                                        ? 'text-green-600 dark:text-green-400'
                                                        : row.good_pct >= 50
                                                            ? 'text-yellow-600 dark:text-yellow-400'
                                                            : 'text-red-600 dark:text-red-400'
                                                    }`}
                                            >
                                                {row.good_pct.toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 text-right">
                                            {row.count.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                        No Web Vitals data available
                    </div>
                )}
            </div>
        </div>
    );
}
