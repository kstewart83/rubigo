"use client";

/**
 * usePresence - Send heartbeats and track user presence
 * 
 * Automatically sends heartbeats on:
 * - Initial mount
 * - Window focus
 * - User activity (mouse/keyboard)
 * - Periodic interval (every 60s)
 * 
 * Heartbeats can be paused when user manually sets away/offline status.
 */

import { useEffect, useRef, useCallback, useState } from "react";

const HEARTBEAT_INTERVAL = 60000; // 60 seconds
const ACTIVITY_DEBOUNCE = 5000; // 5 seconds

// Global flag to pause heartbeats when user manually sets status
declare global {
    interface Window {
        __presenceHeartbeatPaused?: boolean;
    }
}

/**
 * Pause automatic heartbeats (call when user manually sets away/offline)
 */
export function pauseHeartbeats() {
    if (typeof window !== "undefined") {
        window.__presenceHeartbeatPaused = true;
    }
}

/**
 * Resume automatic heartbeats (call when user sets online)
 */
export function resumeHeartbeats() {
    if (typeof window !== "undefined") {
        window.__presenceHeartbeatPaused = false;
    }
}

export function usePresence() {
    const [isOnline, setIsOnline] = useState(false);
    const lastActivity = useRef<number>(Date.now());

    const sendHeartbeat = useCallback(async () => {
        // Skip if heartbeats are paused (user manually set away/offline)
        if (typeof window !== "undefined" && window.__presenceHeartbeatPaused) {
            return;
        }

        try {
            const response = await fetch("/api/presence", { method: "POST" });
            if (response.ok) {
                setIsOnline(true);
            }
        } catch {
            // Ignore errors, will retry
        }
    }, []);

    // Handle user activity
    const handleActivity = useCallback(() => {
        // Skip if heartbeats are paused
        if (typeof window !== "undefined" && window.__presenceHeartbeatPaused) {
            return;
        }

        const now = Date.now();
        if (now - lastActivity.current > ACTIVITY_DEBOUNCE) {
            lastActivity.current = now;
            sendHeartbeat();
        }
    }, [sendHeartbeat]);

    useEffect(() => {
        // Initial heartbeat
        sendHeartbeat();

        // Periodic heartbeat
        const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

        // Activity listeners
        window.addEventListener("focus", sendHeartbeat);
        window.addEventListener("mousemove", handleActivity);
        window.addEventListener("keydown", handleActivity);

        // Cleanup - mark offline on unmount
        const markOffline = () => {
            navigator.sendBeacon?.("/api/presence", JSON.stringify({ offline: true }));
        };
        window.addEventListener("beforeunload", markOffline);

        return () => {
            clearInterval(interval);
            window.removeEventListener("focus", sendHeartbeat);
            window.removeEventListener("mousemove", handleActivity);
            window.removeEventListener("keydown", handleActivity);
            window.removeEventListener("beforeunload", markOffline);
        };
    }, [sendHeartbeat, handleActivity]);

    return { isOnline };
}

export type PresenceStatus = "online" | "away" | "offline";

export interface UserPresence {
    personnelId: string;
    status: PresenceStatus;
    lastSeen: string;
}

/**
 * useActiveUsers - Get list of online/away users
 * 
 * Uses SSE events for real-time updates, with initial fetch on mount.
 */
export function useActiveUsers() {
    const [users, setUsers] = useState<UserPresence[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUsers = useCallback(async () => {
        try {
            const response = await fetch("/api/presence");
            if (response.ok) {
                const data = await response.json();
                setUsers(data.users || []);
            }
        } catch {
            // Ignore errors
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial fetch + fallback polling (SSE is primary, poll is backup)
    useEffect(() => {
        fetchUsers();
        // Fallback poll every 10s in case SSE has issues
        const interval = setInterval(fetchUsers, 10000);
        return () => clearInterval(interval);
    }, [fetchUsers]);

    // Listen for real-time presence updates via SSE
    // Import dynamically to avoid SSR issues
    useEffect(() => {
        // We need to import useEvent dynamically since this hook may not be 
        // rendered inside EventProvider. Instead, listen to custom events.
        const handlePresenceUpdate = (event: CustomEvent) => {
            const { personnelId, status } = event.detail;
            setUsers(prev => {
                // Update existing user or add new one
                const existing = prev.find(u => u.personnelId === personnelId);
                if (existing) {
                    if (status === "offline") {
                        // Remove from list
                        return prev.filter(u => u.personnelId !== personnelId);
                    }
                    return prev.map(u =>
                        u.personnelId === personnelId
                            ? { ...u, status, lastSeen: new Date().toISOString() }
                            : u
                    );
                } else if (status !== "offline") {
                    // Add new user
                    return [...prev, { personnelId, status, lastSeen: new Date().toISOString() }];
                }
                return prev;
            });
        };

        window.addEventListener("presence-update", handlePresenceUpdate as EventListener);
        return () => {
            window.removeEventListener("presence-update", handlePresenceUpdate as EventListener);
        };
    }, []);

    return { users, isLoading, refetch: fetchUsers };
}
