"use client";

/**
 * Screen Share Context Provider
 * 
 * Manages screen share session state and WebRTC connections.
 */

import React, { createContext, useContext, useState, useCallback, useRef } from "react";

interface ScreenShareState {
    isSharing: boolean;
    isViewing: boolean;
    roomId: string | null;
    error: string | null;
}

interface ScreenShareContextValue extends ScreenShareState {
    startSharing: (roomId?: string) => Promise<string | null>;
    stopSharing: () => void;
    joinAsViewer: (roomId: string) => Promise<MediaStream | null>;
    stopViewing: () => void;
}

const ScreenShareContext = createContext<ScreenShareContextValue | null>(null);

export function useScreenShare() {
    const context = useContext(ScreenShareContext);
    if (!context) {
        throw new Error("useScreenShare must be used within ScreenShareProvider");
    }
    return context;
}

interface Props {
    children: React.ReactNode;
}

export function ScreenShareProvider({ children }: Props) {
    const [state, setState] = useState<ScreenShareState>({
        isSharing: false,
        isViewing: false,
        roomId: null,
        error: null,
    });

    const broadcasterPC = useRef<RTCPeerConnection | null>(null);
    const viewerPC = useRef<RTCPeerConnection | null>(null);
    const localStream = useRef<MediaStream | null>(null);

    const startSharing = useCallback(async (existingRoomId?: string): Promise<string | null> => {
        try {
            setState(s => ({ ...s, error: null }));

            // Request screen capture
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: false,
            });
            localStream.current = stream;

            // Create room
            const roomResponse = await fetch("/api/screen-share/rooms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roomId: existingRoomId }),
            });
            const roomData = await roomResponse.json();
            if (!roomData.success) {
                throw new Error(roomData.error || "Failed to create room");
            }
            const roomId = roomData.roomId;

            // Create peer connection
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
            });
            broadcasterPC.current = pc;

            // Add video track
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            // Handle stream end (user stops sharing via browser UI)
            stream.getVideoTracks()[0].onended = () => {
                stopSharing();
            };

            // Create and send offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            // Wait for ICE gathering
            await new Promise<void>(resolve => {
                if (pc.iceGatheringState === "complete") {
                    resolve();
                } else {
                    pc.onicegatheringstatechange = () => {
                        if (pc.iceGatheringState === "complete") resolve();
                    };
                }
            });

            // Exchange SDP with server
            const publishResponse = await fetch(`/api/screen-share/rooms/${roomId}/publish`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sdp: pc.localDescription?.sdp,
                    type: pc.localDescription?.type,
                }),
            });
            const publishData = await publishResponse.json();
            if (!publishData.success) {
                throw new Error(publishData.error || "Failed to publish");
            }

            // Set remote description (answer from SFU)
            await pc.setRemoteDescription({
                type: publishData.type,
                sdp: publishData.sdp,
            });

            setState({
                isSharing: true,
                isViewing: false,
                roomId,
                error: null,
            });

            return roomId;
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to start sharing";
            setState(s => ({ ...s, error: message }));
            stopSharing();
            return null;
        }
    }, []);

    const stopSharing = useCallback(() => {
        if (localStream.current) {
            localStream.current.getTracks().forEach(t => t.stop());
            localStream.current = null;
        }
        if (broadcasterPC.current) {
            broadcasterPC.current.close();
            broadcasterPC.current = null;
        }
        setState(s => ({
            ...s,
            isSharing: false,
            roomId: s.isViewing ? s.roomId : null,
        }));
    }, []);

    const joinAsViewer = useCallback(async (roomId: string): Promise<MediaStream | null> => {
        try {
            setState(s => ({ ...s, error: null }));

            // Create peer connection
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
            });
            viewerPC.current = pc;

            // Add transceiver to receive video
            pc.addTransceiver("video", { direction: "recvonly" });

            // Create and send offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            // Wait for ICE gathering
            await new Promise<void>(resolve => {
                if (pc.iceGatheringState === "complete") {
                    resolve();
                } else {
                    pc.onicegatheringstatechange = () => {
                        if (pc.iceGatheringState === "complete") resolve();
                    };
                }
            });

            // Exchange SDP with server
            const subscribeResponse = await fetch(`/api/screen-share/rooms/${roomId}/subscribe`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sdp: pc.localDescription?.sdp,
                    type: pc.localDescription?.type,
                }),
            });
            const subscribeData = await subscribeResponse.json();
            if (!subscribeData.success) {
                throw new Error(subscribeData.error || "Failed to subscribe");
            }

            // Set up track handler BEFORE setRemoteDescription to avoid race condition
            const streamPromise = new Promise<MediaStream>((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error("Timeout waiting for stream")), 10000);
                pc.ontrack = (event) => {
                    console.log("[Viewer] Received track:", event.track.kind);
                    clearTimeout(timeout);
                    resolve(event.streams[0] || new MediaStream([event.track]));
                };
            });

            // Set remote description - this triggers ontrack
            await pc.setRemoteDescription({
                type: subscribeData.type,
                sdp: subscribeData.sdp,
            });

            // Wait for remote track
            const stream = await streamPromise;

            setState({
                isSharing: false,
                isViewing: true,
                roomId,
                error: null,
            });

            return stream;
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to join as viewer";
            setState(s => ({ ...s, error: message }));
            stopViewing();
            return null;
        }
    }, []);

    const stopViewing = useCallback(() => {
        if (viewerPC.current) {
            viewerPC.current.close();
            viewerPC.current = null;
        }
        setState(s => ({
            ...s,
            isViewing: false,
            roomId: s.isSharing ? s.roomId : null,
        }));
    }, []);

    return (
        <ScreenShareContext.Provider
            value={{
                ...state,
                startSharing,
                stopSharing,
                joinAsViewer,
                stopViewing,
            }}
        >
            {children}
        </ScreenShareContext.Provider>
    );
}
