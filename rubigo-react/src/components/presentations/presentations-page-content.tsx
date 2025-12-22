"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Presentation, Play, MoreVertical, Trash2, Edit } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePersona } from "@/contexts/persona-context";

// ============================================================================
// Types
// ============================================================================

interface Presentation {
    id: number;
    title: string;
    slideCount: number;
    createdAt: string;
    updatedAt: string;
}

// ============================================================================
// Main Component
// ============================================================================

export function PresentationsPageContent() {
    const { currentPersona } = usePersona();
    const [presentations, setPresentations] = useState<Presentation[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newTitle, setNewTitle] = useState("");

    // Fetch presentations on mount
    useEffect(() => {
        fetchPresentations();
    }, []);

    const fetchPresentations = async () => {
        try {
            const res = await fetch("/api/presentations");
            if (res.ok) {
                const data = await res.json();
                setPresentations(data.presentations || []);
            }
        } catch (err) {
            console.error("Failed to fetch presentations:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newTitle.trim()) return;

        try {
            const res = await fetch("/api/presentations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: newTitle,
                    createdBy: currentPersona?.id
                }),
            });

            if (res.ok) {
                const data = await res.json();
                // Navigate to editor
                window.location.href = `/presentations/${data.id}`;
            }
        } catch (err) {
            console.error("Failed to create presentation:", err);
        }

        setShowCreateDialog(false);
        setNewTitle("");
    };

    const handleDelete = async (id: number) => {
        try {
            const res = await fetch(`/api/presentations/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setPresentations((prev) => prev.filter((p) => p.id !== id));
            }
        } catch (err) {
            console.error("Failed to delete presentation:", err);
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Presentations</h1>
                    <p className="text-muted-foreground">
                        Create and deliver professional presentations
                    </p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Presentation
                </Button>
            </div>

            {/* Presentation Grid */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground">Loading presentations...</p>
                </div>
            ) : presentations.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <Presentation className="h-16 w-16 text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No presentations yet</h2>
                    <p className="text-muted-foreground mb-4">
                        Create your first presentation to get started
                    </p>
                    <Button onClick={() => setShowCreateDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Presentation
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {presentations.map((pres) => (
                        <Card
                            key={pres.id}
                            className="cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => {
                                window.location.href = `/presentations/${pres.id}`;
                            }}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <CardTitle className="text-lg truncate">
                                        {pres.title}
                                    </CardTitle>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger
                                            asChild
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.location.href = `/presentations/${pres.id}`;
                                                }}
                                            >
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.location.href = `/presentations/${pres.id}/present`;
                                                }}
                                            >
                                                <Play className="mr-2 h-4 w-4" />
                                                Present
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(pres.id);
                                                }}
                                                className="text-destructive"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <CardDescription>
                                    {pres.slideCount} slide{pres.slideCount !== 1 ? "s" : ""}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {/* Slide preview placeholder */}
                                <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                                    <Presentation className="h-8 w-8 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>New Presentation</DialogTitle>
                        <DialogDescription>
                            Enter a title for your new presentation
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="My Presentation"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleCreate();
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowCreateDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleCreate} disabled={!newTitle.trim()}>
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
