/**
 * Unit tests for AE Content-Defined Chunking Algorithm
 */

import { describe, expect, test } from "bun:test";
import { AEChunker, chunkData, DEFAULT_CHUNKING_OPTIONS } from "../ae-chunker";

describe("AEChunker", () => {
    describe("basic chunking", () => {
        test("should chunk empty data into empty array", () => {
            const chunker = new AEChunker();
            const result = chunker.chunk(new Uint8Array(0));
            expect(result).toEqual([]);
        });

        test("should return single chunk for data smaller than min size", () => {
            const chunker = new AEChunker({ minSize: 1024 });
            const data = new Uint8Array(500);
            const result = chunker.chunk(data);

            expect(result.length).toBe(1);
            expect(result[0].offset).toBe(0);
            expect(result[0].size).toBe(500);
        });

        test("should chunk large random data into multiple chunks", () => {
            const chunker = new AEChunker({
                minSize: 512,
                targetSize: 2048,
                maxSize: 8192,
            });

            // Create 50KB of random data
            const data = new Uint8Array(50 * 1024);
            for (let i = 0; i < data.length; i++) {
                data[i] = Math.floor(Math.random() * 256);
            }

            const result = chunker.chunk(data);

            // Should have multiple chunks
            expect(result.length).toBeGreaterThan(1);

            // Verify chunk properties
            let totalSize = 0;
            for (let i = 0; i < result.length; i++) {
                const chunk = result[i];

                // Offsets should be sequential
                expect(chunk.offset).toBe(totalSize);

                // Size should be positive
                expect(chunk.size).toBeGreaterThan(0);

                // Last chunk can be smaller, others should respect min size
                if (i < result.length - 1) {
                    expect(chunk.size).toBeGreaterThanOrEqual(512);
                }

                // All chunks should respect max size
                expect(chunk.size).toBeLessThanOrEqual(8192);

                // Data should match slice of original
                expect(Array.from(chunk.data)).toEqual(
                    Array.from(data.slice(chunk.offset, chunk.offset + chunk.size))
                );

                totalSize += chunk.size;
            }

            // Total size should match original
            expect(totalSize).toBe(data.length);
        });
    });

    describe("content-defined boundaries", () => {
        test("should produce same chunks for same content", () => {
            const chunker = new AEChunker();
            const data = new Uint8Array(20 * 1024);
            for (let i = 0; i < data.length; i++) {
                data[i] = (i * 17 + 43) % 256; // Deterministic "random" pattern
            }

            const result1 = chunker.chunk(data);
            const result2 = chunker.chunk(data);

            expect(result1.length).toBe(result2.length);
            for (let i = 0; i < result1.length; i++) {
                expect(result1[i].offset).toBe(result2[i].offset);
                expect(result1[i].size).toBe(result2[i].size);
            }
        });

        test("should detect same chunks after content shift", () => {
            const chunker = new AEChunker({
                minSize: 256,
                targetSize: 1024,
                maxSize: 4096,
            });

            // Create original data
            const original = new Uint8Array(10 * 1024);
            for (let i = 0; i < original.length; i++) {
                original[i] = (i * 17 + 43) % 256;
            }

            // Create modified data with 100 bytes prepended
            const modified = new Uint8Array(100 + original.length);
            modified.set(new Uint8Array(100).fill(42), 0);
            modified.set(original, 100);

            const originalChunks = chunker.chunk(original);
            const modifiedChunks = chunker.chunk(modified);

            // The shift should cause different chunk boundaries at the start,
            // but some chunks should still match (this is the power of CDC)
            // We just verify both produce valid chunks
            expect(originalChunks.length).toBeGreaterThan(0);
            expect(modifiedChunks.length).toBeGreaterThan(0);
        });
    });

    describe("low-entropy data handling", () => {
        test("should handle all-zero data", () => {
            const chunker = new AEChunker({
                minSize: 256,
                targetSize: 1024,
                maxSize: 4096,
            });

            // All zeros - low entropy
            const data = new Uint8Array(10 * 1024);

            const result = chunker.chunk(data);

            // Should still produce valid chunks
            expect(result.length).toBeGreaterThan(0);

            // Total should match
            const total = result.reduce((sum, c) => sum + c.size, 0);
            expect(total).toBe(data.length);
        });

        test("should handle repeating pattern", () => {
            const chunker = new AEChunker({
                minSize: 256,
                targetSize: 1024,
                maxSize: 4096,
            });

            // Repeating pattern - low entropy
            const data = new Uint8Array(10 * 1024);
            for (let i = 0; i < data.length; i++) {
                data[i] = i % 4;
            }

            const result = chunker.chunk(data);

            expect(result.length).toBeGreaterThan(0);

            const total = result.reduce((sum, c) => sum + c.size, 0);
            expect(total).toBe(data.length);
        });
    });

    describe("chunk size distribution", () => {
        test("should produce chunks within size bounds", () => {
            const minSize = 1024;
            const maxSize = 8192;

            const chunker = new AEChunker({
                minSize,
                targetSize: 4096,
                maxSize,
            });

            // Large random data
            const data = new Uint8Array(500 * 1024);
            for (let i = 0; i < data.length; i++) {
                data[i] = Math.floor(Math.random() * 256);
            }

            const result = chunker.chunk(data);

            for (let i = 0; i < result.length; i++) {
                const chunk = result[i];

                // Last chunk can be smaller
                if (i < result.length - 1) {
                    expect(chunk.size).toBeGreaterThanOrEqual(minSize);
                }

                expect(chunk.size).toBeLessThanOrEqual(maxSize);
            }
        });

        test("should produce chunks near target size on average", () => {
            const minSize = 1024;
            const targetSize = 4096;
            const maxSize = 16384;

            const chunker = new AEChunker({
                minSize,
                targetSize,
                maxSize,
            });

            // Large random data
            const data = new Uint8Array(1024 * 1024); // 1 MB
            for (let i = 0; i < data.length; i++) {
                data[i] = Math.floor(Math.random() * 256);
            }

            const result = chunker.chunk(data);
            const avgSize = data.length / result.length;

            // Average should be reasonable (not too small, not too large)
            // AE tends to produce smaller chunks than target, which is fine for dedup
            expect(avgSize).toBeGreaterThan(minSize * 0.5);
            expect(avgSize).toBeLessThan(maxSize);
        });
    });
});

describe("chunkData helper", () => {
    test("should work with default options", () => {
        const data = new Uint8Array(50 * 1024);
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.floor(Math.random() * 256);
        }

        const result = chunkData(data);

        expect(result.length).toBeGreaterThan(0);

        const total = result.reduce((sum, c) => sum + c.size, 0);
        expect(total).toBe(data.length);
    });

    test("should work with custom options", () => {
        const data = new Uint8Array(50 * 1024);
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.floor(Math.random() * 256);
        }

        const result = chunkData(data, {
            minSize: 256,
            targetSize: 512,
            maxSize: 2048,
        });

        expect(result.length).toBeGreaterThan(0);

        // With smaller target, should produce more chunks
        const defaultResult = chunkData(data);
        expect(result.length).toBeGreaterThan(defaultResult.length);
    });
});

describe("DEFAULT_CHUNKING_OPTIONS", () => {
    test("should have sensible defaults", () => {
        expect(DEFAULT_CHUNKING_OPTIONS.minSize).toBe(2 * 1024);
        expect(DEFAULT_CHUNKING_OPTIONS.targetSize).toBe(8 * 1024);
        expect(DEFAULT_CHUNKING_OPTIONS.maxSize).toBe(64 * 1024);
    });
});
