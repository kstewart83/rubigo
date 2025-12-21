'use client';

/**
 * WebVitals Component
 * 
 * Collects Core Web Vitals (LCP, FCP, TTFB, CLS, INP) and reports them
 * to the analytics system for performance monitoring.
 * 
 * Add this component to your root layout.
 */

import { useReportWebVitals } from 'next/web-vitals';
import { logOtelMetric } from '@/lib/actions/analytics-actions';

/**
 * Get performance rating based on metric value
 * Based on web.dev thresholds
 */
function getRating(
    name: string,
    value: number
): 'good' | 'needs-improvement' | 'poor' {
    const thresholds: Record<string, [number, number]> = {
        LCP: [2500, 4000],        // Largest Contentful Paint
        FCP: [1800, 3000],        // First Contentful Paint
        CLS: [0.1, 0.25],         // Cumulative Layout Shift
        INP: [200, 500],          // Interaction to Next Paint
        TTFB: [800, 1800],        // Time to First Byte
        FID: [100, 300],          // First Input Delay (deprecated)
    };

    const [good, poor] = thresholds[name] || [1000, 3000];

    if (value <= good) return 'good';
    if (value <= poor) return 'needs-improvement';
    return 'poor';
}

export function WebVitals() {
    useReportWebVitals((metric) => {
        const rating = getRating(metric.name, metric.value);

        // Log as OTel metric
        logOtelMetric({
            name: `web_vital.${metric.name}`,
            type: 'gauge',
            value: metric.value,
            unit: metric.name === 'CLS' ? 'score' : 'ms',
            attributes: {
                rating,
                entryType: metric.id,
                navigationType: metric.navigationType,
            },
        });
    });

    // Component renders nothing - purely for side effects
    return null;
}
