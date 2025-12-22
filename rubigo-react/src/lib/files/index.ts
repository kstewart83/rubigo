/**
 * File Manager - Copy-on-Write Content-Addressable Storage
 * 
 * This module implements a deduplicating, versioned file storage system using:
 * 
 * 1. **AE CDC Algorithm**: Asymmetric Extremum Content-Defined Chunking for
 *    splitting files into variable-sized chunks with high throughput (~500 MB/s).
 * 
 * 2. **Content-Addressable Storage**: Chunks are stored by their SHA-256 hash,
 *    enabling automatic deduplication across files and versions.
 * 
 * 3. **Copy-on-Write B-Tree**: File structure is represented as an immutable
 *    tree of nodes, enabling efficient versioning with structural sharing.
 * 
 * Key benefits:
 * - Efficient storage through deduplication
 * - Instant versioning and snapshots
 * - Aggressive caching due to immutability
 * - O(log n) version creation for modified files
 * 
 * @example
 * ```typescript
 * import { FileStorageService } from "@/lib/files";
 * 
 * const storage = new FileStorageService(db);
 * 
 * // Upload a file
 * const result = await storage.uploadFile({
 *   profileId: "mmc",
 *   folderId: null,
 *   name: "document.pdf",
 *   data: new Uint8Array(pdfBuffer),
 *   mimeType: "application/pdf",
 *   ownerId: userId,
 * });
 * 
 * console.log(`Stored ${result.size} bytes in ${result.chunkCount} chunks`);
 * console.log(`Deduplicated ${result.duplicatedBytes} bytes`);
 * 
 * // Download a file
 * const data = await storage.downloadFile(result.fileId);
 * ```
 */

// AE Content-Defined Chunking
export {
    AEChunker,
    chunkData,
    chunkDataStream,
    DEFAULT_CHUNKING_OPTIONS,
    type Chunk,
    type ChunkingOptions,
} from "./ae-chunker";

// Content-Addressable Chunk Store
export {
    ChunkStore,
    hashChunk,
    type StoredChunk,
    type ChunkStoreStats,
} from "./chunk-store";

// Copy-on-Write B-Tree
export {
    NodeStore,
    TreeBuilder,
    TreeTraverser,
    type ChunkRef,
    type NodeRef,
    type TreeChild,
    type TreeNode,
} from "./file-tree";

// High-Level File Storage Service
export {
    FileStorageService,
    type FileVersion,
    type StoredFile,
    type UploadResult,
} from "./file-storage";

// AI-Powered File Type Detection (optional - requires magika package)
export {
    detectFileType,
    validateUpload,
    getTypeMismatchWarning,
    type FileTypeResult,
} from "./magika";
