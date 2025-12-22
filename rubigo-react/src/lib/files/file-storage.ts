/**
 * File Storage Service
 * 
 * High-level API for the Copy-on-Write Content-Addressable Storage system.
 * Coordinates chunking, storage, tree building, and versioning.
 */

import type { Database } from "bun:sqlite";
import { AEChunker, type ChunkingOptions, type Chunk } from "./ae-chunker";
import { ChunkStore, hashChunk } from "./chunk-store";
import { NodeStore, TreeBuilder, TreeTraverser, type ChunkRef } from "./file-tree";

export interface FileVersion {
    id: string;
    fileId: string;
    versionNumber: number;
    rootHash: string;
    size: number;
    chunkCount: number;
    checksum: string;
    createdBy: number;
    createdAt: string;
}

export interface StoredFile {
    id: string;
    profileId: string;
    folderId: string | null;
    name: string;
    currentVersionId: string | null;
    mimeType: string | null;
    detectedType: string | null;
    typeMismatch: boolean;
    totalSize: number;
    ownerId: number;
    checksum: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

export interface UploadResult {
    fileId: string;
    versionId: string;
    rootHash: string;
    size: number;
    chunkCount: number;
    checksum: string;
    duplicatedBytes: number;
    newBytes: number;
}

/**
 * Generate a short unique ID for files and versions.
 */
function generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
}

/**
 * Main file storage service.
 */
export class FileStorageService {
    private db: Database;
    private chunkStore: ChunkStore;
    private nodeStore: NodeStore;
    private treeBuilder: TreeBuilder;
    private treeTraverser: TreeTraverser;
    private chunker: AEChunker;

    constructor(db: Database, chunkingOptions?: Partial<ChunkingOptions>) {
        this.db = db;
        this.chunkStore = new ChunkStore(db);
        this.nodeStore = new NodeStore(db);
        this.treeBuilder = new TreeBuilder(this.nodeStore);
        this.treeTraverser = new TreeTraverser(this.nodeStore);
        this.chunker = new AEChunker(chunkingOptions);
    }

    /**
     * Upload file content and create a new version.
     * 
     * This is the main entry point for storing files:
     * 1. Chunk the data using AE CDC
     * 2. Store chunks with deduplication
     * 3. Build B-tree structure
     * 4. Create file version record
     */
    async uploadFile(params: {
        profileId: string;
        folderId: string | null;
        name: string;
        data: Uint8Array;
        mimeType?: string;
        detectedType?: string;
        typeMismatch?: boolean;
        ownerId: number;
        existingFileId?: string;
    }): Promise<UploadResult> {
        const { profileId, folderId, name, data, mimeType, detectedType, typeMismatch, ownerId, existingFileId } = params;

        // 1. Chunk the data
        const chunks = this.chunker.chunk(data);

        // 2. Compute hashes and check for duplicates
        const chunkHashes = chunks.map(c => hashChunk(c.data));
        const existingHashes = this.chunkStore.existsMany(chunkHashes);

        // Track deduplication stats
        let duplicatedBytes = 0;
        let newBytes = 0;

        // 3. Store chunks and build chunk refs
        const chunkRefs: ChunkRef[] = [];
        let offset = 0;

        const transaction = this.db.transaction(() => {
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const hash = chunkHashes[i];

                if (existingHashes.has(hash)) {
                    // Chunk already exists, just increment ref
                    this.chunkStore.incrementRef(hash);
                    duplicatedBytes += chunk.size;
                } else {
                    // New chunk, store it
                    this.chunkStore.put(chunk.data);
                    newBytes += chunk.size;
                }

                chunkRefs.push({
                    type: "chunk",
                    hash,
                    offset,
                    size: chunk.size,
                });

                offset += chunk.size;
            }

            // 4. Build B-tree
            const rootHash = this.treeBuilder.buildTree(chunkRefs);

            // 5. Compute file checksum
            const checksum = hashChunk(data);

            // 6. Create or update file record
            let fileId = existingFileId;
            let versionNumber = 1;

            if (fileId) {
                // Get next version number
                const lastVersion = this.db.prepare(`
          SELECT MAX(version_number) as max_version FROM file_versions WHERE file_id = ?
        `).get(fileId) as { max_version: number | null };
                versionNumber = (lastVersion?.max_version || 0) + 1;
            } else {
                // Create new file
                fileId = generateId();
                this.db.prepare(`
          INSERT INTO files (id, profile_id, folder_id, name, mime_type, detected_type, type_mismatch, total_size, owner_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).run(fileId, profileId, folderId, name, mimeType || null, detectedType || null, typeMismatch ? 1 : 0, data.length, ownerId);
            }

            // 7. Create version record
            const versionId = generateId();
            this.db.prepare(`
        INSERT INTO file_versions (id, file_id, version_number, root_hash, size, chunk_count, checksum, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(versionId, fileId, versionNumber, rootHash, data.length, chunks.length, checksum, ownerId);

            // 8. Update file to point to new version
            this.db.prepare(`
        UPDATE files SET current_version_id = ?, total_size = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(versionId, data.length, fileId);

            return {
                fileId,
                versionId,
                rootHash,
                size: data.length,
                chunkCount: chunks.length,
                checksum,
                duplicatedBytes,
                newBytes,
            };
        });

        return transaction() as UploadResult;
    }

    /**
     * Download file content by reassembling chunks.
     */
    async downloadFile(fileId: string, versionId?: string): Promise<Uint8Array | null> {
        // Get version - use raw DB column names
        type VersionRow = { id: string; root_hash: string; size: number };
        let version: VersionRow | undefined;

        if (versionId) {
            version = this.db.prepare(`
        SELECT id, root_hash, size FROM file_versions WHERE id = ?
      `).get(versionId) as VersionRow | undefined;
        } else {
            // Get current version
            const file = this.db.prepare(`
        SELECT current_version_id FROM files WHERE id = ?
      `).get(fileId) as { current_version_id: string } | undefined;

            if (!file?.current_version_id) return null;

            version = this.db.prepare(`
        SELECT id, root_hash, size FROM file_versions WHERE id = ?
      `).get(file.current_version_id) as VersionRow | undefined;
        }

        if (!version) return null;

        // Get chunk refs from tree
        const chunkRefs = this.treeTraverser.getChunkRefs(version.root_hash);

        // Reassemble file
        const result = new Uint8Array(version.size);
        let offset = 0;

        for (const ref of chunkRefs) {
            const chunkData = this.chunkStore.get(ref.hash);
            if (!chunkData) {
                throw new Error(`Missing chunk: ${ref.hash}`);
            }
            result.set(chunkData, offset);
            offset += chunkData.length;
        }

        return result;
    }

    /**
     * Get file metadata.
     */
    getFile(fileId: string): StoredFile | null {
        const row = this.db.prepare(`
      SELECT f.*, v.checksum 
      FROM files f 
      LEFT JOIN file_versions v ON f.current_version_id = v.id
      WHERE f.id = ? AND f.deleted_at IS NULL
    `).get(fileId) as Record<string, unknown> | undefined;

        if (!row) return null;

        return {
            id: row.id as string,
            profileId: row.profile_id as string,
            folderId: row.folder_id as string | null,
            name: row.name as string,
            currentVersionId: row.current_version_id as string | null,
            mimeType: row.mime_type as string | null,
            detectedType: row.detected_type as string | null,
            typeMismatch: (row.type_mismatch as number) === 1,
            totalSize: row.total_size as number,
            ownerId: row.owner_id as number,
            checksum: row.checksum as string | null,
            createdAt: row.created_at as string,
            updatedAt: row.updated_at as string,
            deletedAt: row.deleted_at as string | null,
        };
    }

    /**
     * List files in a folder.
     */
    listFiles(profileId: string, folderId: string | null): StoredFile[] {
        const query = folderId
            ? `SELECT f.*, v.checksum 
               FROM files f 
               LEFT JOIN file_versions v ON f.current_version_id = v.id
               WHERE f.profile_id = ? AND f.folder_id = ? AND f.deleted_at IS NULL 
               ORDER BY f.name`
            : `SELECT f.*, v.checksum 
               FROM files f 
               LEFT JOIN file_versions v ON f.current_version_id = v.id
               WHERE f.profile_id = ? AND f.folder_id IS NULL AND f.deleted_at IS NULL 
               ORDER BY f.name`;

        const rows = (folderId
            ? this.db.prepare(query).all(profileId, folderId)
            : this.db.prepare(query).all(profileId)) as Record<string, unknown>[];

        return rows.map(row => ({
            id: row.id as string,
            profileId: row.profile_id as string,
            folderId: row.folder_id as string | null,
            name: row.name as string,
            currentVersionId: row.current_version_id as string | null,
            mimeType: row.mime_type as string | null,
            detectedType: row.detected_type as string | null,
            typeMismatch: (row.type_mismatch as number) === 1,
            totalSize: row.total_size as number,
            ownerId: row.owner_id as number,
            checksum: row.checksum as string | null,
            createdAt: row.created_at as string,
            updatedAt: row.updated_at as string,
            deletedAt: row.deleted_at as string | null,
        }));
    }

    /**
     * Get version history for a file.
     */
    getVersionHistory(fileId: string): FileVersion[] {
        const rows = this.db.prepare(`
      SELECT * FROM file_versions WHERE file_id = ? ORDER BY version_number DESC
    `).all(fileId) as Record<string, unknown>[];

        return rows.map(row => ({
            id: row.id as string,
            fileId: row.file_id as string,
            versionNumber: row.version_number as number,
            rootHash: row.root_hash as string,
            size: row.size as number,
            chunkCount: row.chunk_count as number,
            checksum: row.checksum as string,
            createdBy: row.created_by as number,
            createdAt: row.created_at as string,
        }));
    }

    /**
     * Soft delete a file.
     */
    deleteFile(fileId: string): boolean {
        const result = this.db.prepare(`
      UPDATE files SET deleted_at = datetime('now') WHERE id = ?
    `).run(fileId);
        return result.changes > 0;
    }

    /**
     * Rename a file.
     */
    renameFile(fileId: string, newName: string): boolean {
        const result = this.db.prepare(`
      UPDATE files SET name = ?, updated_at = datetime('now') WHERE id = ?
    `).run(newName, fileId);
        return result.changes > 0;
    }

    /**
     * Move a file to a different folder.
     */
    moveFile(fileId: string, newFolderId: string | null): boolean {
        const result = this.db.prepare(`
      UPDATE files SET folder_id = ?, updated_at = datetime('now') WHERE id = ?
    `).run(newFolderId, fileId);
        return result.changes > 0;
    }

    /**
     * Get storage statistics.
     */
    getStorageStats() {
        return this.chunkStore.getStats();
    }
}
