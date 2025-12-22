"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Plus,
    Play,
    ChevronLeft,
    ChevronRight,
    Settings,
    Trash2,
    ArrowLeft,
    Save,
    GripVertical,
    Monitor,
    Download,
    Library,
} from "lucide-react";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { exportToPptx, downloadPptx } from "@/lib/presentations/export-pptx";

// ============================================================================
// Types
// ============================================================================

interface Slide {
    slideId: number;
    title: string | null;
    layout: string | null;
    content: Record<string, unknown>;
    contentJson: string;
    notes: string | null;
    position: number;
    verticalPosition: number | null;
}

interface Presentation {
    id: number;
    title: string;
    description: string | null;
    theme: string | null;
    transition: string | null;
}

interface Props {
    presentationId: string;
}

// ============================================================================
// Main Component
// ============================================================================

export function PresentationEditorContent({ presentationId }: Props) {
    const [presentation, setPresentation] = useState<Presentation | null>(null);
    const [slides, setSlides] = useState<Slide[]>([]);
    const [selectedSlide, setSelectedSlide] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Editing states
    const [editingTitle, setEditingTitle] = useState("");
    const [editingBody, setEditingBody] = useState("");
    const [editingNotes, setEditingNotes] = useState("");
    const [editingLayout, setEditingLayout] = useState("content");
    const [hasChanges, setHasChanges] = useState(false);

    // Insert existing slide dialog
    const [showInsertDialog, setShowInsertDialog] = useState(false);
    const [availableSlides, setAvailableSlides] = useState<{
        id: number;
        title: string;
        layout: string | null;
        usageCount: number;
        usedIn: string[];
    }[]>([]);

    // Sync editing states when slide changes
    useEffect(() => {
        const currentSlide = slides[selectedSlide];
        if (currentSlide) {
            setEditingTitle((currentSlide.content?.title as string) || currentSlide.title || "");
            setEditingBody((currentSlide.content?.body as string) || (currentSlide.content?.subtitle as string) || "");
            setEditingNotes(currentSlide.notes || "");
            setEditingLayout(currentSlide.layout || "content");
            setHasChanges(false);
        }
    }, [selectedSlide, slides]);

    // Fetch presentation data
    useEffect(() => {
        fetchPresentation();
    }, [presentationId]);

    const fetchPresentation = async () => {
        try {
            const res = await fetch(`/api/presentations/${presentationId}`);
            if (!res.ok) {
                setError("Presentation not found");
                return;
            }
            const data = await res.json();
            setPresentation(data.presentation);
            setSlides(data.slides || []);
        } catch (err) {
            console.error("Failed to fetch presentation:", err);
            setError("Failed to load presentation");
        } finally {
            setLoading(false);
        }
    };

    const handleAddSlide = async () => {
        try {
            const res = await fetch(`/api/presentations/${presentationId}/slides`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    layout: "content",
                    title: "New Slide",
                    content: { title: "New Slide", body: "Add content here..." },
                }),
            });

            if (res.ok) {
                await fetchPresentation();
                setSelectedSlide(slides.length); // Select the new slide
            }
        } catch (err) {
            console.error("Failed to add slide:", err);
        }
    };

    const fetchAvailableSlides = async () => {
        try {
            const res = await fetch(`/api/slides?excludePresentation=${presentationId}`);
            if (res.ok) {
                const data = await res.json();
                setAvailableSlides(data.slides || []);
            }
        } catch (err) {
            console.error("Failed to fetch available slides:", err);
        }
    };

    const openInsertDialog = async () => {
        await fetchAvailableSlides();
        setShowInsertDialog(true);
    };

    const handleInsertExisting = async (slideId: number) => {
        try {
            const res = await fetch(`/api/presentations/${presentationId}/slides`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    existingSlideId: slideId,
                }),
            });

            if (res.ok) {
                await fetchPresentation();
                setSelectedSlide(slides.length);
                setShowInsertDialog(false);
            }
        } catch (err) {
            console.error("Failed to insert slide:", err);
        }
    };

    const handleSaveSlide = async () => {
        const currentSlide = slides[selectedSlide];
        if (!currentSlide) return;

        setSaving(true);
        try {
            const res = await fetch(`/api/slides/${currentSlide.slideId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: editingTitle,
                    layout: editingLayout,
                    content: {
                        title: editingTitle,
                        body: editingBody,
                    },
                    notes: editingNotes,
                }),
            });

            if (res.ok) {
                await fetchPresentation();
                setHasChanges(false);
            }
        } catch (err) {
            console.error("Failed to save slide:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteSlide = async () => {
        const currentSlide = slides[selectedSlide];
        if (!currentSlide || slides.length <= 1) return;

        try {
            const res = await fetch(`/api/slides/${currentSlide.slideId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                const newIndex = Math.max(0, selectedSlide - 1);
                setSelectedSlide(newIndex);
                await fetchPresentation();
            }
        } catch (err) {
            console.error("Failed to delete slide:", err);
        }
    };

    const handleStartPresentation = () => {
        // Open presentation in fullscreen mode
        window.open(
            `/presentations/${presentationId}/present`,
            "_blank",
            "fullscreen=yes"
        );
    };

    const handleExportPptx = async () => {
        if (!presentation) return;

        setExporting(true);
        try {
            const exportSlides = slides.map((s) => ({
                slideId: s.slideId,
                title: s.title,
                layout: s.layout,
                content: s.content,
                notes: s.notes,
            }));

            const blob = await exportToPptx({
                presentation,
                slides: exportSlides,
            });

            const filename = presentation.title
                .replace(/[^a-zA-Z0-9\s]/g, "")
                .replace(/\s+/g, "_");
            downloadPptx(blob, filename);
        } catch (err) {
            console.error("Failed to export presentation:", err);
        } finally {
            setExporting(false);
        }
    };

    const handleFieldChange = (field: "title" | "body" | "notes" | "layout", value: string) => {
        setHasChanges(true);
        switch (field) {
            case "title":
                setEditingTitle(value);
                break;
            case "body":
                setEditingBody(value);
                break;
            case "notes":
                setEditingNotes(value);
                break;
            case "layout":
                setEditingLayout(value);
                break;
        }
    };

    // Save with Ctrl+S
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "s") {
                e.preventDefault();
                if (hasChanges) {
                    handleSaveSlide();
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [hasChanges, handleSaveSlide]);

    const currentSlide = slides[selectedSlide];

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">Loading presentation...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center">
                <h2 className="text-xl font-semibold mb-2">{error}</h2>
                <Link href="/presentations">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Presentations
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b pb-4 mb-4">
                <div className="flex items-center gap-4">
                    <Link href="/presentations">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h1 className="text-xl font-semibold">
                        {presentation?.title || "Untitled Presentation"}
                    </h1>
                    {hasChanges && (
                        <span className="text-sm text-muted-foreground">(unsaved changes)</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {hasChanges && (
                        <Button variant="outline" size="sm" onClick={handleSaveSlide} disabled={saving}>
                            <Save className="mr-2 h-4 w-4" />
                            {saving ? "Saving..." : "Save"}
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={handleAddSlide}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Slide
                    </Button>
                    <Button variant="outline" size="sm" onClick={openInsertDialog}>
                        <Library className="mr-2 h-4 w-4" />
                        Insert Existing
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/presentations/${presentationId}/presenter`, "_blank")}
                    >
                        <Monitor className="mr-2 h-4 w-4" />
                        Presenter
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportPptx}
                        disabled={exporting || slides.length === 0}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        {exporting ? "Exporting..." : "Export"}
                    </Button>
                    <Button onClick={handleStartPresentation}>
                        <Play className="mr-2 h-4 w-4" />
                        Present
                    </Button>
                </div>
            </div>

            {/* Main Editor Area */}
            <div className="flex-1 flex gap-4 min-h-0">
                {/* Slide Panel - Thumbnails */}
                <div
                    data-testid="slide-panel"
                    className="w-48 flex-shrink-0 overflow-y-auto border rounded-lg p-2 bg-muted/30"
                >
                    {slides.map((slide, index) => (
                        <div
                            key={slide.slideId}
                            data-testid="slide-thumbnail"
                            className={`mb-2 cursor-pointer rounded-md overflow-hidden border-2 transition-colors group relative ${index === selectedSlide
                                ? "border-primary"
                                : "border-transparent hover:border-muted-foreground/50"
                                }`}
                            onClick={() => setSelectedSlide(index)}
                        >
                            <Card className="aspect-video flex items-center justify-center p-2 text-xs bg-background">
                                <span className="text-muted-foreground truncate">
                                    {index + 1}. {slide.title || "Untitled"}
                                </span>
                            </Card>
                        </div>
                    ))}

                    {/* Add Slide Button */}
                    <Button
                        variant="ghost"
                        className="w-full mt-2"
                        onClick={handleAddSlide}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>

                {/* Slide Editor */}
                <div className="flex-1 flex flex-col" data-testid="slide-editor">
                    {currentSlide ? (
                        <>
                            {/* Slide Content Editor */}
                            <div
                                data-testid="slide-preview"
                                className="flex-1 bg-muted rounded-lg p-4 flex flex-col"
                            >
                                {/* Layout selector */}
                                <div className="flex items-center gap-4 mb-4">
                                    <Select
                                        value={editingLayout}
                                        onValueChange={(v) => handleFieldChange("layout", v)}
                                    >
                                        <SelectTrigger className="w-40">
                                            <SelectValue placeholder="Layout" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="title">Title Slide</SelectItem>
                                            <SelectItem value="content">Content</SelectItem>
                                            <SelectItem value="two-column">Two Column</SelectItem>
                                            <SelectItem value="code">Code Block</SelectItem>
                                            <SelectItem value="image">Image</SelectItem>
                                            <SelectItem value="blank">Blank</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive"
                                                disabled={slides.length <= 1}
                                            >
                                                <Trash2 className="h-4 w-4 mr-1" />
                                                Delete
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Slide?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete this slide. This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDeleteSlide}>
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>

                                {/* Slide preview with editable fields - Layout-aware */}
                                <div className="flex-1 flex items-center justify-center overflow-hidden">
                                    <div className="aspect-video h-full max-h-[60vh] bg-background rounded-md shadow-lg p-6 flex flex-col">
                                        {editingLayout === "title" && (
                                            <>
                                                {/* Title layout - Centered title and subtitle */}
                                                <div className="flex-1 flex flex-col items-center justify-center text-center">
                                                    <Input
                                                        value={editingTitle}
                                                        onChange={(e) => handleFieldChange("title", e.target.value)}
                                                        placeholder="Presentation Title"
                                                        className="text-4xl font-bold border-none shadow-none focus-visible:ring-0 p-0 mb-4 bg-transparent text-center"
                                                    />
                                                    <Input
                                                        value={editingBody}
                                                        onChange={(e) => handleFieldChange("body", e.target.value)}
                                                        placeholder="Subtitle"
                                                        className="text-2xl text-muted-foreground border-none shadow-none focus-visible:ring-0 p-0 bg-transparent text-center"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {editingLayout === "content" && (
                                            <>
                                                {/* Content layout - Title + body */}
                                                <Input
                                                    value={editingTitle}
                                                    onChange={(e) => handleFieldChange("title", e.target.value)}
                                                    placeholder="Slide Title"
                                                    className="text-3xl font-bold border-none shadow-none focus-visible:ring-0 p-0 mb-4 bg-transparent"
                                                />
                                                <Textarea
                                                    value={editingBody}
                                                    onChange={(e) => handleFieldChange("body", e.target.value)}
                                                    placeholder="Slide content... (use • for bullet points)"
                                                    className="flex-1 text-lg border-none shadow-none focus-visible:ring-0 p-0 resize-none bg-transparent"
                                                />
                                            </>
                                        )}

                                        {editingLayout === "two-column" && (
                                            <>
                                                {/* Two-column layout */}
                                                <Input
                                                    value={editingTitle}
                                                    onChange={(e) => handleFieldChange("title", e.target.value)}
                                                    placeholder="Slide Title"
                                                    className="text-3xl font-bold border-none shadow-none focus-visible:ring-0 p-0 mb-4 bg-transparent"
                                                />
                                                <div className="flex-1 grid grid-cols-2 gap-4">
                                                    <div className="border-r pr-4">
                                                        <Textarea
                                                            value={editingBody}
                                                            onChange={(e) => handleFieldChange("body", e.target.value)}
                                                            placeholder="Left column content..."
                                                            className="h-full text-base border-none shadow-none focus-visible:ring-0 p-0 resize-none bg-transparent"
                                                        />
                                                    </div>
                                                    <div className="pl-4">
                                                        <div className="h-full flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                                                            <span className="text-sm">Right column (use notes for second column)</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {editingLayout === "code" && (
                                            <>
                                                {/* Code layout - Monospace font */}
                                                <Input
                                                    value={editingTitle}
                                                    onChange={(e) => handleFieldChange("title", e.target.value)}
                                                    placeholder="Code Title"
                                                    className="text-2xl font-bold border-none shadow-none focus-visible:ring-0 p-0 mb-4 bg-transparent"
                                                />
                                                <div className="flex-1 bg-gray-900 rounded-lg p-4 overflow-hidden">
                                                    <Textarea
                                                        value={editingBody}
                                                        onChange={(e) => handleFieldChange("body", e.target.value)}
                                                        placeholder="// Your code here..."
                                                        className="h-full font-mono text-sm text-green-400 border-none shadow-none focus-visible:ring-0 p-0 resize-none bg-transparent"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {editingLayout === "image" && (
                                            <>
                                                {/* Image layout */}
                                                <Input
                                                    value={editingTitle}
                                                    onChange={(e) => handleFieldChange("title", e.target.value)}
                                                    placeholder="Image Caption"
                                                    className="text-2xl font-bold border-none shadow-none focus-visible:ring-0 p-0 mb-4 bg-transparent text-center"
                                                />
                                                <div className="flex-1 flex items-center justify-center border-2 border-dashed rounded-lg">
                                                    <div className="text-center text-muted-foreground">
                                                        <div className="text-4xl mb-2">🖼️</div>
                                                        <p className="text-sm">Image URL in body field:</p>
                                                        <Input
                                                            value={editingBody}
                                                            onChange={(e) => handleFieldChange("body", e.target.value)}
                                                            placeholder="https://example.com/image.jpg"
                                                            className="mt-2 text-sm border border-muted"
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {editingLayout === "blank" && (
                                            <>
                                                {/* Blank layout - Free form */}
                                                <Textarea
                                                    value={editingBody}
                                                    onChange={(e) => handleFieldChange("body", e.target.value)}
                                                    placeholder="Free-form content..."
                                                    className="flex-1 text-lg border-none shadow-none focus-visible:ring-0 p-0 resize-none bg-transparent"
                                                />
                                            </>
                                        )}

                                        {!["title", "content", "two-column", "code", "image", "blank"].includes(editingLayout) && (
                                            <>
                                                {/* Fallback - same as content */}
                                                <Input
                                                    value={editingTitle}
                                                    onChange={(e) => handleFieldChange("title", e.target.value)}
                                                    placeholder="Slide Title"
                                                    className="text-3xl font-bold border-none shadow-none focus-visible:ring-0 p-0 mb-4 bg-transparent"
                                                />
                                                <Textarea
                                                    value={editingBody}
                                                    onChange={(e) => handleFieldChange("body", e.target.value)}
                                                    placeholder="Slide content..."
                                                    className="flex-1 text-lg border-none shadow-none focus-visible:ring-0 p-0 resize-none bg-transparent"
                                                />
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Notes Editor */}
                            <div
                                data-testid="notes-editor"
                                className="mt-4 border rounded-md p-4"
                            >
                                <label className="text-sm font-medium mb-2 block">
                                    Presenter Notes
                                </label>
                                <Textarea
                                    placeholder="Add notes for this slide..."
                                    value={editingNotes}
                                    onChange={(e) => handleFieldChange("notes", e.target.value)}
                                    className="min-h-[80px]"
                                />
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground">
                            No slides yet. Click "Add Slide" to get started.
                        </div>
                    )}
                </div>
            </div>

            {/* Status Bar */}
            <div className="border-t mt-4 pt-2 flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        disabled={selectedSlide === 0}
                        onClick={() => setSelectedSlide((s) => Math.max(0, s - 1))}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span data-testid="slide-counter">
                        Slide {selectedSlide + 1} of {slides.length}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        disabled={selectedSlide >= slides.length - 1}
                        onClick={() =>
                            setSelectedSlide((s) => Math.min(slides.length - 1, s + 1))
                        }
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <kbd className="px-2 py-0.5 bg-muted rounded">Ctrl+S</kbd> to save
                </div>
            </div>

            {/* Insert Existing Slide Dialog */}
            <Dialog open={showInsertDialog} onOpenChange={setShowInsertDialog}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Insert Existing Slide</DialogTitle>
                        <DialogDescription>
                            Select a slide from your library to add to this presentation.
                            Slides can be reused across multiple presentations.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto min-h-0">
                        {availableSlides.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No slides available to insert.</p>
                                <p className="text-sm">All slides are already in this presentation or none exist yet.</p>
                            </div>
                        ) : (
                            <div className="grid gap-3 pr-2">
                                {availableSlides.map((slide) => (
                                    <Card
                                        key={slide.id}
                                        className="p-4 cursor-pointer hover:bg-accent transition-colors"
                                        onClick={() => handleInsertExisting(slide.id)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-medium">{slide.title}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    Layout: {slide.layout || "content"}
                                                    {slide.usageCount > 0 && (
                                                        <span className="ml-2">
                                                            • Used in {slide.usageCount} presentation{slide.usageCount !== 1 ? "s" : ""}
                                                        </span>
                                                    )}
                                                </p>
                                                {slide.usedIn.length > 0 && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {slide.usedIn.slice(0, 3).join(", ")}
                                                        {slide.usedIn.length > 3 && ` +${slide.usedIn.length - 3} more`}
                                                    </p>
                                                )}
                                            </div>
                                            <Button variant="ghost" size="sm">
                                                Insert
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
