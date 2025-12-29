"use client";

/**
 * useEvent - Subscribe to specific event types
 * 
 * Usage:
 * useEvent("chat.message", (event) => {
 *   console.log("New message:", event.payload);
 * });
 */

import { useEffect, useCallback } from "react";
import { useEventContext, type EventType, type SessionEvent } from "@/contexts/event-context";

export function useEvent(type: EventType, handler: (event: SessionEvent) => void) {
    const { subscribe } = useEventContext();

    // Memoize handler to prevent unnecessary resubscription
    const stableHandler = useCallback(handler, [handler]);

    useEffect(() => {
        return subscribe(type, stableHandler);
    }, [type, stableHandler, subscribe]);
}

/**
 * useEventConnection - Get SSE connection status
 */
export function useEventConnection() {
    const { isConnected } = useEventContext();
    return isConnected;
}

/**
 * useLastEvent - Get the most recent event
 */
export function useLastEvent() {
    const { lastEvent } = useEventContext();
    return lastEvent;
}
