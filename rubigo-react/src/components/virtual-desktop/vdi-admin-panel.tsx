"use client";

/**
 * VDI Admin Panel
 *
 * Admin controls for VDI infrastructure.
 * Shows image status, VM state, and provides workflow controls.
 */

import { useState, useEffect, useCallback } from "react";
import {
    HardDrive,
    Play,
    Square,
    RefreshCcw,
    Loader2,
    CheckCircle2,
    XCircle,
    Wrench,
    Package,
    Server,
    Terminal,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePersona } from "@/contexts/persona-context";

interface ImageInfo {
    exists: boolean;
    size?: string;
}

interface VmStatus {
    status: "running" | "stopped";
    pid?: number;
    vncPort?: number;
    sshPort?: number;
}

interface AdminStatus {
    status: string;
    images: {
        work: ImageInfo;
        golden: ImageInfo;
        backup: ImageInfo;
    };
    vm: VmStatus;
}

interface ActionResult {
    action: string;
    success: boolean;
    output?: string;
    error?: string;
}

export function VdiAdminPanel() {
    const { currentPersona } = usePersona();
    const [status, setStatus] = useState<AdminStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [lastOutput, setLastOutput] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(true);

    // Get auth headers using persona ID
    const getAuthHeaders = useCallback(() => {
        return {
            "X-Persona-Id": currentPersona?.id || "",
            "Content-Type": "application/json",
        };
    }, [currentPersona]);

    const fetchStatus = useCallback(async () => {
        try {
            const response = await fetch("/api/virtual-desktop/admin", {
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                const data = await response.json();
                setStatus(data);
            } else {
                console.error("Failed to fetch admin status:", response.status);
            }
        } catch (error) {
            console.error("Failed to fetch admin status:", error);
        } finally {
            setLoading(false);
        }
    }, [getAuthHeaders]);

    useEffect(() => {
        fetchStatus();
        // Poll every 10 seconds
        const interval = setInterval(fetchStatus, 10000);
        return () => clearInterval(interval);
    }, [fetchStatus]);

    async function executeAction(action: string, confirmMessage?: string) {
        if (confirmMessage && !confirm(confirmMessage)) {
            return;
        }

        setActionLoading(action);
        setLastOutput(null);

        try {
            const response = await fetch("/api/virtual-desktop/admin", {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({ action }),
            });

            const result: ActionResult = await response.json();

            if (result.success) {
                toast.success(`${action} completed successfully`);
                setLastOutput(result.output || null);
            } else {
                toast.error(result.error || `${action} failed`);
                setLastOutput(result.output || result.error || null);
            }

            // Refresh status
            await fetchStatus();
        } catch (error) {
            toast.error(`Failed to execute ${action}`);
            console.error(error);
        } finally {
            setActionLoading(null);
        }
    }

    if (loading) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (!status) {
        return (
            <Card className="border-red-500/30 bg-red-500/5">
                <CardContent className="flex items-center gap-4 py-4">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <div className="flex-1">
                        <p className="font-medium">Admin API unavailable</p>
                        <p className="text-sm text-muted-foreground">
                            Make sure you&apos;re authenticated with a valid API token
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchStatus}>
                        Retry
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const vmRunning = status.vm.status === "running";

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
                <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-white/5 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Server className="h-5 w-5 text-purple-400" />
                                <div>
                                    <CardTitle className="text-lg">VDI Infrastructure</CardTitle>
                                    <CardDescription>
                                        Manage VM images and lifecycle
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        vmRunning
                                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                                            : "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
                                    )}
                                >
                                    {vmRunning ? "VM Running" : "VM Stopped"}
                                </Badge>
                                {isOpen ? (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                            </div>
                        </div>
                    </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <CardContent className="space-y-6 pt-0">
                        {/* Image Status */}
                        <div className="grid gap-3 sm:grid-cols-3">
                            <ImageCard
                                label="Work Image"
                                info={status.images.work}
                                description="Development image for customization"
                            />
                            <ImageCard
                                label="Golden Image"
                                info={status.images.golden}
                                description="Production-ready snapshot"
                                highlight
                            />
                            <ImageCard
                                label="Backup Image"
                                info={status.images.backup}
                                description="Previous golden backup"
                            />
                        </div>

                        {/* VM Status */}
                        {vmRunning && status.vm.pid && (
                            <div className="flex items-center gap-4 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-sm font-medium text-green-400">
                                        VM Running
                                    </span>
                                </div>
                                <div className="flex-1 text-sm text-muted-foreground">
                                    PID: {status.vm.pid} • VNC: localhost:{status.vm.vncPort} • SSH: localhost:{status.vm.sshPort}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                            {/* VM Control */}
                            {vmRunning ? (
                                <ActionButton
                                    icon={Square}
                                    label="Stop VM"
                                    action="stop"
                                    loading={actionLoading === "stop"}
                                    onClick={() => executeAction("stop")}
                                    variant="destructive"
                                />
                            ) : (
                                <>
                                    <ActionButton
                                        icon={Play}
                                        label="Start VM"
                                        action="start"
                                        loading={actionLoading === "start"}
                                        onClick={() => executeAction("start")}
                                        disabled={!status.images.golden.exists}
                                        title={!status.images.golden.exists ? "Golden image required" : undefined}
                                    />
                                    <ActionButton
                                        icon={Wrench}
                                        label="Start Dev Mode"
                                        action="start-dev"
                                        loading={actionLoading === "start-dev"}
                                        onClick={() => executeAction("start-dev")}
                                        disabled={!status.images.work.exists}
                                        variant="outline"
                                    />
                                </>
                            )}

                            {/* Workflow */}
                            <ActionButton
                                icon={Package}
                                label="Bake Image"
                                action="bake"
                                loading={actionLoading === "bake"}
                                onClick={() => executeAction("bake", "This will apply customizations to the running VM. Continue?")}
                                disabled={!vmRunning}
                                variant="outline"
                            />
                            <ActionButton
                                icon={HardDrive}
                                label="Finalize Golden"
                                action="finalize"
                                loading={actionLoading === "finalize"}
                                onClick={() => executeAction("finalize", "This will create a golden snapshot from the work image. The VM must be stopped. Continue?")}
                                disabled={vmRunning || !status.images.work.exists}
                                variant="outline"
                            />

                            {/* Utilities */}
                            <ActionButton
                                icon={Terminal}
                                label="Test SSH"
                                action="test-ssh"
                                loading={actionLoading === "test-ssh"}
                                onClick={() => executeAction("test-ssh")}
                                disabled={!vmRunning}
                                variant="ghost"
                            />
                            <ActionButton
                                icon={RefreshCcw}
                                label="Refresh"
                                action="refresh"
                                loading={loading}
                                onClick={fetchStatus}
                                variant="ghost"
                            />
                        </div>

                        {/* Output */}
                        {lastOutput && (
                            <div className="rounded-lg bg-zinc-900 border border-zinc-700 p-3 max-h-48 overflow-auto">
                                <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono">
                                    {lastOutput}
                                </pre>
                            </div>
                        )}
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}

function ImageCard({
    label,
    info,
    description,
    highlight,
}: {
    label: string;
    info: ImageInfo;
    description: string;
    highlight?: boolean;
}) {
    return (
        <div
            className={cn(
                "rounded-lg border p-3",
                highlight && info.exists
                    ? "border-purple-500/30 bg-purple-500/5"
                    : "border-zinc-700/50 bg-zinc-800/30"
            )}
        >
            <div className="flex items-center gap-2 mb-1">
                {info.exists ? (
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                ) : (
                    <XCircle className="h-4 w-4 text-zinc-500" />
                )}
                <span className="font-medium text-sm">{label}</span>
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
            {info.exists && info.size && (
                <p className="text-xs text-purple-300 mt-1">{info.size}</p>
            )}
        </div>
    );
}

function ActionButton({
    icon: Icon,
    label,
    action,
    loading,
    onClick,
    disabled,
    variant = "default",
    title,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    action: string;
    loading: boolean;
    onClick: () => void;
    disabled?: boolean;
    variant?: "default" | "destructive" | "outline" | "ghost";
    title?: string;
}) {
    return (
        <Button
            size="sm"
            variant={variant}
            onClick={onClick}
            disabled={disabled || loading}
            title={title}
        >
            {loading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
                <Icon className="h-4 w-4 mr-1" />
            )}
            {label}
        </Button>
    );
}
