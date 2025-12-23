"use client";

/**
 * Screen Share Page Content
 * 
 * Main UI for the screen share module.
 */

import React, { useState } from "react";
import { ScreenShareProvider, ShareScreenButton, ScreenShareViewer, useScreenShare } from "./index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

function ScreenShareUI() {
    const { isSharing, isViewing, roomId, error } = useScreenShare();
    const [joinRoomId, setJoinRoomId] = useState("");
    const [activeViewRoomId, setActiveViewRoomId] = useState<string | null>(null);

    const handleJoin = () => {
        if (joinRoomId) {
            setActiveViewRoomId(joinRoomId);
        }
    };

    const handleDisconnect = () => {
        setActiveViewRoomId(null);
        setJoinRoomId("");
    };

    return (
        <div className="container mx-auto py-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">Screen Share</h1>
                <p className="text-muted-foreground">
                    Share your screen with colleagues for remote collaboration
                </p>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Start Sharing Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Share Your Screen</CardTitle>
                        <CardDescription>
                            Start broadcasting your screen to others
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ShareScreenButton />

                        {isSharing && roomId && (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                <p className="text-sm text-green-600 dark:text-green-400 mb-2">
                                    Screen sharing active!
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Room ID:</span>
                                    <code className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-sm font-mono">
                                        {roomId}
                                    </code>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Join as Viewer Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Watch a Screen Share
                        </CardTitle>
                        <CardDescription>
                            Enter a room ID to view someone&apos;s shared screen
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Enter room ID..."
                                value={joinRoomId}
                                onChange={e => setJoinRoomId(e.target.value)}
                                disabled={!!activeViewRoomId}
                                onKeyDown={e => e.key === "Enter" && handleJoin()}
                            />
                            <Button
                                variant="secondary"
                                disabled={!joinRoomId || !!activeViewRoomId}
                                onClick={handleJoin}
                            >
                                Join
                            </Button>
                        </div>

                        {activeViewRoomId && (
                            <p className="text-sm text-muted-foreground">
                                Connected to room: <code className="font-mono">{activeViewRoomId}</code>
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Viewer Area */}
            {activeViewRoomId && (
                <Card>
                    <CardContent className="p-0">
                        <ScreenShareViewer
                            roomId={activeViewRoomId}
                            className="aspect-video w-full"
                            onDisconnect={handleDisconnect}
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export function ScreenSharePageContent() {
    return (
        <ScreenShareProvider>
            <ScreenShareUI />
        </ScreenShareProvider>
    );
}
