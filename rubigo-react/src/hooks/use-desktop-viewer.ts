"use client";

/**
 * Desktop Viewer Hook
 *
 * React hook for managing Guacamole client connection.
 * Uses custom GuacClient for sharp rendering with devicePixelRatio compensation.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { GuacClient, type ConnectionState } from "@/lib/vdi/guac-client";
import type { DesktopConnection } from "@/types/virtual-desktop";

export type { ConnectionState };

interface UseDesktopViewerOptions {
    /** Canvas element ref for the display */
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    /** Connection parameters */
    connection: DesktopConnection | null;
    /** Callback when display resizes */
    onResize?: (width: number, height: number) => void;
}

interface UseDesktopViewerReturn {
    /** Current connection state */
    state: ConnectionState;
    /** Error message if state is 'error' */
    error: string | null;
    /** Connect to the desktop */
    connect: () => void;
    /** Disconnect from the desktop */
    disconnect: () => void;
    /** Toggle fullscreen */
    toggleFullscreen: () => void;
    /** Send mouse event */
    sendMouse: (x: number, y: number, buttonMask: number) => void;
    /** Send key event */
    sendKey: (keysym: number, pressed: boolean) => void;
}

/**
 * Hook for managing desktop viewer connection
 */
export function useDesktopViewer({
    canvasRef,
    connection,
    onResize,
}: UseDesktopViewerOptions): UseDesktopViewerReturn {
    const [state, setState] = useState<ConnectionState>("disconnected");
    const [error, setError] = useState<string | null>(null);
    const clientRef = useRef<GuacClient | null>(null);

    // Connect to the remote desktop
    const connect = useCallback(() => {
        console.log('[useDesktopViewer] connect called, connection:', !!connection, 'canvas:', !!canvasRef.current, 'client:', !!clientRef.current);

        if (!connection || !canvasRef.current) {
            setError("No connection parameters or canvas");
            setState("error");
            return;
        }

        setError(null);

        // Create client if needed or if connection params changed
        if (!clientRef.current) {
            console.log('[useDesktopViewer] Creating new GuacClient');
            clientRef.current = new GuacClient(canvasRef.current, {
                tunnelUrl: connection.tunnelUrl,
                vncHost: connection.connectionParams.hostname,
                vncPort: connection.connectionParams.port.toString(),
                vncPassword: connection.connectionParams.password,
                onStateChange: setState,
                onError: setError,
                onResize,
            });
        }

        clientRef.current.connect();
    }, [connection, canvasRef, onResize]);

    // Disconnect from the remote desktop
    const disconnect = useCallback(() => {
        if (clientRef.current) {
            clientRef.current.disconnect();
            clientRef.current = null;
        }
        setState("disconnected");
    }, []);

    // Toggle fullscreen
    const toggleFullscreen = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            canvas.requestFullscreen();
        }
    }, [canvasRef]);

    // Use isMounted ref to handle React Strict Mode double-mount
    const isMountedRef = useRef(true);

    // Cleanup on unmount - use slight delay to avoid Strict Mode race
    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
            // Delay cleanup to allow Strict Mode remount
            setTimeout(() => {
                if (!isMountedRef.current && clientRef.current) {
                    console.log('[useDesktopViewer] Cleanup - disconnecting');
                    clientRef.current.disconnect();
                    clientRef.current = null;
                }
            }, 100);
        };
    }, []);
    // Send mouse event
    const sendMouse = useCallback((x: number, y: number, buttonMask: number) => {
        if (clientRef.current) {
            clientRef.current.sendMouse(x, y, buttonMask);
        }
    }, []);

    // Send key event
    const sendKey = useCallback((keysym: number, pressed: boolean) => {
        if (clientRef.current) {
            clientRef.current.sendKey(keysym, pressed);
        }
    }, []);

    return {
        state,
        error,
        connect,
        disconnect,
        toggleFullscreen,
        sendMouse,
        sendKey,
    };
}
