"use client";

/**
 * Files Page Content
 *
 * Main file manager UI with folder sidebar, file grid/list view, and upload area
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePersona } from "@/contexts/persona-context";
import { FilePreviewPanel } from "@/components/file-preview-panel";
import {
    Folder,
    File,
    Upload,
    FolderPlus,
    Grid3X3,
    List,
    ChevronRight,
    Download,
    Trash2,
    MoreVertical,
    HardDrive,
    Search,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ============================================================================
// Types
// ============================================================================

interface FileItem {
    id: string;
    name: string;
    mimeType: string | null;
    totalSize: number;
    ownerId: number;
    checksum: string | null;
    createdAt: string;
    updatedAt: string;
}

interface FolderItem {
    id: string;
    name: string;
    ownerId: number;
    createdAt: string;
}

interface StorageStats {
    totalChunks: number;
    uniqueBytes: number;
    totalBytes: number;
    deduplicationRatio: string;
    savedBytes: number;
    fileCount: number;
    folderCount: number;
    uniqueBytesFormatted: string;
    totalBytesFormatted: string;
    savedBytesFormatted: string;
}

interface BreadcrumbItem {
    id: string | null;
    name: string;
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

// ============================================================================
// Main Component
// ============================================================================

export function FilesPageContent() {
    const { currentPersona } = usePersona();

    // State
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [files, setFiles] = useState<FileItem[]>([]);
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ id: null, name: "Files" }]);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<StorageStats | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Upload state
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Modal state
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");

    // Preview panel state
    const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

    // Load content
    const loadContent = useCallback(async () => {
        if (!currentPersona) return;

        try {
            setIsLoading(true);

            // Load folders
            const foldersUrl = currentFolderId
                ? `/api/files/folders?parentId=${currentFolderId}`
                : "/api/files/folders";
            const foldersRes = await fetch(foldersUrl);
            const foldersData = await foldersRes.json();
            if (foldersData.success) {
                setFolders(foldersData.data);
            }

            // Load files
            const filesUrl = currentFolderId
                ? `/api/files?folderId=${currentFolderId}`
                : "/api/files";
            const filesRes = await fetch(filesUrl);
            const filesData = await filesRes.json();
            if (filesData.success) {
                setFiles(filesData.data);
            }

            // Load storage stats
            const statsRes = await fetch("/api/files/stats");
            const statsData = await statsRes.json();
            if (statsData.success) {
                setStats(statsData.data);
            }
        } catch (error) {
            console.error("Failed to load content:", error);
        } finally {
            setIsLoading(false);
        }
    }, [currentPersona, currentFolderId]);

    useEffect(() => {
        loadContent();
    }, [loadContent]);

    // Navigate to folder
    const navigateToFolder = (folderId: string | null, folderName: string) => {
        if (folderId === null) {
            // Going to root
            setBreadcrumbs([{ id: null, name: "Files" }]);
        } else {
            // Check if clicking on breadcrumb to go back
            const existingIndex = breadcrumbs.findIndex((b) => b.id === folderId);
            if (existingIndex >= 0) {
                setBreadcrumbs(breadcrumbs.slice(0, existingIndex + 1));
            } else {
                setBreadcrumbs([...breadcrumbs, { id: folderId, name: folderName }]);
            }
        }
        setCurrentFolderId(folderId);
    };

    // Handle file upload
    const handleFileUpload = async (fileList: FileList) => {
        if (!currentPersona || fileList.length === 0) return;

        setIsUploading(true);
        let uploadedCount = 0;

        for (const file of Array.from(fileList)) {
            try {
                setUploadProgress(`Uploading ${file.name}...`);

                const formData = new FormData();
                formData.append("file", file);
                formData.append("ownerId", currentPersona.id);
                if (currentFolderId) {
                    formData.append("folderId", currentFolderId);
                }

                const response = await fetch("/api/files", {
                    method: "POST",
                    body: formData,
                });

                const data = await response.json();
                if (data.success) {
                    uploadedCount++;
                }
            } catch (error) {
                console.error(`Failed to upload ${file.name}:`, error);
            }
        }

        setIsUploading(false);
        setUploadProgress("");

        if (uploadedCount > 0) {
            loadContent();
        }
    };

    // Handle create folder
    const handleCreateFolder = async () => {
        if (!currentPersona || !newFolderName.trim()) return;

        try {
            const response = await fetch("/api/files/folders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newFolderName.trim(),
                    parentId: currentFolderId,
                    ownerId: currentPersona.id,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setShowNewFolder(false);
                setNewFolderName("");
                loadContent();
            }
        } catch (error) {
            console.error("Failed to create folder:", error);
        }
    };

    // Handle file download
    const handleDownload = async (fileId: string, fileName: string, versionId?: string) => {
        try {
            const url = versionId
                ? `/api/files/${fileId}?version=${versionId}`
                : `/api/files/${fileId}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error("Download failed");

            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = fileName;
            a.style.display = "none";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Download failed:", error);
        }
    };

    // Handle file click (open preview)
    const handleFileClick = (file: FileItem) => {
        setSelectedFile(file);
    };

    // Handle file delete
    const handleDelete = async (fileId: string, fileName: string) => {
        try {
            const response = await fetch(`/api/files/${fileId}`, {
                method: "DELETE",
            });

            const data = await response.json();
            if (data.success) {
                toast.success(`"${fileName}" deleted`, {
                    description: "The file has been moved to trash.",
                });
                loadContent();
            } else {
                toast.error("Delete failed", {
                    description: data.error || "Could not delete the file.",
                });
            }
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("Delete failed", {
                description: "An unexpected error occurred.",
            });
        }
    };

    // Handle folder delete
    const handleDeleteFolder = async (folderId: string, folderName: string) => {
        try {
            const response = await fetch(`/api/files/folders/${folderId}`, {
                method: "DELETE",
            });

            const data = await response.json();
            if (data.success) {
                toast.success(`"${folderName}" deleted`, {
                    description: "Folder has been removed.",
                });
                loadContent();
            } else {
                toast.error("Delete failed", {
                    description: data.error || "Could not delete the folder.",
                });
            }
        } catch (error) {
            console.error("Delete folder failed:", error);
            toast.error("Delete failed", {
                description: "An unexpected error occurred.",
            });
        }
    };

    // Drag and drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files);
        }
    };

    // Filter content by search
    const filteredFolders = searchQuery
        ? folders.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : folders;

    const filteredFiles = searchQuery
        ? files.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : files;

    if (!currentPersona) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">Please sign in to use files</p>
            </div>
        );
    }

    return (
        <div
            className="flex h-full flex-col"
            data-testid="files-container"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Header */}
            <div className="border-b p-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-semibold">Files</h1>
                    <div className="flex items-center gap-2">
                        {/* Storage stats */}
                        {stats && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
                                <HardDrive className="h-4 w-4" />
                                <span>{stats.uniqueBytesFormatted} used</span>
                                <span className="text-green-600">
                                    ({stats.deduplicationRatio} saved)
                                </span>
                            </div>
                        )}

                        {/* View toggle */}
                        <div className="flex border rounded-md">
                            <Button
                                variant={viewMode === "grid" ? "secondary" : "ghost"}
                                size="icon"
                                className="h-8 w-8 rounded-r-none"
                                onClick={() => setViewMode("grid")}
                                data-testid="grid-view-button"
                            >
                                <Grid3X3 className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === "list" ? "secondary" : "ghost"}
                                size="icon"
                                className="h-8 w-8 rounded-l-none"
                                onClick={() => setViewMode("list")}
                                data-testid="list-view-button"
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* New folder */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowNewFolder(true)}
                            data-testid="new-folder-button"
                        >
                            <FolderPlus className="h-4 w-4 mr-2" />
                            New Folder
                        </Button>

                        {/* Upload */}
                        <Button
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            data-testid="upload-button"
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            {isUploading ? uploadProgress : "Upload"}
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                        />
                    </div>
                </div>

                {/* Breadcrumbs and search */}
                <div className="flex items-center justify-between">
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-1 text-sm" data-testid="breadcrumbs">
                        {breadcrumbs.map((crumb, index) => (
                            <div key={crumb.id ?? "root"} className="flex items-center">
                                {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />}
                                <button
                                    onClick={() => navigateToFolder(crumb.id, crumb.name)}
                                    className={`hover:text-foreground ${index === breadcrumbs.length - 1
                                        ? "font-medium"
                                        : "text-muted-foreground"
                                        }`}
                                >
                                    {crumb.name}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search files..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 h-8"
                            data-testid="search-input"
                        />
                    </div>
                </div>
            </div>

            {/* Content area */}
            <ScrollArea className="flex-1">
                {/* Drop overlay */}
                {isDragging && (
                    <div className="absolute inset-0 z-50 bg-primary/10 border-2 border-dashed border-primary flex items-center justify-center">
                        <div className="text-center">
                            <Upload className="h-12 w-12 mx-auto text-primary mb-2" />
                            <p className="text-lg font-medium">Drop files to upload</p>
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <p className="text-muted-foreground">Loading...</p>
                    </div>
                ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <Folder className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">
                            {searchQuery ? "No matching files found" : "This folder is empty"}
                        </p>
                        {!searchQuery && (
                            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Files
                            </Button>
                        )}
                    </div>
                ) : viewMode === "grid" ? (
                    // Grid view
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {/* Folders */}
                        {filteredFolders.map((folder) => (
                            <div
                                key={folder.id}
                                data-testid="folder-item"
                                className="relative flex flex-col items-center p-4 rounded-lg border hover:bg-accent transition-colors group"
                            >
                                <button
                                    onClick={() => navigateToFolder(folder.id, folder.name)}
                                    className="flex flex-col items-center w-full"
                                >
                                    <Folder className="h-12 w-12 text-blue-500 mb-2" />
                                    <span className="text-sm font-medium truncate w-full text-center">
                                        {folder.name}
                                    </span>
                                </button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-6 w-6"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteFolder(folder.id, folder.name);
                                            }}
                                            className="text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ))}

                        {/* Files */}
                        {filteredFiles.map((file) => (
                            <div
                                key={file.id}
                                data-testid="file-item"
                                onClick={() => handleFileClick(file)}
                                className="flex flex-col items-center p-4 rounded-lg border hover:bg-accent transition-colors group relative cursor-pointer"
                            >
                                <div className="text-4xl mb-2">{getFileIcon(file.mimeType)}</div>
                                <span className="text-sm font-medium truncate w-full text-center">
                                    {file.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {formatBytes(file.totalSize)}
                                </span>

                                {/* Action menu */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100"
                                        >
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleDownload(file.id, file.name)}>
                                            <Download className="h-4 w-4 mr-2" />
                                            Download
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(file.id, file.name);
                                            }}
                                            className="text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ))}
                    </div>
                ) : (
                    // List view
                    <div className="p-4">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b text-left text-sm text-muted-foreground">
                                    <th className="pb-2 font-medium">Name</th>
                                    <th className="pb-2 font-medium">Size</th>
                                    <th className="pb-2 font-medium">Modified</th>
                                    <th className="pb-2 font-medium w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Folders */}
                                {filteredFolders.map((folder) => (
                                    <tr
                                        key={folder.id}
                                        data-testid="folder-row"
                                        className="border-b hover:bg-accent cursor-pointer group"
                                        onClick={() => navigateToFolder(folder.id, folder.name)}
                                    >
                                        <td className="py-2">
                                            <div className="flex items-center gap-2">
                                                <Folder className="h-5 w-5 text-blue-500" />
                                                <span className="font-medium">{folder.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-2 text-muted-foreground">—</td>
                                        <td className="py-2 text-muted-foreground">
                                            {formatDate(folder.createdAt)}
                                        </td>
                                        <td className="py-2">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="opacity-0 group-hover:opacity-100 h-6 w-6"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteFolder(folder.id, folder.name);
                                                        }}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}

                                {/* Files */}
                                {filteredFiles.map((file) => (
                                    <tr
                                        key={file.id}
                                        data-testid="file-row"
                                        className="border-b hover:bg-accent group"
                                    >
                                        <td className="py-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">{getFileIcon(file.mimeType)}</span>
                                                <span className="font-medium">{file.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-2 text-muted-foreground">
                                            {formatBytes(file.totalSize)}
                                        </td>
                                        <td className="py-2 text-muted-foreground">
                                            {formatDate(file.updatedAt)}
                                        </td>
                                        <td className="py-2">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => handleDownload(file.id, file.name)}
                                                    >
                                                        <Download className="h-4 w-4 mr-2" />
                                                        Download
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(file.id, file.name);
                                                        }}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </ScrollArea>

            {/* New Folder Dialog */}
            <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>New Folder</DialogTitle>
                        <DialogDescription>
                            Create a new folder in the current location
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="folder-name">Folder Name</Label>
                            <Input
                                id="folder-name"
                                data-testid="folder-name-input"
                                placeholder="e.g., Documents"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleCreateFolder();
                                }}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowNewFolder(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateFolder}
                                disabled={!newFolderName.trim()}
                                data-testid="create-folder-submit"
                            >
                                Create
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* File Preview Panel */}
            <FilePreviewPanel
                file={selectedFile}
                isOpen={selectedFile !== null}
                onClose={() => setSelectedFile(null)}
                onDownload={handleDownload}
            />
        </div>
    );
}
