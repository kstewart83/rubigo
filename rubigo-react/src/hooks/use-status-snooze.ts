"use client";

/**
 * useStatusSnooze - Manage manual status snooze timer
 * 
 * When user sets away/offline, starts a countdown timer.
 * Stores snooze end time in localStorage for persistence.
 * Auto-resumes to online when timer expires.
 */

import { useState, useEffect, useCallback } from "react";
import { pauseHeartbeats, resumeHeartbeats } from "@/hooks/use-presence";

const STORAGE_KEY = "rubigo_status_snooze";
const DEFAULT_SNOOZE_HOURS = 1;

interface SnoozeState {
    status: "online" | "away" | "offline";
    expiresAt: number; // timestamp
}

export function useStatusSnooze() {
    const [snoozeState, setSnoozeState] = useState<SnoozeState | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<number>(0);

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const state = JSON.parse(stored) as SnoozeState;
                const now = Date.now();

                if (state.expiresAt > now) {
                    // Still active
                    setSnoozeState(state);
                    setTimeRemaining(state.expiresAt - now);
                    pauseHeartbeats();
                } else {
                    // Expired, clean up
                    localStorage.removeItem(STORAGE_KEY);
                    resumeHeartbeats();
                }
            } catch {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    }, []);

    // Countdown timer
    useEffect(() => {
        if (!snoozeState) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const remaining = snoozeState.expiresAt - now;

            if (remaining <= 0) {
                // Timer expired - resume online
                clearInterval(interval);
                setSnoozeState(null);
                setTimeRemaining(0);
                localStorage.removeItem(STORAGE_KEY);
                resumeHeartbeats();

                // Send online status to server
                fetch("/api/presence", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "online" }),
                }).catch(() => { });
            } else {
                setTimeRemaining(remaining);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [snoozeState]);

    // Set manual status with snooze
    const setStatus = useCallback((status: "online" | "away" | "offline", hours = DEFAULT_SNOOZE_HOURS) => {
        if (status === "online") {
            // Clear snooze and resume
            setSnoozeState(null);
            setTimeRemaining(0);
            localStorage.removeItem(STORAGE_KEY);
            resumeHeartbeats();
        } else {
            // Set snooze
            const expiresAt = Date.now() + hours * 60 * 60 * 1000;
            const state: SnoozeState = { status, expiresAt };
            setSnoozeState(state);
            setTimeRemaining(expiresAt - Date.now());
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            pauseHeartbeats();
        }

        // Update server
        fetch("/api/presence", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        }).catch(() => { });
    }, []);

    // Extend snooze by hours
    const extendSnooze = useCallback((hours: number) => {
        if (!snoozeState) return;

        const expiresAt = Date.now() + hours * 60 * 60 * 1000;
        const state: SnoozeState = { ...snoozeState, expiresAt };
        setSnoozeState(state);
        setTimeRemaining(expiresAt - Date.now());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [snoozeState]);

    // Format time remaining as "Xh Xm" or "Xm Xs"
    const formatTimeRemaining = useCallback(() => {
        if (timeRemaining <= 0) return "";

        const totalSeconds = Math.floor(timeRemaining / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m ${seconds}s`;
    }, [timeRemaining]);

    return {
        currentStatus: snoozeState?.status || "online",
        isSnoozing: !!snoozeState,
        timeRemaining,
        formattedTime: formatTimeRemaining(),
        setStatus,
        extendSnooze,
    };
}
