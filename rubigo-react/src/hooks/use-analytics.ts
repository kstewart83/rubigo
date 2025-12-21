'use client';

/**
 * useAnalytics Hook
 * 
 * Client-side hook for tracking user interactions and page views.
 * Integrates with OpenTelemetry trace context for drill-down capability.
 */

import { useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trace, context } from '@opentelemetry/api';
import { logAnalyticsEvent } from '@/lib/actions/analytics-actions';

// Generate a session ID that persists across navigations
function getSessionId(): string {
    if (typeof window === 'undefined') return '';

    let sessionId = sessionStorage.getItem('rubigo_session_id');
    if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        sessionStorage.setItem('rubigo_session_id', sessionId);
    }
    return sessionId;
}

// Get current trace ID from OTel context (if available)
function getCurrentTraceId(): string | undefined {
    const span = trace.getActiveSpan();
    return span?.spanContext().traceId;
}

export interface UseAnalyticsOptions {
    /** Automatically track page views on mount and navigation */
    autoTrackPageViews?: boolean;
}

export interface TrackEventOptions {
    /** Event properties */
    properties?: Record<string, unknown>;
    /** Duration in milliseconds */
    durationMs?: number;
}

export function useAnalytics(options: UseAnalyticsOptions = {}) {
    const { autoTrackPageViews = true } = options;
    const pathname = usePathname();
    const lastPathRef = useRef<string | null>(null);
    const sessionId = typeof window !== 'undefined' ? getSessionId() : undefined;

    /**
     * Track a feature event (user interaction)
     */
    const trackEvent = useCallback(
        async (eventName: string, options?: TrackEventOptions) => {
            const traceId = getCurrentTraceId();

            await logAnalyticsEvent({
                eventType: 'feature',
                eventName,
                properties: options?.properties,
                sessionId,
                traceId,
                durationMs: options?.durationMs,
            });
        },
        [sessionId]
    );

    /**
     * Track a page view
     */
    const trackPageView = useCallback(
        async (path?: string) => {
            const targetPath = path || pathname;
            const traceId = getCurrentTraceId();

            await logAnalyticsEvent({
                eventType: 'page_view',
                eventName: targetPath,
                sessionId,
                traceId,
            });
        },
        [pathname, sessionId]
    );

    // Auto-track page views on navigation
    useEffect(() => {
        if (!autoTrackPageViews) return;
        if (pathname === lastPathRef.current) return;

        lastPathRef.current = pathname;
        trackPageView(pathname);
    }, [pathname, autoTrackPageViews, trackPageView]);

    return {
        trackEvent,
        trackPageView,
        sessionId,
    };
}
