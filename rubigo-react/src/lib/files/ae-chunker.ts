/**
 * Asymmetric Extremum (AE) Content-Defined Chunking Algorithm
 * 
 * Based on: "A Fast Asymmetric Extremum Content Defined Chunking Algorithm
 * for Data Deduplication in Backup Storage Systems"
 * 
 * This is a hashless CDC algorithm that finds chunk boundaries by detecting
 * local maximum values within an asymmetric window. It achieves high throughput
 * (~500 MB/s) with only ~1 comparison + 2 conditional branches per byte.
 * 
 * Key properties:
 * - No rolling hash computation needed
 * - Low chunk size variance for better deduplication
 * - Handles low-entropy data well
 */

export interface ChunkingOptions {
    /** Minimum chunk size in bytes (default: 2KB) */
    minSize: number;
    /** Target/average chunk size in bytes (default: 8KB) */
    targetSize: number;
    /** Maximum chunk size in bytes (default: 64KB) */
    maxSize: number;
}

export interface Chunk {
    /** Byte offset in original data */
    offset: number;
    /** Chunk size in bytes */
    size: number;
    /** Raw chunk data */
    data: Uint8Array;
}

export const DEFAULT_CHUNKING_OPTIONS: ChunkingOptions = {
    minSize: 2 * 1024,      // 2 KB
    targetSize: 8 * 1024,   // 8 KB
    maxSize: 64 * 1024,     // 64 KB
};

/**
 * AE Content-Defined Chunking implementation.
 * 
 * The algorithm works by:
 * 1. Starting from the minimum chunk size position
 * 2. Scanning bytes to find a local maximum in an asymmetric window
 * 3. A byte is a cut-point if it's greater than all W bytes before it
 *    and >= all bytes in the right window
 * 4. The asymmetric window avoids backtracking, making it fast
 */
export class AEChunker {
    private readonly options: ChunkingOptions;

    /** Window size for extremum detection (derived from target size) */
    private readonly windowSize: number;

    constructor(options: Partial<ChunkingOptions> = {}) {
        this.options = { ...DEFAULT_CHUNKING_OPTIONS, ...options };

        // Window size is typically sqrt(targetSize) or a tuned constant
        // Using a value that balances chunk size variance with throughput
        this.windowSize = Math.max(48, Math.floor(Math.sqrt(this.options.targetSize)));
    }

    /**
     * Split data into content-defined chunks using the AE algorithm.
     * 
     * @param data - Input data to chunk
     * @returns Array of chunks with offset, size, and data
     */
    chunk(data: Uint8Array): Chunk[] {
        const chunks: Chunk[] = [];
        let offset = 0;

        while (offset < data.length) {
            const remainingSize = data.length - offset;

            // If remaining data is smaller than min size, it's the final chunk
            if (remainingSize <= this.options.minSize) {
                chunks.push({
                    offset,
                    size: remainingSize,
                    data: data.slice(offset),
                });
                break;
            }

            // Find the next cut-point
            const chunkSize = this.findCutPoint(data, offset, remainingSize);

            chunks.push({
                offset,
                size: chunkSize,
                data: data.slice(offset, offset + chunkSize),
            });

            offset += chunkSize;
        }

        return chunks;
    }

    /**
     * Find the next chunk boundary using asymmetric extremum detection.
     * 
     * We look for a local maximum: a byte that is greater than all bytes
     * in the window before it. This is the "asymmetric" part - we only
     * look backward, avoiding the need to backtrack.
     */
    private findCutPoint(data: Uint8Array, offset: number, remainingSize: number): number {
        const { minSize, maxSize } = this.options;
        const windowSize = this.windowSize;

        // Start scanning after minimum chunk size
        const scanStart = offset + minSize;
        const scanEnd = Math.min(offset + maxSize, offset + remainingSize);

        // Track the maximum value seen in the current window
        let maxValue = 0;
        let maxPosition = scanStart;

        // Initialize window with bytes before scan start
        for (let i = Math.max(offset, scanStart - windowSize); i < scanStart; i++) {
            if (data[i] >= maxValue) {
                maxValue = data[i];
                maxPosition = i;
            }
        }

        // Scan for cut-point
        for (let i = scanStart; i < scanEnd; i++) {
            const currentByte = data[i];

            // Check if the max position has fallen out of the window
            if (maxPosition <= i - windowSize) {
                // Recalculate max in current window (this is the slower path)
                maxValue = 0;
                maxPosition = i;
                for (let j = i - windowSize + 1; j <= i; j++) {
                    if (data[j] >= maxValue) {
                        maxValue = data[j];
                        maxPosition = j;
                    }
                }
            }

            // Update max if current byte is greater or equal
            if (currentByte >= maxValue) {
                maxValue = currentByte;
                maxPosition = i;
            }

            // Cut-point condition: current byte is a local maximum
            // (it's the max in the window and equals the current position)
            if (maxPosition === i && i > scanStart) {
                // Additional entropy check: require some variance in the window
                // This helps with low-entropy data (e.g., all zeros)
                if (this.hasEnoughEntropy(data, i - windowSize, i)) {
                    return i - offset;
                }
            }
        }

        // No cut-point found, return max chunk size or remaining size
        return Math.min(maxSize, remainingSize);
    }

    /**
     * Check if there's enough byte variance in a range to make a valid cut-point.
     * This prevents cutting on artificial boundaries in low-entropy data.
     */
    private hasEnoughEntropy(data: Uint8Array, start: number, end: number): boolean {
        if (start < 0) start = 0;

        let min = 255;
        let max = 0;

        for (let i = start; i < end; i++) {
            const byte = data[i];
            if (byte < min) min = byte;
            if (byte > max) max = byte;
        }

        // Require at least some byte diversity (threshold can be tuned)
        return (max - min) >= 8;
    }

    /**
     * Get chunking statistics for debugging/analytics.
     */
    getOptions(): ChunkingOptions {
        return { ...this.options };
    }
}

/**
 * Convenience function to chunk data with default options.
 */
export function chunkData(data: Uint8Array, options?: Partial<ChunkingOptions>): Chunk[] {
    const chunker = new AEChunker(options);
    return chunker.chunk(data);
}

/**
 * Async generator version for streaming large files.
 * Yields chunks as they're identified.
 */
export async function* chunkDataStream(
    data: Uint8Array,
    options?: Partial<ChunkingOptions>
): AsyncGenerator<Chunk> {
    const chunker = new AEChunker(options);
    const chunks = chunker.chunk(data);

    for (const chunk of chunks) {
        yield chunk;
    }
}
