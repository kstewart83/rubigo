"use client";

/**
 * PhotoUpload - Photo upload component for personnel headshots
 * 
 * Features:
 * - Drag and drop or click to upload
 * - Shows current photo with option to change
 * - E2E compatible via standard file input element
 */

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PhotoUploadProps {
    value: string; // Current photo URL
    onChange: (url: string) => void;
    personnelId?: string;
    size?: "sm" | "md" | "lg";
    className?: string;
}

const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
};

export function PhotoUpload({
    value,
    onChange,
    personnelId,
    size = "md",
    className,
}: PhotoUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = useCallback(async (file: File) => {
        setError(null);
        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);
            if (personnelId) {
                formData.append("id", personnelId);
            }

            const response = await fetch("/api/photos", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Upload failed");
            }

            onChange(result.path);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setIsUploading(false);
        }
    }, [onChange, personnelId]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    }, [handleFileSelect]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith("image/")) {
            handleFileSelect(file);
        }
    }, [handleFileSelect]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange("");
    };

    return (
        <div className={cn("space-y-2", className)}>
            <div
                onClick={handleClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                    sizeClasses[size],
                    "relative rounded-full overflow-hidden cursor-pointer",
                    "border-2 border-dashed transition-colors",
                    isDragging
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                        : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600",
                    "flex items-center justify-center",
                    isUploading && "pointer-events-none opacity-50"
                )}
            >
                {isUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                ) : value ? (
                    <>
                        <Image
                            src={value}
                            alt="Photo"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="w-6 h-6 text-white" />
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-1 text-zinc-400">
                        <Upload className="w-6 h-6" />
                        <span className="text-xs">Photo</span>
                    </div>
                )}
            </div>

            {/* Hidden file input for E2E compatibility */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleInputChange}
                className="hidden"
                data-testid="photo-upload-input"
            />

            {/* Remove button when photo exists */}
            {value && !isUploading && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemove}
                    className="text-xs text-zinc-500 hover:text-red-500 p-0 h-auto"
                >
                    <X className="w-3 h-3 mr-1" />
                    Remove
                </Button>
            )}

            {/* Error message */}
            {error && (
                <div className="text-xs text-red-500">{error}</div>
            )}
        </div>
    );
}
