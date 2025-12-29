"use client";

/**
 * Desktop Viewer Component
 *
 * Renders a remote desktop session using custom Guacamole client.
 * Handles display rendering with devicePixelRatio compensation for sharp text.
 */

import { useRef, useEffect, useState, useCallback, MouseEvent, WheelEvent, KeyboardEvent } from "react";
import { keyToKeysym, mouseButtonMask } from "@/lib/vdi/keysym";
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
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [displaySize, setDisplaySize] = useState({ width: 1920, height: 1080 });
    const [scale, setScale] = useState(1);

    // Handle resize from remote desktop
    const handleResize = useCallback((width: number, height: number) => {
        console.log(`[DesktopViewer] Remote display: ${width}x${height}`);
        setDisplaySize({ width, height });

        // Apply devicePixelRatio compensation for sharp rendering
        const dpr = window.devicePixelRatio || 1;
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.style.width = `${width / dpr}px`;
            canvas.style.height = `${height / dpr}px`;
        }
    }, []);

    const {
        state,
        error,
        connect,
        disconnect,
        toggleFullscreen,
        sendMouse,
        sendKey,
        cursorStyle,
    } = useDesktopViewer({
        canvasRef,
        connection,
        onResize: handleResize,
    });

    // Track button state for mouse events
    const buttonMaskRef = useRef(0);
    const lastMouseTimeRef = useRef(0);

    // Handle mouse events with throttling
    const handleMouseMove = useCallback((e: MouseEvent<HTMLCanvasElement>) => {
        if (state !== "connected") return;

        // Throttle to ~60fps to prevent flooding
        const now = Date.now();
        if (now - lastMouseTimeRef.current < 16) return;
        lastMouseTimeRef.current = now;

        const rect = e.currentTarget.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        // Clamp coordinates to valid positive range within display
        const x = Math.max(0, Math.min(displaySize.width - 1, Math.round((e.clientX - rect.left) * dpr)));
        const y = Math.max(0, Math.min(displaySize.height - 1, Math.round((e.clientY - rect.top) * dpr)));
        sendMouse(x, y, buttonMaskRef.current);
    }, [state, sendMouse, displaySize]);

    const handleMouseDown = useCallback((e: MouseEvent<HTMLCanvasElement>) => {
        // Focus the canvas on click to enable keyboard input
        e.currentTarget.focus();
        if (state !== "connected") return;
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const x = Math.max(0, Math.min(displaySize.width - 1, Math.round((e.clientX - rect.left) * dpr)));
        const y = Math.max(0, Math.min(displaySize.height - 1, Math.round((e.clientY - rect.top) * dpr)));
        buttonMaskRef.current = mouseButtonMask(e.buttons);
        sendMouse(x, y, buttonMaskRef.current);
    }, [state, sendMouse, displaySize]);

    const handleMouseUp = useCallback((e: MouseEvent<HTMLCanvasElement>) => {
        if (state !== "connected") return;
        const rect = e.currentTarget.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const x = Math.max(0, Math.min(displaySize.width - 1, Math.round((e.clientX - rect.left) * dpr)));
        const y = Math.max(0, Math.min(displaySize.height - 1, Math.round((e.clientY - rect.top) * dpr)));
        buttonMaskRef.current = mouseButtonMask(e.buttons);
        sendMouse(x, y, buttonMaskRef.current);
    }, [state, sendMouse, displaySize]);

    const handleWheel = useCallback((e: WheelEvent<HTMLCanvasElement>) => {
        if (state !== "connected") return;
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const x = Math.max(0, Math.min(displaySize.width - 1, Math.round((e.clientX - rect.left) * dpr)));
        const y = Math.max(0, Math.min(displaySize.height - 1, Math.round((e.clientY - rect.top) * dpr)));
        // Send wheel event
        const mask = mouseButtonMask(0, e.deltaY);
        sendMouse(x, y, mask);
        // Then send release
        setTimeout(() => sendMouse(x, y, 0), 50);
    }, [state, sendMouse, displaySize]);

    // Handle keyboard events
    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLCanvasElement>) => {
        if (state !== "connected") return;
        e.preventDefault();
        const keysym = keyToKeysym(e.nativeEvent);
        if (keysym !== null) {
            sendKey(keysym, true);
        }
    }, [state, sendKey]);

    const handleKeyUp = useCallback((e: KeyboardEvent<HTMLCanvasElement>) => {
        if (state !== "connected") return;
        e.preventDefault();
        const keysym = keyToKeysym(e.nativeEvent);
        if (keysym !== null) {
            sendKey(keysym, false);
        }
    }, [state, sendKey]);

    // Track if we've attempted connection to prevent retry loops
    const hasAttemptedRef = useRef(false);

    // Auto-connect when connection params are first provided
    useEffect(() => {
        if (connection && state === "disconnected" && !hasAttemptedRef.current) {
            hasAttemptedRef.current = true;
            connect();
        }
        // Reset when connection is cleared
        if (!connection) {
            hasAttemptedRef.current = false;
        }
    }, [connection, state, connect]);

    // Handle disconnect
    const handleDisconnect = () => {
        disconnect();
        onDisconnect();
    };

    // Calculate CSS size with DPR compensation
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const cssWidth = displaySize.width / dpr;
    const cssHeight = displaySize.height / dpr;

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
                    "flex-1 relative overflow-auto",
                    "flex items-start justify-center p-4",
                    state !== "connected" && "opacity-50"
                )}
                style={{ backgroundColor: "#1a1a2e" }}
            >
                <canvas
                    ref={canvasRef}
                    tabIndex={0}
                    width={displaySize.width}
                    height={displaySize.height}
                    style={{
                        width: `${cssWidth}px`,
                        height: `${cssHeight}px`,
                        imageRendering: 'pixelated',
                        outline: 'none',
                        cursor: cursorStyle,
                    }}
                    className="bg-black focus:ring-2 focus:ring-purple-500"
                    onMouseMove={handleMouseMove}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onWheel={handleWheel}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyUp}
                    onMouseEnter={(e) => e.currentTarget.focus()}
                    onMouseLeave={(e) => e.currentTarget.blur()}
                    onContextMenu={(e) => e.preventDefault()}
                />
            </div>
        </div>
    );
}
