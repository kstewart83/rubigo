/**
 * Image Finalizer
 * 
 * Creates golden snapshots of baked VM images.
 * Replaces finalize-image.sh functionality.
 */

import { $ } from "bun";
import { existsSync, statSync, renameSync } from "fs";
import { join } from "path";
import type { VdiConfig } from "./types";

export interface FinalizeOptions {
    /** Whether to compress the image (slower but smaller) */
    compress?: boolean;
    /** Keep backup of previous golden image */
    keepBackup?: boolean;
}

export interface FinalizeResult {
    goldenImagePath: string;
    sourceSize: string;
    goldenSize: string;
    backupPath?: string;
}

/**
 * Check if VM is still running (by process name)
 */
export async function isVmRunning(imagePattern: string = "ubuntu-desktop"): Promise<boolean> {
    try {
        const result = await $`pgrep -f ${imagePattern}`.quiet();
        return result.exitCode === 0;
    } catch {
        return false;
    }
}

/**
 * Create a golden snapshot from the current work image
 */
export async function finalizeImage(
    config: VdiConfig,
    templateName: string = "ubuntu-desktop",
    options: FinalizeOptions = {}
): Promise<FinalizeResult> {
    const { compress = false, keepBackup = true } = options;

    const sourceImage = join(config.imagesDir, `${templateName}.qcow2`);
    const goldenImage = join(config.imagesDir, `${templateName}-golden.qcow2`);
    const backupImage = join(config.imagesDir, `${templateName}-backup.qcow2`);

    // Validation
    if (!existsSync(sourceImage)) {
        throw new Error(`Source image not found: ${sourceImage}`);
    }

    if (await isVmRunning(templateName)) {
        throw new Error(
            "VM is still running! Shut down the VM first:\n" +
            "  ssh -p 2222 rubigo@localhost 'sudo shutdown -h now'"
        );
    }

    console.log("[Finalizer] Creating golden snapshot...");
    console.log(`  Source: ${sourceImage}`);
    console.log(`  Output: ${goldenImage}`);

    // Backup existing golden image
    let backupPath: string | undefined;
    if (existsSync(goldenImage) && keepBackup) {
        console.log("[Finalizer] Backing up previous golden image...");
        renameSync(goldenImage, backupImage);
        backupPath = backupImage;
    }

    // Create golden image
    if (compress) {
        console.log("[Finalizer] Creating compressed image (this takes a while)...");
        await $`qemu-img convert -O qcow2 -c ${sourceImage} ${goldenImage}`;
    } else {
        console.log("[Finalizer] Creating snapshot (fast copy)...");
        await $`qemu-img convert -O qcow2 ${sourceImage} ${goldenImage}`;
    }

    // Get file sizes
    const sourceSize = formatBytes(statSync(sourceImage).size);
    const goldenSize = formatBytes(statSync(goldenImage).size);

    console.log("[Finalizer] Golden image created!");
    console.log(`  Source size: ${sourceSize}`);
    console.log(`  Golden size: ${goldenSize}`);

    return {
        goldenImagePath: goldenImage,
        sourceSize,
        goldenSize,
        backupPath,
    };
}

/**
 * Get info about existing images
 */
export function getImageInfo(config: VdiConfig, templateName: string = "ubuntu-desktop"): {
    work: { exists: boolean; size?: string };
    golden: { exists: boolean; size?: string };
    backup: { exists: boolean; size?: string };
} {
    const workImage = join(config.imagesDir, `${templateName}.qcow2`);
    const goldenImage = join(config.imagesDir, `${templateName}-golden.qcow2`);
    const backupImage = join(config.imagesDir, `${templateName}-backup.qcow2`);

    return {
        work: existsSync(workImage)
            ? { exists: true, size: formatBytes(statSync(workImage).size) }
            : { exists: false },
        golden: existsSync(goldenImage)
            ? { exists: true, size: formatBytes(statSync(goldenImage).size) }
            : { exists: false },
        backup: existsSync(backupImage)
            ? { exists: true, size: formatBytes(statSync(backupImage).size) }
            : { exists: false },
    };
}

/**
 * Delete old backup images to free space
 */
export async function cleanupBackups(config: VdiConfig): Promise<string[]> {
    const { rm } = await import("fs/promises");
    const deleted: string[] = [];

    const backupPattern = /-backup\.qcow2$/;
    const { readdirSync } = await import("fs");

    for (const file of readdirSync(config.imagesDir)) {
        if (backupPattern.test(file)) {
            const path = join(config.imagesDir, file);
            await rm(path);
            deleted.push(path);
            console.log(`[Finalizer] Deleted backup: ${file}`);
        }
    }

    return deleted;
}

/**
 * Format bytes as human-readable string
 */
function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}
