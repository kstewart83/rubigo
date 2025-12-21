/**
 * Magika File Type Detection
 * 
 * AI-powered file type detection using Google Magika
 * Provides accurate content-based detection vs just mime-type/extension
 */

import { Magika, type MagikaResult } from "magika";

// Singleton instance
let magikaInstance: Magika | null = null;

/**
 * Get or create the Magika instance (lazy initialization)
 */
async function getMagika(): Promise<Magika> {
    if (!magikaInstance) {
        magikaInstance = await Magika.create();
    }
    return magikaInstance;
}

/**
 * Result from Magika file type detection
 */
export interface FileTypeResult {
    /** Detected label (e.g., "javascript", "pdf", "png") */
    label: string;
    /** Human-readable description */
    description: string;
    /** Detection confidence (0-1) */
    confidence: number;
    /** MIME type for the detected content */
    mimeType: string;
    /** Whether this is a text-based format */
    isText: boolean;
    /** Whether file extension matches detected content */
    extensionMatch: boolean;
}

/**
 * Detect file type from binary data using Magika AI
 * 
 * @param data - File content as Uint8Array
 * @param fileName - Optional filename for extension comparison
 * @returns Detection result with label, confidence, and mismatch warning
 */
export async function detectFileType(
    data: Uint8Array,
    fileName?: string
): Promise<FileTypeResult> {
    const magika = await getMagika();

    const result = await magika.identifyBytes(data);

    // Check if extension matches
    let extensionMatch = true;
    if (fileName) {
        const ext = fileName.split(".").pop()?.toLowerCase();
        if (ext) {
            // Common extension mappings
            const labelToExtensions: Record<string, string[]> = {
                "javascript": ["js", "mjs", "cjs"],
                "typescript": ["ts", "tsx", "mts", "cts"],
                "python": ["py", "pyw", "pyx"],
                "java": ["java"],
                "c": ["c", "h"],
                "cpp": ["cpp", "cc", "cxx", "hpp", "hh", "hxx"],
                "rust": ["rs"],
                "go": ["go"],
                "ruby": ["rb"],
                "php": ["php"],
                "html": ["html", "htm"],
                "css": ["css"],
                "json": ["json"],
                "xml": ["xml"],
                "yaml": ["yaml", "yml"],
                "markdown": ["md", "markdown"],
                "pdf": ["pdf"],
                "png": ["png"],
                "jpeg": ["jpg", "jpeg"],
                "gif": ["gif"],
                "webp": ["webp"],
                "svg": ["svg"],
                "mp3": ["mp3"],
                "mp4": ["mp4"],
                "wav": ["wav"],
                "zip": ["zip"],
                "gzip": ["gz", "gzip"],
                "tar": ["tar"],
                "rar": ["rar"],
                "7z": ["7z"],
                "doc": ["doc"],
                "docx": ["docx"],
                "xls": ["xls"],
                "xlsx": ["xlsx"],
                "ppt": ["ppt"],
                "pptx": ["pptx"],
            };

            const expectedExtensions = labelToExtensions[result.label] || [];
            extensionMatch = expectedExtensions.includes(ext) ||
                result.label.toLowerCase() === ext;
        }
    }

    return {
        label: result.label,
        description: result.description || result.label,
        confidence: result.score,
        mimeType: result.mimeType || "application/octet-stream",
        isText: isTextLabel(result.label),
        extensionMatch,
    };
}

/**
 * Check if a Magika label indicates text content
 */
function isTextLabel(label: string): boolean {
    const textLabels = new Set([
        "javascript", "typescript", "python", "java", "c", "cpp", "rust", "go",
        "ruby", "php", "html", "css", "json", "xml", "yaml", "markdown", "txt",
        "shell", "bash", "powershell", "sql", "csv", "ini", "toml", "dockerfile",
        "makefile", "gitignore", "editorconfig",
    ]);
    return textLabels.has(label.toLowerCase());
}

/**
 * Get content type warning if extension doesn't match detected type
 */
export function getTypeMismatchWarning(result: FileTypeResult, fileName: string): string | null {
    if (result.extensionMatch) {
        return null;
    }

    const ext = fileName.split(".").pop()?.toLowerCase() || "unknown";

    // High confidence mismatch is suspicious
    if (result.confidence > 0.9) {
        return `⚠️ File extension ".${ext}" does not match detected content type "${result.label}" (${(result.confidence * 100).toFixed(0)}% confidence)`;
    }

    // Lower confidence might just be ambiguous
    if (result.confidence > 0.7) {
        return `ℹ️ File may be "${result.label}" rather than "${ext}" (${(result.confidence * 100).toFixed(0)}% confidence)`;
    }

    return null;
}

/**
 * Validate uploaded file for security concerns
 * Returns warnings for potentially dangerous file types
 */
export async function validateUpload(
    data: Uint8Array,
    fileName: string,
    declaredMimeType?: string
): Promise<{
    detected: FileTypeResult;
    warnings: string[];
    blocked: boolean;
}> {
    const detected = await detectFileType(data, fileName);
    const warnings: string[] = [];
    let blocked = false;

    // Check for extension mismatch
    const mismatchWarning = getTypeMismatchWarning(detected, fileName);
    if (mismatchWarning) {
        warnings.push(mismatchWarning);
    }

    // Check for declared MIME type mismatch
    if (declaredMimeType && declaredMimeType !== detected.mimeType) {
        warnings.push(`Declared MIME type "${declaredMimeType}" differs from detected "${detected.mimeType}"`);
    }

    // Block dangerous file types
    const dangerousLabels = new Set([
        "executable", "dll", "elf", "mach-o", "dex", // executables
        "javascript", // could be XSS if served as HTML
    ]);

    // Only block executables disguised as other files
    if (dangerousLabels.has(detected.label) && !detected.extensionMatch) {
        warnings.push(`🚫 Blocked: Executable content detected in file with ".${fileName.split(".").pop()}" extension`);
        blocked = true;
    }

    return { detected, warnings, blocked };
}
