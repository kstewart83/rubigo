"use client";

/**
 * File Preview Panel
 *
 * Shows file details, preview, and version history
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Download,
    X,
    History,
    Clock,
    User,
    HardDrive,
    FileText,
    Share2,
    Copy,
    Check,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface FileVersion {
    id: string;
    versionNumber: number;
    size: number;
    chunkCount: number;
    checksum: string;
    createdBy: number;
    createdAt: string;
}

interface FileDetails {
    id: string;
    name: string;
    mimeType: string | null;
    totalSize: number;
    ownerId: number;
    createdAt: string;
    updatedAt: string;
}

interface FilePreviewPanelProps {
    file: FileDetails | null;
    isOpen: boolean;
    onClose: () => void;
    onDownload: (fileId: string, fileName: string, versionId?: string) => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + units[i];
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getFileIcon(mimeType: string | null): string {
    if (!mimeType) return "📄";
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.startsWith("video/")) return "🎬";
    if (mimeType.startsWith("audio/")) return "🎵";
    if (mimeType === "application/pdf") return "📕";
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "📊";
    if (mimeType.includes("document") || mimeType.includes("word")) return "📝";
    if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "📽️";
    if (mimeType.includes("zip") || mimeType.includes("archive")) return "📦";
    if (mimeType.includes("text") || mimeType.includes("json") || mimeType.includes("javascript")) return "📃";
    return "📄";
}

function isPreviewable(mimeType: string | null): boolean {
    if (!mimeType) return false;
    return (
        mimeType.startsWith("image/") ||
        mimeType === "application/pdf" ||
        mimeType.startsWith("text/") ||
        mimeType === "application/json" ||
        mimeType === "application/javascript"
    );
}

// ============================================================================
// Preview Components
// ============================================================================

function ImagePreview({ fileId }: { fileId: string }) {
    return (
        <div className="flex items-center justify-center bg-muted rounded-lg p-4">
            <img
                src={`/api/files/${fileId}`}
                alt="Preview"
                className="max-w-full max-h-64 object-contain rounded"
                data-testid="image-preview"
            />
        </div>
    );
}

function TextPreview({ fileId }: { fileId: string }) {
    const [content, setContent] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadContent = async () => {
            try {
                const response = await fetch(`/api/files/${fileId}`);
                if (response.ok) {
                    const text = await response.text();
                    // Limit preview to first 5000 chars
                    setContent(text.slice(0, 5000) + (text.length > 5000 ? "\n..." : ""));
                }
            } catch (error) {
                console.error("Failed to load text preview:", error);
                setContent("Failed to load preview");
            } finally {
                setIsLoading(false);
            }
        };
        loadContent();
    }, [fileId]);

    if (isLoading) {
        return (
            <div className="bg-muted rounded-lg p-4 h-64 flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    return (
        <pre
            className="bg-muted rounded-lg p-4 text-xs overflow-auto max-h-64 font-mono"
            data-testid="text-preview"
        >
            {content}
        </pre>
    );
}

function PDFPreview({ fileId }: { fileId: string }) {
    return (
        <div className="bg-muted rounded-lg p-4">
            <iframe
                src={`/api/files/${fileId}#toolbar=0`}
                className="w-full h-64 rounded"
                title="PDF Preview"
                data-testid="pdf-preview"
            />
        </div>
    );
}

function NoPreview({ mimeType }: { mimeType: string | null }) {
    return (
        <div className="bg-muted rounded-lg p-8 flex flex-col items-center justify-center">
            <span className="text-6xl mb-4">{getFileIcon(mimeType)}</span>
            <p className="text-muted-foreground text-sm">Preview not available</p>
        </div>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export function FilePreviewPanel({
    file,
    isOpen,
    onClose,
    onDownload,
}: FilePreviewPanelProps) {
    const [versions, setVersions] = useState<FileVersion[]>([]);
    const [isLoadingVersions, setIsLoadingVersions] = useState(false);
    const [showVersions, setShowVersions] = useState(false);
    const [shareLink, setShareLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Load version history
    useEffect(() => {
        if (!file || !showVersions) return;

        const loadVersions = async () => {
            setIsLoadingVersions(true);
            try {
                const response = await fetch(`/api/files/${file.id}/versions`);
                const data = await response.json();
                if (data.success) {
                    setVersions(data.data.versions);
                }
            } catch (error) {
                console.error("Failed to load versions:", error);
            } finally {
                setIsLoadingVersions(false);
            }
        };

        loadVersions();
    }, [file, showVersions]);

    // Generate share link
    const handleShare = async () => {
        if (!file) return;

        try {
            const response = await fetch(`/api/files/${file.id}/share`, {
                method: "POST",
            });
            const data = await response.json();
            if (data.success) {
                setShareLink(data.data.url);
            }
        } catch (error) {
            console.error("Failed to create share link:", error);
        }
    };

    // Copy share link
    const handleCopyLink = async () => {
        if (!shareLink) return;
        await navigator.clipboard.writeText(shareLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!file) return null;

    const renderPreview = () => {
        if (!file.mimeType) return <NoPreview mimeType={null} />;

        if (file.mimeType.startsWith("image/")) {
            return <ImagePreview fileId={file.id} />;
        }

        if (file.mimeType === "application/pdf") {
            return <PDFPreview fileId={file.id} />;
        }

        if (
            file.mimeType.startsWith("text/") ||
            file.mimeType === "application/json" ||
            file.mimeType === "application/javascript"
        ) {
            return <TextPreview fileId={file.id} />;
        }

        return <NoPreview mimeType={file.mimeType} />;
    };

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-[400px] sm:w-[540px]" data-testid="file-preview-panel">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <span className="text-2xl">{getFileIcon(file.mimeType)}</span>
                        <span className="truncate">{file.name}</span>
                    </SheetTitle>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-100px)] pr-4">
                    <div className="space-y-6 py-4">
                        {/* Preview */}
                        <div>
                            <h3 className="text-sm font-medium mb-2">Preview</h3>
                            {renderPreview()}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onDownload(file.id, file.name)}
                                data-testid="download-button"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowVersions(!showVersions)}
                                data-testid="history-button"
                            >
                                <History className="h-4 w-4 mr-2" />
                                History
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleShare}
                                data-testid="share-button"
                            >
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
                            </Button>
                        </div>

                        {/* Share Link */}
                        {shareLink && (
                            <div className="bg-muted rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Share Link</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCopyLink}
                                    >
                                        {copied ? (
                                            <Check className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                <code className="text-xs break-all">{shareLink}</code>
                            </div>
                        )}

                        <Separator />

                        {/* File Details */}
                        <div>
                            <h3 className="text-sm font-medium mb-3">Details</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <FileText className="h-4 w-4" />
                                    <span>Type:</span>
                                    <span className="text-foreground">
                                        {file.mimeType || "Unknown"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <HardDrive className="h-4 w-4" />
                                    <span>Size:</span>
                                    <span className="text-foreground">
                                        {formatBytes(file.totalSize)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>Modified:</span>
                                    <span className="text-foreground">
                                        {formatDate(file.updatedAt)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>Created:</span>
                                    <span className="text-foreground">
                                        {formatDate(file.createdAt)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Version History */}
                        {showVersions && (
                            <>
                                <Separator />
                                <div>
                                    <h3 className="text-sm font-medium mb-3">Version History</h3>
                                    {isLoadingVersions ? (
                                        <p className="text-sm text-muted-foreground">Loading...</p>
                                    ) : versions.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No versions found</p>
                                    ) : (
                                        <div className="space-y-2" data-testid="version-list">
                                            {versions.map((version) => (
                                                <div
                                                    key={version.id}
                                                    data-testid="version-item"
                                                    className="flex items-center justify-between p-2 rounded-lg border hover:bg-accent"
                                                >
                                                    <div>
                                                        <div className="text-sm font-medium">
                                                            Version {version.versionNumber}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {formatDate(version.createdAt)} •{" "}
                                                            {formatBytes(version.size)}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            onDownload(file.id, file.name, version.id)
                                                        }
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
