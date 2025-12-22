/**
 * Copy-on-Write B-Tree for File Structure
 * 
 * Implements an immutable B-tree structure where each file version is
 * represented as a tree of nodes pointing to content chunks.
 * 
 * Key properties:
 * - All nodes are immutable and content-addressed
 * - Structural sharing: unchanged subtrees are shared between versions
 * - O(log n) version creation for modified files
 * - Instant snapshots by duplicating root reference
 */

import type { Database } from "bun:sqlite";
import { createHash } from "crypto";

/**
 * Reference to a content chunk (leaf data).
 */
export interface ChunkRef {
    type: "chunk";
    /** SHA-256 hash of chunk content */
    hash: string;
    /** Byte offset in the original file */
    offset: number;
    /** Chunk size in bytes */
    size: number;
}

/**
 * Reference to a child node.
 */
export interface NodeRef {
    type: "node";
    /** SHA-256 hash of node content */
    hash: string;
    /** Total size of all chunks under this node */
    size: number;
    /** Total number of chunks under this node */
    chunkCount: number;
}

export type TreeChild = ChunkRef | NodeRef;

/**
 * A B-tree node containing references to chunks or child nodes.
 */
export interface TreeNode {
    /** Tree level: 0 = points to chunks, 1+ = points to nodes */
    level: number;
    /** Array of children (chunks or nodes) */
    children: TreeChild[];
    /** Total size of all data under this node */
    totalSize: number;
    /** Total number of chunks under this node */
    totalChunks: number;
}

/**
 * Serialized node format for storage.
 */
interface SerializedNode {
    level: number;
    children: TreeChild[];
    totalSize: number;
    totalChunks: number;
}

/** Maximum children per node (controls tree width) */
const MAX_CHILDREN_PER_NODE = 256;

/** Minimum children per node (except root) */
const MIN_CHILDREN_PER_NODE = 32;

/**
 * Compute hash of a serialized node.
 */
function hashNode(node: SerializedNode): string {
    const json = JSON.stringify(node);
    return createHash("sha256").update(json).digest("hex");
}

/**
 * Node store backed by SQLite.
 */
export class NodeStore {
    private db: Database;

    private stmtGet: ReturnType<Database["prepare"]>;
    private stmtInsert: ReturnType<Database["prepare"]>;
    private stmtExists: ReturnType<Database["prepare"]>;

    constructor(db: Database) {
        this.db = db;

        this.stmtGet = db.prepare(`
      SELECT hash, data, level, child_count FROM file_nodes WHERE hash = ?
    `);

        this.stmtInsert = db.prepare(`
      INSERT OR IGNORE INTO file_nodes (hash, data, level, child_count, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `);

        this.stmtExists = db.prepare(`
      SELECT 1 FROM file_nodes WHERE hash = ?
    `);
    }

    /**
     * Store a node, returning its hash.
     */
    put(node: TreeNode): string {
        const serialized: SerializedNode = {
            level: node.level,
            children: node.children,
            totalSize: node.totalSize,
            totalChunks: node.totalChunks,
        };

        const hash = hashNode(serialized);
        const json = JSON.stringify(serialized);

        this.stmtInsert.run(hash, json, node.level, node.children.length);

        return hash;
    }

    /**
     * Retrieve a node by hash.
     */
    get(hash: string): TreeNode | null {
        const row = this.stmtGet.get(hash) as { data: string } | undefined;
        if (!row) return null;

        const parsed = JSON.parse(row.data) as SerializedNode;
        return {
            level: parsed.level,
            children: parsed.children,
            totalSize: parsed.totalSize,
            totalChunks: parsed.totalChunks,
        };
    }

    /**
     * Check if a node exists.
     */
    exists(hash: string): boolean {
        return this.stmtExists.get(hash) !== undefined;
    }
}

/**
 * Build a B-tree from an array of chunk references.
 * 
 * Creates a balanced tree where:
 * - Level 0 nodes point directly to chunks
 * - Level 1+ nodes point to lower-level nodes
 * - Each node has at most MAX_CHILDREN_PER_NODE children
 */
export class TreeBuilder {
    private nodeStore: NodeStore;

    constructor(nodeStore: NodeStore) {
        this.nodeStore = nodeStore;
    }

    /**
     * Build a tree from chunk references and store all nodes.
     * Returns the root hash.
     */
    buildTree(chunkRefs: ChunkRef[]): string {
        if (chunkRefs.length === 0) {
            // Empty file: create empty root
            const emptyNode: TreeNode = {
                level: 0,
                children: [],
                totalSize: 0,
                totalChunks: 0,
            };
            return this.nodeStore.put(emptyNode);
        }

        // Start with level 0 nodes containing chunk references
        let currentLevel: NodeRef[] = this.buildLevel0(chunkRefs);
        let level = 1;

        // Build higher levels until we have a single root
        while (currentLevel.length > 1) {
            currentLevel = this.buildHigherLevel(currentLevel, level);
            level++;
        }

        // Return the root hash
        return currentLevel[0].hash;
    }

    /**
     * Build level 0 nodes that point directly to chunks.
     */
    private buildLevel0(chunkRefs: ChunkRef[]): NodeRef[] {
        const nodeRefs: NodeRef[] = [];

        for (let i = 0; i < chunkRefs.length; i += MAX_CHILDREN_PER_NODE) {
            const children = chunkRefs.slice(i, i + MAX_CHILDREN_PER_NODE);

            const totalSize = children.reduce((sum, c) => sum + c.size, 0);
            const totalChunks = children.length;

            const node: TreeNode = {
                level: 0,
                children,
                totalSize,
                totalChunks,
            };

            const hash = this.nodeStore.put(node);

            nodeRefs.push({
                type: "node",
                hash,
                size: totalSize,
                chunkCount: totalChunks,
            });
        }

        return nodeRefs;
    }

    /**
     * Build a higher level of nodes from lower-level node references.
     */
    private buildHigherLevel(nodeRefs: NodeRef[], level: number): NodeRef[] {
        const result: NodeRef[] = [];

        for (let i = 0; i < nodeRefs.length; i += MAX_CHILDREN_PER_NODE) {
            const children = nodeRefs.slice(i, i + MAX_CHILDREN_PER_NODE);

            const totalSize = children.reduce((sum, c) => sum + c.size, 0);
            const totalChunks = children.reduce((sum, c) => sum + c.chunkCount, 0);

            const node: TreeNode = {
                level,
                children,
                totalSize,
                totalChunks,
            };

            const hash = this.nodeStore.put(node);

            result.push({
                type: "node",
                hash,
                size: totalSize,
                chunkCount: totalChunks,
            });
        }

        return result;
    }
}

/**
 * Traverse a tree and yield chunk references in order.
 * Used for reassembling file content.
 */
export class TreeTraverser {
    private nodeStore: NodeStore;

    constructor(nodeStore: NodeStore) {
        this.nodeStore = nodeStore;
    }

    /**
     * Get all chunk references from a tree in order.
     */
    getChunkRefs(rootHash: string): ChunkRef[] {
        const chunks: ChunkRef[] = [];
        this.traverseNode(rootHash, chunks);
        return chunks;
    }

    /**
     * Recursively traverse a node and collect chunk references.
     */
    private traverseNode(nodeHash: string, chunks: ChunkRef[]): void {
        const node = this.nodeStore.get(nodeHash);
        if (!node) {
            throw new Error(`Node not found: ${nodeHash}`);
        }

        for (const child of node.children) {
            if (child.type === "chunk") {
                chunks.push(child);
            } else {
                this.traverseNode(child.hash, chunks);
            }
        }
    }

    /**
     * Get total size of file from root node.
     */
    getTotalSize(rootHash: string): number {
        const node = this.nodeStore.get(rootHash);
        if (!node) return 0;
        return node.totalSize;
    }

    /**
     * Get total chunk count from root node.
     */
    getChunkCount(rootHash: string): number {
        const node = this.nodeStore.get(rootHash);
        if (!node) return 0;
        return node.totalChunks;
    }

    /**
     * Find chunk containing a specific byte offset.
     * Returns the chunk ref and relative offset within the chunk.
     */
    findChunkAtOffset(rootHash: string, targetOffset: number): { chunk: ChunkRef; relativeOffset: number } | null {
        const node = this.nodeStore.get(rootHash);
        if (!node) return null;

        let currentOffset = 0;

        for (const child of node.children) {
            if (child.type === "chunk") {
                if (currentOffset + child.size > targetOffset) {
                    return {
                        chunk: child,
                        relativeOffset: targetOffset - currentOffset,
                    };
                }
                currentOffset += child.size;
            } else {
                if (currentOffset + child.size > targetOffset) {
                    return this.findChunkAtOffset(child.hash, targetOffset - currentOffset);
                }
                currentOffset += child.size;
            }
        }

        return null;
    }
}
