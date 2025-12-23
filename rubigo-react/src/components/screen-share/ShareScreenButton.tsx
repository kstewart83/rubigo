"use client";

/**
 * Share Screen Button
 * 
 * Button to start/stop screen sharing.
 */

import React from "react";
import { MonitorUp, MonitorOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScreenShare } from "./ScreenShareProvider";

interface Props {
    onRoomCreated?: (roomId: string) => void;
    className?: string;
}

export function ShareScreenButton({ onRoomCreated, className }: Props) {
    const { isSharing, startSharing, stopSharing, error } = useScreenShare();

    const handleClick = async () => {
        if (isSharing) {
            stopSharing();
        } else {
            const roomId = await startSharing();
            if (roomId && onRoomCreated) {
                onRoomCreated(roomId);
            }
        }
    };

    return (
        <Button
            variant={isSharing ? "destructive" : "outline"}
            size="sm"
            onClick={handleClick}
            className={className}
            data-testid={isSharing ? "stop-sharing-button" : "share-screen-button"}
            title={error || (isSharing ? "Stop Sharing" : "Share Screen")}
        >
            {isSharing ? (
                <>
                    <MonitorOff className="h-4 w-4 mr-2" />
                    Stop Sharing
                </>
            ) : (
                <>
                    <MonitorUp className="h-4 w-4 mr-2" />
                    Share Screen
                </>
            )}
        </Button>
    );
}
