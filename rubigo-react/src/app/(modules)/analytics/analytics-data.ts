'use server';

/**
 * Analytics Data Fetching
 * 
 * Server actions for fetching analytics data from DuckDB.
 */

import {
    getOverviewStats,
    getTraceLatencyPercentiles,
    getWebVitalsSummary,
    getErrorRateByRoute,
    getFeatureUsageByModule,
    getTopPages,
    getActiveSessions,
    type TimeRange,
} from '@/lib/analytics/analytics-queries';

export async function fetchOverviewData(range: TimeRange = '24h') {
    try {
        const [stats, vitals, topPages, sessions1h] = await Promise.all([
            getOverviewStats(range),
            getWebVitalsSummary(range),
            getTopPages(range, 5),
            getActiveSessions('1h'),
        ]);

        return { stats, vitals, topPages, sessions1h, error: null };
    } catch (error) {
        console.error('[Analytics] Failed to fetch overview data:', error);
        return {
            stats: null,
            vitals: [],
            topPages: [],
            sessions1h: 0,
            error: 'Failed to load analytics data'
        };
    }
}

export async function fetchPerformanceData(range: TimeRange = '24h') {
    try {
        const [latency, errors, vitals] = await Promise.all([
            getTraceLatencyPercentiles(range),
            getErrorRateByRoute(range),
            getWebVitalsSummary(range),
        ]);

        return { latency, errors, vitals, error: null };
    } catch (error) {
        console.error('[Analytics] Failed to fetch performance data:', error);
        return {
            latency: [],
            errors: [],
            vitals: [],
            error: 'Failed to load performance data'
        };
    }
}

export async function fetchUsageData(range: TimeRange = '24h') {
    try {
        const [modules, pages, sessions24h, sessions1h] = await Promise.all([
            getFeatureUsageByModule(range),
            getTopPages(range, 10),
            getActiveSessions('24h'),
            getActiveSessions('1h'),
        ]);

        return { modules, pages, sessions24h, sessions1h, error: null };
    } catch (error) {
        console.error('[Analytics] Failed to fetch usage data:', error);
        return {
            modules: [],
            pages: [],
            sessions24h: 0,
            sessions1h: 0,
            error: 'Failed to load usage data'
        };
    }
}
