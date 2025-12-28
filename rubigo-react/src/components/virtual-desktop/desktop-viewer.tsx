"use client";

/**
 * Desktop Viewer Component
 *
 * Renders a remote desktop session using Guacamole.
 * Handles display rendering, input capture, and connection state.
 */

import { useRef, useEffect } from "react";
import { useDesktopViewer, type ConnectionState } from "@/hooks/use-desktop-viewer";
import { DesktopToolbar } from "./desktop-toolbar";
import { ConnectionStatus } from "./connection-status";
import type { DesktopConnection, VirtualDesktop } from "@/types/virtual-desktop";
import { cn } from "@/lib/utils";

interface DesktopViewerProps {
    /** Desktop metadata */
    desktop: VirtualDesktop;
    /** Connection parameters (null if not connected) */
    connection: DesktopConnection | null;
    /** Request connection handler */
    onConnect: () => void;
    /** Disconnect handler */
    onDisconnect: () => void;
    /** Go back handler */
    onBack: () => void;
    /** Custom class name */
    className?: string;
}

export function DesktopViewer({
    desktop,
    connection,
    onConnect,
    onDisconnect,
    onBack,
    className,
}: DesktopViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const {
        state,
        error,
        connect,
        disconnect,
        toggleFullscreen,
        scale,
        setScale,
    } = useDesktopViewer({
        containerRef: containerRef as React.RefObject<HTMLElement>,
        connection,
        captureKeyboard: true,
        captureMouse: true,
        autoScale: true,
    });

    // Auto-connect when connection params are provided
    useEffect(() => {
        if (connection && state === "disconnected") {
            connect();
        }
    }, [connection, state, connect]);

    // Handle disconnect
    const handleDisconnect = () => {
        disconnect();
        onDisconnect();
    };

    return (
        <div className={cn("flex flex-col h-full bg-black", className)}>
            {/* Toolbar */}
            <DesktopToolbar
                desktop={desktop}
                connectionState={state}
                scale={scale}
                onScaleChange={setScale}
                onDisconnect={handleDisconnect}
                onFullscreen={toggleFullscreen}
                onBack={onBack}
            />

            {/* Connection Status Overlay */}
            {state !== "connected" && (
                <ConnectionStatus
                    state={state}
                    error={error}
                    onConnect={onConnect}
                    onRetry={connect}
                />
            )}

            {/* Desktop Display Container */}
            <div
                ref={containerRef}
                className={cn(
                    "flex-1 relative overflow-hidden",
                    "flex items-center justify-center",
                    state !== "connected" && "opacity-50"
                )}
                style={{ backgroundColor: "#1a1a2e" }}
            >
                {/* Guacamole display will be appended here */}
            </div>
        </div>
    );
}
