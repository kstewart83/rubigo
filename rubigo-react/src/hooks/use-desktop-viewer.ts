"use client";

/**
 * Desktop Viewer Hook
 *
 * React hook for managing Guacamole client connection.
 * Handles connection lifecycle, input capture, and display scaling.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import type { DesktopConnection } from "@/types/virtual-desktop";

export type ConnectionState =
    | "disconnected"
    | "connecting"
    | "connected"
    | "error";

interface UseDesktopViewerOptions {
    /** Container element ref for the display */
    containerRef: React.RefObject<HTMLElement>;
    /** Connection parameters */
    connection: DesktopConnection | null;
    /** Enable keyboard input capture */
    captureKeyboard?: boolean;
    /** Enable mouse input capture */
    captureMouse?: boolean;
    /** Auto-scale display to container */
    autoScale?: boolean;
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
    /** Current scale factor */
    scale: number;
    /** Set scale factor */
    setScale: (scale: number) => void;
}

/**
 * Hook for managing desktop viewer connection
 */
export function useDesktopViewer({
    containerRef,
    connection,
    captureKeyboard = true,
    captureMouse = true,
    autoScale = true,
}: UseDesktopViewerOptions): UseDesktopViewerReturn {
    const [state, setState] = useState<ConnectionState>("disconnected");
    const [error, setError] = useState<string | null>(null);
    const [scale, setScale] = useState(1);

    // Guacamole client refs
    const clientRef = useRef<any>(null);
    const tunnelRef = useRef<any>(null);
    const keyboardRef = useRef<any>(null);
    const mouseRef = useRef<any>(null);

    // Connect to the remote desktop
    const connect = useCallback(async () => {
        if (!connection || !containerRef.current) {
            setError("No connection parameters or container");
            setState("error");
            return;
        }

        try {
            setState("connecting");
            setError(null);

            // Dynamic import to avoid SSR issues
            const Guacamole = await import("guacamole-common-js");

            // Create tunnel
            const tunnel = new Guacamole.WebSocketTunnel(connection.tunnelUrl);
            tunnelRef.current = tunnel;

            // Create client
            const client = new Guacamole.Client(tunnel);
            clientRef.current = client;

            // Get display element and append to container
            const display = client.getDisplay();
            const displayElement = display.getElement();
            displayElement.style.position = "absolute";
            displayElement.style.top = "0";
            displayElement.style.left = "0";
            containerRef.current.appendChild(displayElement);

            // Handle state changes
            client.onstatechange = (clientState: number) => {
                switch (clientState) {
                    case 0: // IDLE
                        setState("disconnected");
                        break;
                    case 1: // CONNECTING
                    case 2: // WAITING
                        setState("connecting");
                        break;
                    case 3: // CONNECTED
                        setState("connected");
                        break;
                    case 4: // DISCONNECTING
                    case 5: // DISCONNECTED
                        setState("disconnected");
                        break;
                }
            };

            // Handle errors
            client.onerror = (status: any) => {
                console.error("[DesktopViewer] Error:", status);
                setError(status.message || "Connection error");
                setState("error");
            };

            // Handle display resize
            display.onresize = (width: number, height: number) => {
                if (autoScale && containerRef.current) {
                    const containerWidth = containerRef.current.clientWidth;
                    const containerHeight = containerRef.current.clientHeight;
                    const scaleX = containerWidth / width;
                    const scaleY = containerHeight / height;
                    const newScale = Math.min(scaleX, scaleY, 1);
                    display.scale(newScale);
                    setScale(newScale);
                }
            };

            // Set up keyboard input
            if (captureKeyboard) {
                const keyboard = new Guacamole.Keyboard(document);
                keyboardRef.current = keyboard;

                keyboard.onkeydown = (keysym: number) => {
                    client.sendKeyEvent(true, keysym);
                    return false; // Prevent default
                };

                keyboard.onkeyup = (keysym: number) => {
                    client.sendKeyEvent(false, keysym);
                };
            }

            // Set up mouse input
            if (captureMouse) {
                const mouse = new Guacamole.Mouse(displayElement);
                mouseRef.current = mouse;

                mouse.onmousedown =
                    mouse.onmouseup =
                    mouse.onmousemove =
                    (mouseState: any) => {
                        client.sendMouseState(mouseState);
                    };
            }

            // Build connection string
            const params = new URLSearchParams({
                token: connection.token,
                hostname: connection.connectionParams.hostname,
                port: connection.connectionParams.port.toString(),
                protocol: connection.connectionParams.protocol,
            });

            if (connection.connectionParams.password) {
                params.set("password", connection.connectionParams.password);
            }

            // Connect
            client.connect(params.toString());
        } catch (err) {
            console.error("[DesktopViewer] Connection failed:", err);
            setError(err instanceof Error ? err.message : "Connection failed");
            setState("error");
        }
    }, [connection, containerRef, captureKeyboard, captureMouse, autoScale]);

    // Disconnect from the remote desktop
    const disconnect = useCallback(() => {
        if (keyboardRef.current) {
            keyboardRef.current.reset();
            keyboardRef.current = null;
        }

        if (clientRef.current) {
            clientRef.current.disconnect();
            clientRef.current = null;
        }

        if (tunnelRef.current) {
            tunnelRef.current.disconnect();
            tunnelRef.current = null;
        }

        // Remove display element
        if (containerRef.current) {
            const displayElement = containerRef.current.querySelector("div");
            if (displayElement) {
                containerRef.current.removeChild(displayElement);
            }
        }

        setState("disconnected");
    }, [containerRef]);

    // Toggle fullscreen
    const toggleFullscreen = useCallback(() => {
        if (!containerRef.current) return;

        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            containerRef.current.requestFullscreen();
        }
    }, [containerRef]);

    // Update scale manually
    const updateScale = useCallback(
        (newScale: number) => {
            if (clientRef.current) {
                const display = clientRef.current.getDisplay();
                display.scale(newScale);
                setScale(newScale);
            }
        },
        []
    );

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        state,
        error,
        connect,
        disconnect,
        toggleFullscreen,
        scale,
        setScale: updateScale,
    };
}
