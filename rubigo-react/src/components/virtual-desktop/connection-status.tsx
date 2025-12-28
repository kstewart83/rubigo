"use client";

/**
 * Connection Status Component
 *
 * Overlay shown when desktop is not connected.
 * Displays connection state and provides connect/retry actions.
 */

import { Loader2, WifiOff, AlertCircle, MonitorPlay } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ConnectionState } from "@/hooks/use-desktop-viewer";

interface ConnectionStatusProps {
    state: ConnectionState;
    error: string | null;
    onConnect: () => void;
    onRetry: () => void;
}

export function ConnectionStatus({
    state,
    error,
    onConnect,
    onRetry,
}: ConnectionStatusProps) {
    return (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-900/80 backdrop-blur-sm">
            <div className="text-center space-y-4">
                {state === "connecting" && (
                    <>
                        <Loader2 className="h-12 w-12 text-purple-400 animate-spin mx-auto" />
                        <p className="text-lg text-zinc-300">Connecting to desktop...</p>
                    </>
                )}

                {state === "disconnected" && (
                    <>
                        <WifiOff className="h-12 w-12 text-zinc-500 mx-auto" />
                        <p className="text-lg text-zinc-300">Not connected</p>
                        <Button onClick={onConnect} className="mt-4">
                            <MonitorPlay className="h-4 w-4 mr-2" />
                            Connect
                        </Button>
                    </>
                )}

                {state === "error" && (
                    <>
                        <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
                        <p className="text-lg text-zinc-300">Connection failed</p>
                        {error && <p className="text-sm text-red-400">{error}</p>}
                        <Button onClick={onRetry} variant="outline" className="mt-4">
                            Retry Connection
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
