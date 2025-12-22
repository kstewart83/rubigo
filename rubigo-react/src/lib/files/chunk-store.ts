/**
 * Content-Addressable Chunk Store
 * 
 * Handles storage and retrieval of immutable chunks using SHA-256 hashes
 * as content addresses. Chunks are stored in SQLite and can be safely
 * cached forever since they never change.
 */

import type { Database } from "better-sqlite3";
import { createHash } from "crypto";
import type { Chunk } from "./ae-chunker";

export interface StoredChunk {
    hash: string;
    size: number;
    refCount: number;
    createdAt: string;
}

export interface ChunkStoreStats {
    totalChunks: number;
    totalBytes: number;
    uniqueBytes: number;
    deduplicationRatio: number;
}

/**
 * Compute SHA-256 hash of data and return as hex string.
 */
export function hashChunk(data: Uint8Array): string {
    return createHash("sha256").update(data).digest("hex");
}

/**
 * Content-addressable chunk store backed by SQLite.
 * 
 * Key operations:
 * - put: Store chunk if not exists, increment ref count if exists
 * - get: Retrieve chunk data by hash
 * - incrementRef: Increase reference count
 * - decrementRef: Decrease reference count (for garbage collection)
 */
export class ChunkStore {
    private db: Database;

    // Prepared statements for performance
    private stmtGet: ReturnType<Database["prepare"]>;
    private stmtInsert: ReturnType<Database["prepare"]>;
    private stmtIncrementRef: ReturnType<Database["prepare"]>;
    private stmtDecrementRef: ReturnType<Database["prepare"]>;
    private stmtExists: ReturnType<Database["prepare"]>;

    constructor(db: Database) {
        this.db = db;

        // Prepare statements once for reuse
        this.stmtGet = db.prepare(`
      SELECT hash, data, size, ref_count, created_at
      FROM chunks WHERE hash = ?
    `);

        this.stmtInsert = db.prepare(`
      INSERT INTO chunks (hash, data, size, ref_count, created_at)
      VALUES (?, ?, ?, 1, datetime('now'))
      ON CONFLICT(hash) DO UPDATE SET ref_count = ref_count + 1
    `);

        this.stmtIncrementRef = db.prepare(`
      UPDATE chunks SET ref_count = ref_count + 1 WHERE hash = ?
    `);

        this.stmtDecrementRef = db.prepare(`
      UPDATE chunks SET ref_count = ref_count - 1 WHERE hash = ?
    `);

        this.stmtExists = db.prepare(`
      SELECT 1 FROM chunks WHERE hash = ?
    `);
    }

    /**
     * Store a chunk, returning its hash. If the chunk already exists,
     * just increment its reference count (deduplication).
     */
    put(data: Uint8Array): string {
        const hash = hashChunk(data);
        this.stmtInsert.run(hash, Buffer.from(data), data.length);
        return hash;
    }

    /**
     * Store multiple chunks from the AE chunker output.
     * Returns array of hashes in the same order as input chunks.
     */
    putChunks(chunks: Chunk[]): string[] {
        const hashes: string[] = [];

        // Use a transaction for better performance with multiple inserts
        const transaction = this.db.transaction(() => {
            for (const chunk of chunks) {
                const hash = this.put(chunk.data);
                hashes.push(hash);
            }
        });

        transaction();
        return hashes;
    }

    /**
     * Retrieve chunk data by hash.
     * Returns null if chunk doesn't exist.
     */
    get(hash: string): Uint8Array | null {
        const row = this.stmtGet.get(hash) as { data: Buffer } | undefined;
        if (!row) return null;
        return new Uint8Array(row.data);
    }

    /**
     * Retrieve multiple chunks by hashes.
     * Returns Map of hash -> data. Missing chunks are omitted.
     */
    getMany(hashes: string[]): Map<string, Uint8Array> {
        const result = new Map<string, Uint8Array>();

        for (const hash of hashes) {
            const data = this.get(hash);
            if (data) {
                result.set(hash, data);
            }
        }

        return result;
    }

    /**
     * Check if a chunk exists by hash.
     */
    exists(hash: string): boolean {
        return this.stmtExists.get(hash) != null;
    }

    /**
     * Batch check for existing chunks.
     * Returns Set of hashes that already exist (can be deduplicated).
     */
    existsMany(hashes: string[]): Set<string> {
        const existing = new Set<string>();

        for (const hash of hashes) {
            if (this.exists(hash)) {
                existing.add(hash);
            }
        }

        return existing;
    }

    /**
     * Increment reference count for a chunk.
     * Called when a new file version references an existing chunk.
     */
    incrementRef(hash: string): void {
        this.stmtIncrementRef.run(hash);
    }

    /**
     * Decrement reference count for a chunk.
     * Chunks with ref_count=0 can be garbage collected.
     */
    decrementRef(hash: string): void {
        this.stmtDecrementRef.run(hash);
    }

    /**
     * Get metadata for a chunk without fetching the data.
     */
    getMetadata(hash: string): StoredChunk | null {
        const row = this.stmtGet.get(hash) as {
            hash: string;
            size: number;
            ref_count: number;
            created_at: string;
        } | undefined;

        if (!row) return null;

        return {
            hash: row.hash,
            size: row.size,
            refCount: row.ref_count,
            createdAt: row.created_at,
        };
    }

    /**
     * Get storage statistics.
     */
    getStats(): ChunkStoreStats {
        const stats = this.db.prepare(`
      SELECT 
        COUNT(*) as total_chunks,
        COALESCE(SUM(size), 0) as unique_bytes,
        COALESCE(SUM(size * ref_count), 0) as total_bytes
      FROM chunks
    `).get() as { total_chunks: number; unique_bytes: number; total_bytes: number };

        const deduplicationRatio = stats.total_bytes > 0
            ? 1 - (stats.unique_bytes / stats.total_bytes)
            : 0;

        return {
            totalChunks: stats.total_chunks,
            totalBytes: stats.total_bytes,
            uniqueBytes: stats.unique_bytes,
            deduplicationRatio,
        };
    }

    /**
     * Find chunks with zero references (candidates for garbage collection).
     */
    findOrphanedChunks(limit = 1000): string[] {
        const rows = this.db.prepare(`
      SELECT hash FROM chunks WHERE ref_count <= 0 LIMIT ?
    `).all(limit) as { hash: string }[];

        return rows.map(r => r.hash);
    }

    /**
     * Delete orphaned chunks (ref_count = 0).
     * Returns number of chunks deleted.
     */
    deleteOrphanedChunks(limit = 1000): number {
        const result = this.db.prepare(`
      DELETE FROM chunks WHERE hash IN (
        SELECT hash FROM chunks WHERE ref_count <= 0 LIMIT ?
      )
    `).run(limit);

        return result.changes;
    }
}
