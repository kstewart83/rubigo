'use client';

/**
 * Page View Tracker
 * 
 * Invisible component that tracks page views automatically.
 * Uses the useAnalytics hook with auto page view tracking.
 */

import { useAnalytics } from '@/hooks/use-analytics';

export function PageViewTracker() {
    // Hook automatically tracks page views on navigation
    useAnalytics({ autoTrackPageViews: true });

    // This component renders nothing
    return null;
}
