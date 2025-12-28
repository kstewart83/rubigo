"use client";

/**
 * Event Context - Provides real-time SSE events to the React tree
 * 
 * Features:
 * - Automatic SSE connection on mount
 * - Reconnection with catch-up via ?after= param
 * - Event deduplication via sessionStorage
 * - Type-based subscription pattern
 */

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";

// Event types from server
export type EventType =
    | "presence.update"
    | "chat.message"
    | "chat.typing"
    | "calendar.update"
    | "personnel.update"
    | "notification"
    | "connection";

export interface SessionEvent {
    id: string;
    type: EventType;
    payload: unknown;
    timestamp?: string;
}

type EventHandler = (event: SessionEvent) => void;

interface EventContextValue {
    isConnected: boolean;
    lastEvent: SessionEvent | null;
    subscribe: (type: EventType, handler: EventHandler) => () => void;
}

const EventContext = createContext<EventContextValue | null>(null);

const LAST_EVENT_KEY = "rubigo_last_event_id";
const RECONNECT_DELAY = 3000; // 3 seconds

export function EventProvider({ children }: { children: React.ReactNode }) {
    const [isConnected, setIsConnected] = useState(false);
    const [lastEvent, setLastEvent] = useState<SessionEvent | null>(null);

    const handlers = useRef<Map<EventType, Set<EventHandler>>>(new Map());
    const seenIds = useRef<Set<string>>(new Set());
    const eventSourceRef = useRef<EventSource | null>(null);

    // Subscribe to event type
    const subscribe = useCallback((type: EventType, handler: EventHandler) => {
        if (!handlers.current.has(type)) {
            handlers.current.set(type, new Set());
        }
        handlers.current.get(type)!.add(handler);

        // Return unsubscribe function
        return () => {
            handlers.current.get(type)?.delete(handler);
        };
    }, []);

    // Dispatch event to subscribers
    const dispatch = useCallback((event: SessionEvent) => {
        // Deduplicate
        if (seenIds.current.has(event.id)) {
            return;
        }
        seenIds.current.add(event.id);

        // Store last event ID for reconnection
        if (event.type !== "connection") {
            try {
                sessionStorage.setItem(LAST_EVENT_KEY, event.id);
            } catch {
                // sessionStorage may be unavailable
            }
        }

        setLastEvent(event);

        // For presence updates, also dispatch a window custom event
        // This allows useActiveUsers to work outside EventProvider
        if (event.type === "presence.update") {
            window.dispatchEvent(new CustomEvent("presence-update", {
                detail: event.payload,
            }));
        }

        // Notify subscribers
        const typeHandlers = handlers.current.get(event.type);
        if (typeHandlers) {
            typeHandlers.forEach(handler => {
                try {
                    handler(event);
                } catch (err) {
                    console.error(`[EventContext] Handler error for ${event.type}:`, err);
                }
            });
        }
    }, []);

    // Setup SSE connection
    useEffect(() => {
        let reconnectTimeout: NodeJS.Timeout;
        let authCheckFailed = false;

        const connect = async () => {
            // Check if we have a valid session before connecting
            try {
                const checkRes = await fetch("/api/init");
                const checkData = await checkRes.json();
                if (!checkData.initialized) {
                    console.log("[EventContext] System not initialized, skipping SSE");
                    return;
                }
            } catch {
                // Ignore auth check errors
            }

            // Get last event ID for catch-up
            let afterParam = "";
            try {
                const lastId = sessionStorage.getItem(LAST_EVENT_KEY);
                if (lastId) {
                    afterParam = `?after=${encodeURIComponent(lastId)}`;
                }
            } catch {
                // sessionStorage unavailable
            }

            const source = new EventSource(`/api/events${afterParam}`);
            eventSourceRef.current = source;

            source.onopen = () => {
                setIsConnected(true);
                authCheckFailed = false;
                console.log("[EventContext] Connected");
            };

            source.onmessage = (e) => {
                try {
                    const event = JSON.parse(e.data) as SessionEvent;
                    dispatch(event);
                } catch (err) {
                    console.error("[EventContext] Parse error:", err);
                }
            };

            source.onerror = (e) => {
                setIsConnected(false);
                source.close();
                eventSourceRef.current = null;

                // Don't reconnect if auth failed (401)
                // EventSource doesn't expose status, so we use a flag
                if (authCheckFailed) {
                    console.log("[EventContext] Auth failed, not reconnecting");
                    return;
                }

                // Reconnect after delay
                console.log("[EventContext] Disconnected, reconnecting...");
                reconnectTimeout = setTimeout(connect, RECONNECT_DELAY);
            };
        };

        // Delay initial connection slightly to allow cookie to be set
        const initTimeout = setTimeout(connect, 500);

        return () => {
            clearTimeout(initTimeout);
            clearTimeout(reconnectTimeout);
            eventSourceRef.current?.close();
        };
    }, [dispatch]);

    // Acknowledge events periodically
    useEffect(() => {
        const ackInterval = setInterval(async () => {
            const ids = Array.from(seenIds.current);
            if (ids.length === 0) return;

            try {
                await fetch("/api/events", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ eventIds: ids }),
                });
                // Clear acknowledged IDs
                seenIds.current.clear();
            } catch {
                // Will retry next interval
            }
        }, 30000); // Every 30 seconds

        return () => clearInterval(ackInterval);
    }, []);

    return (
        <EventContext.Provider value={{ isConnected, lastEvent, subscribe }}>
            {children}
        </EventContext.Provider>
    );
}

/**
 * Hook to access event context
 */
export function useEventContext() {
    const context = useContext(EventContext);
    if (!context) {
        throw new Error("useEventContext must be used within EventProvider");
    }
    return context;
}
