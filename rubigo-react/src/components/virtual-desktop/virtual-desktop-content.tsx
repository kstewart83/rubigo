"use client";

/**
 * Virtual Desktop Page Content
 *
 * Main page for managing virtual desktops.
 * Shows list of user's desktops and allows creating/connecting to them.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    Laptop,
    Play,
    Square,
    Trash2,
    Loader2,
    Server,
    AlertCircle,
    RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { VirtualDesktop, DesktopTemplateInfo } from "@/types/virtual-desktop";
import { cn } from "@/lib/utils";

import { usePersona } from "@/contexts/persona-context";

export function VirtualDesktopContent() {
    const router = useRouter();
    const { currentPersona } = usePersona();
    const [desktops, setDesktops] = useState<VirtualDesktop[]>([]);
    const [templates, setTemplates] = useState<DesktopTemplateInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [infraStatus, setInfraStatus] = useState<{
        installed: boolean;
        version?: string;
    } | null>(null);

    // Create dialog state
    const [createOpen, setCreateOpen] = useState(false);
    const [createName, setCreateName] = useState("");
    const [createTemplate, setCreateTemplate] = useState("");
    const [creating, setCreating] = useState(false);

    // Action loading states
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

    // Auth headers using persona ID
    const authHeaders = {
        "X-Persona-Id": currentPersona?.id || "",
        "Content-Type": "application/json",
    };

    // Fetch data on mount and when persona changes
    useEffect(() => {
        if (currentPersona) {
            fetchData();
        }
    }, [currentPersona]);

    async function fetchData() {
        setLoading(true);
        try {
            const [desktopsRes, templatesRes, infraRes] = await Promise.all([
                fetch("/api/virtual-desktop", { headers: authHeaders }),
                fetch("/api/virtual-desktop?templates=true"),
                fetch("/api/virtual-desktop/infra", { headers: authHeaders }),
            ]);

            if (desktopsRes.ok) {
                setDesktops(await desktopsRes.json());
            }
            if (templatesRes.ok) {
                setTemplates(await templatesRes.json());
            }
            if (infraRes.ok) {
                const infra = await infraRes.json();
                setInfraStatus(infra.cloudHypervisor);
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
            toast.error("Failed to load virtual desktop data");
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate() {
        if (!createName || !createTemplate) return;

        setCreating(true);
        try {
            const response = await fetch("/api/virtual-desktop", {
                method: "POST",
                headers: authHeaders,
                body: JSON.stringify({ name: createName, template: createTemplate }),
            });

            if (response.ok) {
                const desktop = await response.json();
                setDesktops((prev) => [desktop, ...prev]);
                setCreateOpen(false);
                setCreateName("");
                setCreateTemplate("");
                toast.success(`${desktop.name} is ready to start`);
            } else {
                const error = await response.json();
                throw new Error(error.error || "Failed to create desktop");
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create desktop");
        } finally {
            setCreating(false);
        }
    }

    async function handleAction(desktopId: string, action: "start" | "stop" | "destroy") {
        setActionLoading((prev) => ({ ...prev, [desktopId]: true }));

        try {
            if (action === "destroy") {
                const response = await fetch(`/api/virtual-desktop/${desktopId}`, {
                    method: "DELETE",
                    headers: authHeaders,
                });

                if (response.ok) {
                    setDesktops((prev) => prev.filter((d) => d.id !== desktopId));
                    toast.success("Desktop has been removed");
                } else {
                    throw new Error("Failed to delete desktop");
                }
            } else {
                const response = await fetch(`/api/virtual-desktop/${desktopId}`, {
                    method: "PATCH",
                    headers: authHeaders,
                    body: JSON.stringify({ action }),
                });

                if (response.ok) {
                    const updated = await response.json();
                    setDesktops((prev) =>
                        prev.map((d) => (d.id === desktopId ? updated : d))
                    );
                    toast.success(`Desktop is now ${updated.status}`);
                } else {
                    const error = await response.json();
                    throw new Error(error.error || `Failed to ${action} desktop`);
                }
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : `Failed to ${action} desktop`);
        } finally {
            setActionLoading((prev) => ({ ...prev, [desktopId]: false }));
        }
    }

    function handleConnect(desktop: VirtualDesktop) {
        router.push(`/virtual-desktop/${desktop.id}`);
    }

    function getStatusColor(status: string) {
        switch (status) {
            case "running":
                return "bg-green-500/20 text-green-400 border-green-500/30";
            case "starting":
            case "stopping":
                return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
            case "stopped":
                return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
            case "error":
                return "bg-red-500/20 text-red-400 border-red-500/30";
            default:
                return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Virtual Desktops</h1>
                    <p className="text-muted-foreground">
                        Access your cloud desktops from anywhere
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={fetchData}>
                        <RefreshCcw className="h-4 w-4 mr-1" />
                        Refresh
                    </Button>
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-1" />
                                New Desktop
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Virtual Desktop</DialogTitle>
                                <DialogDescription>
                                    Choose a template and name for your new desktop
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="My Development Desktop"
                                        value={createName}
                                        onChange={(e) => setCreateName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="template">Template</Label>
                                    <Select value={createTemplate} onValueChange={setCreateTemplate}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a template" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {templates.map((template) => (
                                                <SelectItem key={template.id} value={template.id}>
                                                    <div className="flex flex-col">
                                                        <span>{template.name}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {template.cpus} CPUs, {template.memoryMb}MB RAM
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreate}
                                    disabled={creating || !createName || !createTemplate}
                                >
                                    {creating && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                                    Create
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Infrastructure Status */}
            {infraStatus && !infraStatus.installed && (
                <Card className="border-yellow-500/30 bg-yellow-500/5">
                    <CardContent className="flex items-center gap-4 py-4">
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                        <div className="flex-1">
                            <p className="font-medium">Cloud Hypervisor not installed</p>
                            <p className="text-sm text-muted-foreground">
                                VMs cannot be started until Cloud Hypervisor is installed
                            </p>
                        </div>
                        <Button variant="outline" size="sm">
                            Install Now
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Desktop Grid */}
            {desktops.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Laptop className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No desktops yet</h3>
                        <p className="text-muted-foreground text-center max-w-sm mb-4">
                            Create your first virtual desktop to get started with cloud computing
                        </p>
                        <Button onClick={() => setCreateOpen(true)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Create Desktop
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {desktops.map((desktop) => {
                        const isLoading = actionLoading[desktop.id];
                        const isRunning = desktop.status === "running";

                        return (
                            <Card key={desktop.id} className="relative">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <Server className="h-5 w-5 text-purple-400" />
                                            <CardTitle className="text-lg">{desktop.name}</CardTitle>
                                        </div>
                                        <Badge variant="outline" className={cn(getStatusColor(desktop.status))}>
                                            {desktop.status}
                                        </Badge>
                                    </div>
                                    <CardDescription>{desktop.template}</CardDescription>
                                </CardHeader>
                                <CardContent className="pb-3">
                                    <div className="text-sm text-muted-foreground space-y-1">
                                        <p>Created: {new Date(desktop.createdAt).toLocaleDateString()}</p>
                                        {desktop.lastAccessedAt && (
                                            <p>Last accessed: {new Date(desktop.lastAccessedAt).toLocaleDateString()}</p>
                                        )}
                                        {desktop.vncPort && <p>VNC Port: {desktop.vncPort}</p>}
                                    </div>
                                </CardContent>
                                <CardFooter className="gap-2">
                                    {isRunning ? (
                                        <>
                                            <Button
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => handleConnect(desktop)}
                                            >
                                                Connect
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleAction(desktop.id, "stop")}
                                                disabled={isLoading}
                                            >
                                                {isLoading ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Square className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => handleAction(desktop.id, "start")}
                                                disabled={isLoading || desktop.status === "error"}
                                            >
                                                {isLoading ? (
                                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                ) : (
                                                    <Play className="h-4 w-4 mr-1" />
                                                )}
                                                Start
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-400 hover:text-red-300"
                                                onClick={() => handleAction(desktop.id, "destroy")}
                                                disabled={isLoading}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
