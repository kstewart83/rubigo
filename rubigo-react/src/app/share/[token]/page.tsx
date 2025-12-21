/**
 * Share Access Page
 * 
 * Public page for accessing shared files via token
 */

import { notFound, redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { FileStorageService } from "@/lib/files";

interface SharePageProps {
    params: Promise<{ token: string }>;
}

export default async function SharePage({ params }: SharePageProps) {
    const { token } = await params;

    const db = getDb();

    // Find share link
    const share = db.prepare(`
        SELECT 
            fs.id as share_id,
            fs.file_id,
            fs.expires_at,
            fs.access_count,
            f.name,
            f.mime_type,
            f.total_size,
            f.deleted_at
        FROM file_shares fs
        JOIN files f ON fs.file_id = f.id
        WHERE fs.token = ?
    `).get(token) as {
        share_id: string;
        file_id: string;
        expires_at: string | null;
        access_count: number;
        name: string;
        mime_type: string | null;
        total_size: number;
        deleted_at: string | null;
    } | undefined;

    // Not found
    if (!share) {
        notFound();
    }

    // File deleted
    if (share.deleted_at) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center p-6">
                    <h1 className="text-2xl font-bold mb-2">File Not Available</h1>
                    <p className="text-muted-foreground">
                        This file has been deleted.
                    </p>
                </div>
            </div>
        );
    }

    // Check expiration
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center p-6">
                    <h1 className="text-2xl font-bold mb-2">Link Expired</h1>
                    <p className="text-muted-foreground">
                        This share link has expired.
                    </p>
                </div>
            </div>
        );
    }

    // Increment access count
    db.prepare(`
        UPDATE file_shares SET access_count = access_count + 1 WHERE id = ?
    `).run(share.share_id);

    // Format file size
    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return "0 B";
        const units = ["B", "KB", "MB", "GB", "TB"];
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + units[i];
    };

    // Get file icon
    const getFileIcon = (mimeType: string | null): string => {
        if (!mimeType) return "📄";
        if (mimeType.startsWith("image/")) return "🖼️";
        if (mimeType.startsWith("video/")) return "🎬";
        if (mimeType.startsWith("audio/")) return "🎵";
        if (mimeType === "application/pdf") return "📕";
        return "📄";
    };

    // Check if previewable
    const isImage = share.mime_type?.startsWith("image/");
    const isPDF = share.mime_type === "application/pdf";

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-2xl mx-auto py-12 px-4">
                <div className="bg-card rounded-lg border shadow-sm p-6">
                    {/* File info */}
                    <div className="flex items-center gap-4 mb-6">
                        <span className="text-5xl">{getFileIcon(share.mime_type)}</span>
                        <div>
                            <h1 className="text-xl font-bold">{share.name}</h1>
                            <p className="text-sm text-muted-foreground">
                                {formatBytes(share.total_size)}
                                {share.mime_type && ` • ${share.mime_type}`}
                            </p>
                        </div>
                    </div>

                    {/* Preview */}
                    {isImage && (
                        <div className="mb-6 bg-muted rounded-lg p-4 flex justify-center">
                            <img
                                src={`/api/files/${share.file_id}`}
                                alt={share.name}
                                className="max-w-full max-h-96 object-contain rounded"
                            />
                        </div>
                    )}

                    {isPDF && (
                        <div className="mb-6 bg-muted rounded-lg p-4">
                            <iframe
                                src={`/api/files/${share.file_id}`}
                                className="w-full h-96 rounded"
                                title={share.name}
                            />
                        </div>
                    )}

                    {/* Download button */}
                    <a
                        href={`/api/files/${share.file_id}`}
                        download={share.name}
                        className="inline-flex items-center justify-center w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                    >
                        Download File
                    </a>

                    {/* Access info */}
                    <p className="text-xs text-muted-foreground text-center mt-4">
                        This link has been accessed {share.access_count + 1} time{share.access_count !== 0 ? "s" : ""}
                        {share.expires_at && (
                            <> • Expires {new Date(share.expires_at).toLocaleDateString()}</>
                        )}
                    </p>
                </div>

                {/* Branding */}
                <p className="text-center text-xs text-muted-foreground mt-6">
                    Shared via Rubigo File Manager
                </p>
            </div>
        </div>
    );
}
