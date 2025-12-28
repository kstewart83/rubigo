"use client";

/**
 * Virtual Desktop Session Page
 *
 * Displays the Guacamole remote desktop viewer for a specific desktop.
 */

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { DesktopViewer } from "@/components/virtual-desktop";
import type { VirtualDesktop, DesktopConnection } from "@/types/virtual-desktop";
import { Loader2 } from "lucide-react";

interface DesktopSessionPageProps {
    params: Promise<{ id: string }>;
}

export default function DesktopSessionPage({ params }: DesktopSessionPageProps) {
    const { id } = use(params);
    const router = useRouter();
    const [desktop, setDesktop] = useState<VirtualDesktop | null>(null);
    const [connection, setConnection] = useState<DesktopConnection | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchDesktopAndConnect() {
            try {
                // Get API token from localStorage or cookie
                const apiToken = localStorage.getItem("rubigo-api-token") || "";
                const headers = {
                    "Authorization": `Bearer ${apiToken}`,
                    "Content-Type": "application/json",
                };

                // Fetch desktop details
                const desktopRes = await fetch(`/api/virtual-desktop/${id}`, { headers });
                if (!desktopRes.ok) {
                    throw new Error("Desktop not found");
                }
                const desktopData = await desktopRes.json();
                setDesktop(desktopData);

                // Only get connection if running
                if (desktopData.status === "running") {
                    const connectRes = await fetch(`/api/virtual-desktop/${id}/connect`, {
                        method: "POST",
                        headers,
                    });
                    if (connectRes.ok) {
                        const connectionData = await connectRes.json();
                        setConnection(connectionData);
                    }
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load desktop");
            } finally {
                setLoading(false);
            }
        }

        fetchDesktopAndConnect();
    }, [id]);

    async function handleConnect() {
        if (!desktop) return;

        try {
            const apiToken = localStorage.getItem("rubigo-api-token") || "";
            const headers = {
                "Authorization": `Bearer ${apiToken}`,
                "Content-Type": "application/json",
            };

            // Start desktop if not running
            if (desktop.status !== "running") {
                const startRes = await fetch(`/api/virtual-desktop/${id}`, {
                    method: "PATCH",
                    headers,
                    body: JSON.stringify({ action: "start" }),
                });
                if (startRes.ok) {
                    const updated = await startRes.json();
                    setDesktop(updated);
                }
            }

            // Get connection info
            const connectRes = await fetch(`/api/virtual-desktop/${id}/connect`, {
                method: "POST",
                headers,
            });
            if (connectRes.ok) {
                const connectionData = await connectRes.json();
                setConnection(connectionData);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to connect");
        }
    }

    function handleDisconnect() {
        setConnection(null);
    }

    function handleBack() {
        router.push("/virtual-desktop");
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-zinc-900">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    if (error || !desktop) {
        return (
            <div className="flex items-center justify-center h-screen bg-zinc-900">
                <div className="text-center">
                    <p className="text-lg text-zinc-300">{error || "Desktop not found"}</p>
                    <button
                        onClick={handleBack}
                        className="mt-4 text-purple-400 hover:text-purple-300"
                    >
                        Back to Desktops
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen">
            <DesktopViewer
                desktop={desktop}
                connection={connection}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                onBack={handleBack}
            />
        </div>
    );
}
