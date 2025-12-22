"use client";

/**
 * Screen Share Viewer
 * 
 * Video element that displays a shared screen stream.
 */

import React, { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useScreenShare } from "./ScreenShareProvider";

interface Props {
    roomId: string;
    className?: string;
}

export function ScreenShareViewer({ roomId, className }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const { joinAsViewer, stopViewing, isViewing, error } = useScreenShare();
    const [isLoading, setIsLoading] = useState(true);

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

    if (error) {
        return (
            <div className={`flex items-center justify-center bg-zinc-900 text-white p-4 rounded ${className}`}>
                <p className="text-red-400">{error}</p>
            </div>
        );
    }

    return (
        <div className={`relative bg-black rounded overflow-hidden ${className}`}>
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
            {isViewing && (
                <div
                    className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded"
                    data-testid="screen-share-active"
                >
                    Live
                </div>
            )}
        </div>
    );
}
