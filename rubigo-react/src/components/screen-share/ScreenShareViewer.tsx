"use client";

/**
 * Screen Share Viewer
 * 
 * Video element that displays a shared screen stream with controls.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Maximize, Minimize, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScreenShare } from "./ScreenShareProvider";

interface Props {
    roomId: string;
    className?: string;
    onDisconnect?: () => void;
}

export function ScreenShareViewer({ roomId, className, onDisconnect }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const { joinAsViewer, stopViewing, isViewing, error } = useScreenShare();
    const [isLoading, setIsLoading] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        let mounted = true;

        async function connect() {
            setIsLoading(true);
            const stream = await joinAsViewer(roomId);

            if (!mounted) return;

            if (stream && videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsLoading(false);
            }
        }

        connect();

        return () => {
            mounted = false;
            stopViewing();
        };
    }, [roomId, joinAsViewer, stopViewing]);

    // Listen for fullscreen changes
    useEffect(() => {
        function handleFullscreenChange() {
            setIsFullscreen(!!document.fullscreenElement);
        }
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    const toggleFullscreen = useCallback(async () => {
        if (!containerRef.current) return;

        if (document.fullscreenElement) {
            await document.exitFullscreen();
        } else {
            await containerRef.current.requestFullscreen();
        }
    }, []);

    const handleDisconnect = useCallback(() => {
        stopViewing();
        onDisconnect?.();
    }, [stopViewing, onDisconnect]);

    if (error) {
        return (
            <div className={`flex items-center justify-center bg-zinc-900 text-white p-4 rounded ${className}`}>
                <p className="text-red-400">{error}</p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`relative bg-black rounded overflow-hidden group ${className}`}
        >
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                    <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                    <span className="ml-2 text-zinc-400">Connecting...</span>
                </div>
            )}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
                data-testid="screen-share-video"
            />

            {/* Controls overlay - visible on hover */}
            {isViewing && (
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-between">
                        <div
                            className="bg-green-600 text-white text-xs px-2 py-1 rounded"
                            data-testid="screen-share-active"
                        >
                            Live
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleFullscreen}
                                className="text-white hover:bg-white/20"
                                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                                data-testid="fullscreen-button"
                            >
                                {isFullscreen ? (
                                    <Minimize className="h-4 w-4" />
                                ) : (
                                    <Maximize className="h-4 w-4" />
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleDisconnect}
                                className="text-white hover:bg-red-500/50"
                                title="Disconnect"
                                data-testid="disconnect-button"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Fullscreen indicator */}
            {isViewing && !isLoading && (
                <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded group-hover:opacity-0 transition-opacity">
                    Live
                </div>
            )}
        </div>
    );
}
