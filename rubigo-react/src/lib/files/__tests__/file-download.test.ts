/**
 * File Download API Tests - TDD Red-Green-Refactor
 * 
 * Isolating failures by testing each component separately.
 */

import { describe, expect, test, beforeAll, afterAll, beforeEach } from "bun:test";
import { Database } from "bun:sqlite";
import { createHash } from "crypto";

// Import components under test
import { ChunkStore, hashChunk } from "../chunk-store";
import { NodeStore, TreeBuilder, TreeTraverser, type ChunkRef } from "../file-tree";
import { FileStorageService } from "../file-storage";

// ============================================================================
// Test 1: hashChunk function
// ============================================================================
describe("hashChunk", () => {
    test("should produce consistent SHA-256 hash", () => {
        const data = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
        const hash1 = hashChunk(data);
        const hash2 = hashChunk(data);

        expect(hash1).toBe(hash2);
        expect(hash1).toHaveLength(64); // SHA-256 hex

        // Verify against Node.js crypto
        const expected = createHash("sha256").update(data).digest("hex");
        expect(hash1).toBe(expected);
    });
});

// ============================================================================
// Test 2: ChunkStore - fresh database per test
// ============================================================================
describe("ChunkStore", () => {
    let db: Database;

    beforeEach(() => {
        db = new Database(":memory:");
        db.run(`
            CREATE TABLE chunks (
                hash TEXT PRIMARY KEY,
                data BLOB NOT NULL,
                size INTEGER NOT NULL,
                ref_count INTEGER DEFAULT 1,
                created_at TEXT DEFAULT (datetime('now'))
            )
        `);
    });

    test("should store and retrieve a chunk", () => {
        const store = new ChunkStore(db as any);
        const data = new Uint8Array([1, 2, 3, 4, 5]);

        // Store
        const hash = store.put(data);
        expect(hash).toHaveLength(64);

        // Retrieve
        const retrieved = store.get(hash);
        expect(retrieved).not.toBeNull();
        expect(retrieved).toEqual(data);
    });

    test("should return null for non-existent chunk", () => {
        const store = new ChunkStore(db as any);
        const result = store.get("nonexistent000000000000000000000000000000000000000000000000000");
        expect(result).toBeNull();
    });

    test("existsMany should only return hashes that actually exist", () => {
        const store = new ChunkStore(db as any);

        // Store one chunk
        const data1 = new Uint8Array([1, 2, 3]);
        const hash1 = store.put(data1);

        // Check for hash1 and a non-existent hash
        const existingSet = store.existsMany([hash1, "nonexistent"]);

        expect(existingSet.has(hash1)).toBe(true);
        expect(existingSet.has("nonexistent")).toBe(false);
        expect(existingSet.size).toBe(1);
    });
});

// ============================================================================
// Test 3: NodeStore - fresh database per test
// ============================================================================
describe("NodeStore", () => {
    let db: Database;

    beforeEach(() => {
        db = new Database(":memory:");
        db.run(`
            CREATE TABLE file_nodes (
                hash TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                level INTEGER NOT NULL,
                child_count INTEGER NOT NULL,
                created_at TEXT DEFAULT (datetime('now'))
            )
        `);
    });

    test("should store and retrieve a tree node", () => {
        const store = new NodeStore(db as any);

        const chunkRef: ChunkRef = {
            type: "chunk",
            hash: "abc123",
            offset: 0,
            size: 100,
        };

        const node = {
            level: 0,
            children: [chunkRef],
            totalSize: 100,
            totalChunks: 1,
        };

        const hash = store.put(node);
        expect(hash).toHaveLength(64);

        const retrieved = store.get(hash);
        expect(retrieved).not.toBeNull();
        expect(retrieved?.level).toBe(0);
        expect(retrieved?.children).toHaveLength(1);
        expect((retrieved?.children[0] as ChunkRef).hash).toBe("abc123");
    });
});

// ============================================================================
// Test 4: TreeBuilder + TreeTraverser round-trip
// ============================================================================
describe("TreeBuilder + TreeTraverser", () => {
    let db: Database;

    beforeEach(() => {
        db = new Database(":memory:");
        db.run(`
            CREATE TABLE file_nodes (
                hash TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                level INTEGER NOT NULL,
                child_count INTEGER NOT NULL,
                created_at TEXT DEFAULT (datetime('now'))
            )
        `);
    });

    test("should build tree and traverse to get chunk refs back", () => {
        const nodeStore = new NodeStore(db as any);
        const builder = new TreeBuilder(nodeStore);
        const traverser = new TreeTraverser(nodeStore);

        const chunkRefs: ChunkRef[] = [
            { type: "chunk", hash: "hash1", offset: 0, size: 100 },
            { type: "chunk", hash: "hash2", offset: 100, size: 150 },
        ];

        // Build tree
        const rootHash = builder.buildTree(chunkRefs);
        expect(rootHash).toHaveLength(64);

        // Traverse to get chunks back
        const retrievedRefs = traverser.getChunkRefs(rootHash);
        expect(retrievedRefs).toHaveLength(2);
        expect(retrievedRefs[0].hash).toBe("hash1");
        expect(retrievedRefs[1].hash).toBe("hash2");
    });
});

// ============================================================================
// Test 5: Full upload/download round-trip - fresh database
// ============================================================================
describe("FileStorageService upload/download", () => {
    let db: Database;

    beforeEach(() => {
        db = new Database(":memory:");

        db.run(`
            CREATE TABLE chunks (
                hash TEXT PRIMARY KEY,
                data BLOB NOT NULL,
                size INTEGER NOT NULL,
                ref_count INTEGER DEFAULT 1,
                created_at TEXT DEFAULT (datetime('now'))
            )
        `);

        db.run(`
            CREATE TABLE file_nodes (
                hash TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                level INTEGER NOT NULL,
                child_count INTEGER NOT NULL,
                created_at TEXT DEFAULT (datetime('now'))
            )
        `);

        db.run(`
            CREATE TABLE files (
                id TEXT PRIMARY KEY,
                profile_id TEXT NOT NULL,
                folder_id TEXT,
                name TEXT NOT NULL,
                current_version_id TEXT,
                mime_type TEXT,
                detected_type TEXT,
                type_mismatch INTEGER DEFAULT 0,
                total_size INTEGER DEFAULT 0,
                owner_id TEXT NOT NULL,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now')),
                deleted_at TEXT
            )
        `);

        db.run(`
            CREATE TABLE file_versions (
                id TEXT PRIMARY KEY,
                file_id TEXT NOT NULL,
                version_number INTEGER NOT NULL,
                root_hash TEXT NOT NULL,
                size INTEGER NOT NULL,
                chunk_count INTEGER NOT NULL,
                checksum TEXT NOT NULL,
                created_by TEXT NOT NULL,
                created_at TEXT DEFAULT (datetime('now'))
            )
        `);
    });

    test("should upload and download small file", async () => {
        const storage = new FileStorageService(db as any);
        const testData = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"

        // Verify chunks table is empty before upload
        const chunksBefore = db.prepare("SELECT COUNT(*) as count FROM chunks").get() as { count: number };
        expect(chunksBefore.count).toBe(0);

        // Upload
        const result = await storage.uploadFile({
            profileId: "test",
            folderId: null,
            name: "hello.txt",
            data: testData,
            mimeType: "text/plain",
            ownerId: "user1",
        });

        // Verify upload result
        expect(result.fileId).toBeDefined();
        expect(result.versionId).toBeDefined();
        expect(result.size).toBe(5);
        expect(result.newBytes).toBe(5); // Should be new, not duplicated
        expect(result.duplicatedBytes).toBe(0);

        // Verify chunk was stored
        const chunksAfter = db.prepare("SELECT hash, size FROM chunks").all() as { hash: string; size: number }[];
        expect(chunksAfter.length).toBe(1);
        expect(chunksAfter[0].hash).toBe(result.checksum); // For single-chunk file, chunk hash = file checksum

        // Download
        const downloaded = await storage.downloadFile(result.fileId);

        expect(downloaded).not.toBeNull();
        expect(downloaded).toEqual(testData);
    });

    test("should handle empty file", async () => {
        const storage = new FileStorageService(db as any);
        const testData = new Uint8Array(0);

        const result = await storage.uploadFile({
            profileId: "test",
            folderId: null,
            name: "empty.txt",
            data: testData,
            mimeType: "text/plain",
            ownerId: "user1",
        });

        expect(result.size).toBe(0);
        expect(result.chunkCount).toBe(0);

        const downloaded = await storage.downloadFile(result.fileId);
        expect(downloaded).not.toBeNull();
        expect(downloaded?.length).toBe(0);
    });
});
