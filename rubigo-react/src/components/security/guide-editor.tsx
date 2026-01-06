"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Eye, Edit3, Send, ArrowLeft, Trash2, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import type { ClassificationGuide, GuideType, CreateGuideInput, DraftInfo } from "@/lib/security-actions";
import { createGuide, startDraft, saveDraft, discardDraft, publishDraft } from "@/lib/security-actions";
import { usePersona } from "@/contexts/persona-context";

// ============================================================================
// Types
// ============================================================================

interface GuideEditorProps {
    mode: "create" | "edit";
    guideType?: GuideType;
    existingGuide?: ClassificationGuide;
    createdBy: string;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

// ============================================================================
// Icon and Color Options
// ============================================================================

const iconOptions = [
    { value: "shield", label: "Shield" },
    { value: "eye", label: "Eye" },
    { value: "lock", label: "Lock" },
    { value: "alert-triangle", label: "Alert Triangle" },
    { value: "users", label: "Users" },
    { value: "boxes", label: "Boxes" },
];

const colorOptions = [
    { value: "emerald", label: "Emerald (Green)" },
    { value: "blue", label: "Blue" },
    { value: "amber", label: "Amber (Yellow)" },
    { value: "red", label: "Red" },
    { value: "orange", label: "Orange" },
    { value: "purple", label: "Purple" },
    { value: "pink", label: "Pink" },
    { value: "slate", label: "Slate (Gray)" },
];

const guideTypeLabels: Record<GuideType, string> = {
    sensitivity: "Sensitivity Level",
    compartment: "Compartment",
    role: "Role",
};

// ============================================================================
// Default Markdown Templates
// ============================================================================

const defaultTemplates: Record<GuideType, string> = {
    sensitivity: `# [Title] Classification Guide

## Overview

Brief description of this sensitivity level and when to apply it.

## Definition

Detailed explanation of what data falls into this category.

## Examples

| Category | Examples |
|----------|----------|
| Documents | ... |
| Communications | ... |

## Handling Requirements

### Access Controls
- Requirement 1
- Requirement 2

### Permitted Actions
- Action 1
- Action 2

## Related Resources

- [Link to related guide](#)
`,
    compartment: `# [Compartment Name] Compartment Guide

## Overview

Description of this compartment and its purpose.

## Scope

What information falls within this compartment.

## Access Requirements

Who can access this compartment and how access is granted.

## Handling Procedures

Special handling requirements for data in this compartment.
`,
    role: `# [Role Name] Role Guide

## Overview

Description of this organizational role and its responsibilities.

## Clearance Level

Default sensitivity clearance for this role.

## Compartment Access

List of compartments this role can access.

## Data Handling Expectations

How personnel in this role should handle sensitive information.
`,
};

// ============================================================================
// Main Component
// ============================================================================

export function GuideEditor({ mode, guideType, existingGuide, createdBy }: GuideEditorProps) {
    const router = useRouter();
    const { currentPersona } = usePersona();
    const [publishing, setPublishing] = useState(false);
    const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
    const [draftInfo, setDraftInfo] = useState<DraftInfo | null>(null);
    const [showDiscardDialog, setShowDiscardDialog] = useState(false);
    const [showConflictDialog, setShowConflictDialog] = useState(false);
    const [conflictInfo, setConflictInfo] = useState<{ currentVersion?: number; yourBaseVersion?: number } | null>(null);
    const [lockError, setLockError] = useState<string | null>(null);

    // Get the current user's email from persona context (this is who is "logged in")
    const userId = currentPersona?.email ?? createdBy;

    // Form state
    const [type, setType] = useState<GuideType>(existingGuide?.guideType || guideType || "sensitivity");
    const [title, setTitle] = useState(existingGuide?.title || "");
    const [level, setLevel] = useState(existingGuide?.level || "");
    const [icon, setIcon] = useState(existingGuide?.icon || "");
    const [color, setColor] = useState(existingGuide?.color || "");
    const [content, setContent] = useState(existingGuide?.contentMarkdown || defaultTemplates[type]);

    // Debounce timer for auto-save
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Initialize draft on mount (for edit mode)
    useEffect(() => {
        if (mode === "edit" && existingGuide && userId) {
            const initDraft = async () => {
                const result = await startDraft(existingGuide.id, userId);
                if (result.success && result.draft) {
                    setDraftInfo(result.draft);
                    // Load draft content if exists
                    setTitle(result.draft.draftTitle);
                    setContent(result.draft.draftContent);
                } else if (result.lockedBy) {
                    // Format time relative
                    const lockedTime = result.lockedAt ? new Date(result.lockedAt).toLocaleString() : "recently";
                    // Show lock owner name with email
                    const ownerDisplay = result.lockedByName
                        ? `${result.lockedByName} (${result.lockedBy})`
                        : result.lockedBy;
                    setLockError(`This guide is being edited by ${ownerDisplay} since ${lockedTime}`);
                }
            };
            initDraft();
        }
    }, [mode, existingGuide, userId]);

    // Auto-save effect with debounce
    const performAutoSave = useCallback(async () => {
        if (mode !== "edit" || !existingGuide || !draftInfo || !userId) return;

        setSaveStatus("saving");
        const result = await saveDraft(existingGuide.id, { title, contentMarkdown: content }, userId);
        setSaveStatus(result.success ? "saved" : "error");

        // Reset to idle after 2 seconds
        setTimeout(() => setSaveStatus("idle"), 2000);
    }, [mode, existingGuide, draftInfo, title, content, userId]);

    // Debounced auto-save on content change
    useEffect(() => {
        if (mode !== "edit" || !draftInfo) return;

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            performAutoSave();
        }, 2000); // Save 2 seconds after last change

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [title, content, mode, draftInfo, performAutoSave]);

    // Handle create new guide
    const handleCreate = async () => {
        if (!title.trim()) {
            alert("Title is required");
            return;
        }
        if (!level.trim()) {
            alert("Level/Identifier is required");
            return;
        }

        setPublishing(true);
        try {
            const input: CreateGuideInput = {
                title,
                guideType: type,
                level,
                contentMarkdown: content,
                icon: icon || undefined,
                color: color || undefined,
                createdBy: userId,
            };

            const result = await createGuide(input);
            if (result.success) {
                router.push("/security/guides");
            } else {
                alert(`Failed to create guide: ${result.error}`);
            }
        } finally {
            setPublishing(false);
        }
    };

    // Handle publish draft
    const handlePublish = async () => {
        if (!existingGuide) return;

        setPublishing(true);
        try {
            const result = await publishDraft(existingGuide.id, userId);
            if (result.success) {
                router.push("/security/guides");
            } else if (result.conflict) {
                setConflictInfo({
                    currentVersion: result.currentVersion,
                    yourBaseVersion: result.yourBaseVersion,
                });
                setShowConflictDialog(true);
            } else {
                alert(`Failed to publish: ${result.error}`);
            }
        } finally {
            setPublishing(false);
        }
    };

    // Handle discard draft
    const handleDiscard = async () => {
        if (!existingGuide || !userId) return;

        const result = await discardDraft(existingGuide.id, userId);
        if (result.success) {
            router.push("/security/guides");
        } else {
            alert(`Failed to discard: ${result.error}`);
        }
    };

    // Render lock error if cannot edit
    if (lockError) {
        return (
            <div className="container py-8 max-w-6xl mx-auto">
                <Card className="border-amber-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-600">
                            <AlertCircle className="size-5" />
                            Cannot Edit
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">{lockError}</p>
                        <Button variant="outline" onClick={() => router.back()}>
                            <ArrowLeft className="size-4 mr-2" />
                            Go Back
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Render save status indicator
    const renderSaveStatus = () => {
        if (mode !== "edit") return null;

        switch (saveStatus) {
            case "saving":
                return (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Loader2 className="size-4 animate-spin" />
                        Saving...
                    </div>
                );
            case "saved":
                return (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                        <CheckCircle className="size-4" />
                        Saved
                    </div>
                );
            case "error":
                return (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertCircle className="size-4" />
                        Save failed
                    </div>
                );
            default:
                return draftInfo ? (
                    <div className="text-sm text-muted-foreground">
                        Draft • Based on v{draftInfo.baseVersion}
                    </div>
                ) : null;
        }
    };

    return (
        <div className="container py-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="size-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">
                            {mode === "create" ? "Create" : "Edit"} Classification Guide
                        </h1>
                        {existingGuide && (
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">v{existingGuide.version}</Badge>
                                <Badge variant={existingGuide.status === "active" ? "default" : "secondary"}>
                                    {existingGuide.status}
                                </Badge>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {renderSaveStatus()}
                    {mode === "edit" && (
                        <Button variant="outline" onClick={() => setShowDiscardDialog(true)}>
                            <Trash2 className="size-4 mr-2" />
                            Discard
                        </Button>
                    )}
                    <Button onClick={mode === "create" ? handleCreate : handlePublish} disabled={publishing}>
                        <Send className="size-4 mr-2" />
                        {publishing ? "Publishing..." : "Publish"}
                    </Button>
                </div>
            </div>

            {/* Metadata Form */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-lg">Guide Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select value={type} onValueChange={(v) => setType(v as GuideType)} disabled={mode === "edit"}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sensitivity">Sensitivity Level</SelectItem>
                                    <SelectItem value="compartment">Compartment</SelectItem>
                                    <SelectItem value="role">Role</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Level / Identifier</Label>
                            <Input
                                value={level}
                                onChange={(e) => setLevel(e.target.value)}
                                placeholder={type === "sensitivity" ? "high" : "executive"}
                                disabled={mode === "edit"}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Icon</Label>
                            <Select value={icon} onValueChange={setIcon}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select icon" />
                                </SelectTrigger>
                                <SelectContent>
                                    {iconOptions.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Color</Label>
                            <Select value={color} onValueChange={setColor}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select color" />
                                </SelectTrigger>
                                <SelectContent>
                                    {colorOptions.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="mt-4 space-y-2">
                        <Label>Title</Label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={`${guideTypeLabels[type]} title`}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Editor / Preview */}
            <Card>
                <CardHeader className="pb-0">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "preview")}>
                        <TabsList>
                            <TabsTrigger value="edit" className="gap-2">
                                <Edit3 className="size-4" />
                                Edit
                            </TabsTrigger>
                            <TabsTrigger value="preview" className="gap-2">
                                <Eye className="size-4" />
                                Preview
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>
                <CardContent className="pt-4">
                    {activeTab === "edit" ? (
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="min-h-[500px] font-mono text-sm"
                            placeholder="Write your guide content in Markdown..."
                        />
                    ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none min-h-[500px] p-4 border rounded-md bg-muted/30">
                            <MarkdownRenderer content={content} />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Discard Dialog */}
            <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Discard Draft?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will discard all your unsaved changes. The published version will remain unchanged.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDiscard} className="bg-destructive text-destructive-foreground">
                            Discard
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Conflict Dialog */}
            <AlertDialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertCircle className="size-5 text-amber-500" />
                            Conflict Detected
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            The published version was updated while you were editing.
                            <br /><br />
                            Your draft is based on: <strong>v{conflictInfo?.yourBaseVersion}</strong>
                            <br />
                            Current published: <strong>v{conflictInfo?.currentVersion}</strong>
                            <br /><br />
                            Please refresh the page to see the latest version, then re-apply your changes.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Close</AlertDialogCancel>
                        <AlertDialogAction onClick={() => router.push(`/security/guides/${existingGuide?.id}`)}>
                            View Current Version
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
