-- File Manager Content-Addressable Storage Tables (GH #26)
-- Implements Copy-on-Write B-tree structure with AE CDC chunking

-- Immutable content chunks (content-addressed by SHA-256)
CREATE TABLE IF NOT EXISTS chunks (
  hash TEXT PRIMARY KEY,              -- SHA-256 hex of chunk content
  data BLOB NOT NULL,                 -- Raw chunk bytes
  size INTEGER NOT NULL,              -- Chunk size in bytes
  ref_count INTEGER NOT NULL DEFAULT 1,  -- Reference counting for GC
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for garbage collection (find orphaned chunks)
CREATE INDEX IF NOT EXISTS idx_chunks_ref_count ON chunks(ref_count);

-- B-tree nodes for file structure (content-addressed)
CREATE TABLE IF NOT EXISTS file_nodes (
  hash TEXT PRIMARY KEY,              -- SHA-256 of serialized node
  data TEXT NOT NULL,                 -- JSON: array of child hashes and offsets
  level INTEGER NOT NULL,             -- Tree depth (0 = leaf level pointing to chunks)
  child_count INTEGER NOT NULL,       -- Number of children
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Folder hierarchy
CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  parent_id TEXT,                     -- NULL for root folder
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(profile_id, parent_id, name),
  FOREIGN KEY (owner_id) REFERENCES personnel(id)
);

CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(profile_id, parent_id);

-- File metadata
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  folder_id TEXT,                     -- NULL for root folder
  name TEXT NOT NULL,
  current_version_id TEXT,            -- Points to latest file_versions entry
  mime_type TEXT,                     -- User-provided or detected MIME type
  detected_type TEXT,                 -- From Google Magika
  type_mismatch INTEGER DEFAULT 0,    -- 1 if extension != detected type
  total_size INTEGER NOT NULL DEFAULT 0,
  owner_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME,                -- Soft delete
  UNIQUE(profile_id, folder_id, name),
  FOREIGN KEY (folder_id) REFERENCES folders(id),
  FOREIGN KEY (owner_id) REFERENCES personnel(id)
);

CREATE INDEX IF NOT EXISTS idx_files_folder ON files(profile_id, folder_id);
CREATE INDEX IF NOT EXISTS idx_files_owner ON files(owner_id);
CREATE INDEX IF NOT EXISTS idx_files_deleted ON files(deleted_at);

-- File versions (immutable snapshots)
CREATE TABLE IF NOT EXISTS file_versions (
  id TEXT PRIMARY KEY,
  file_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  root_hash TEXT NOT NULL,            -- Reference to file_nodes table (tree root)
  size INTEGER NOT NULL,              -- Total file size in bytes
  chunk_count INTEGER NOT NULL,       -- Total number of chunks
  checksum TEXT NOT NULL,             -- SHA-256 of entire file content
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (file_id) REFERENCES files(id),
  FOREIGN KEY (root_hash) REFERENCES file_nodes(hash),
  FOREIGN KEY (created_by) REFERENCES personnel(id)
);

CREATE INDEX IF NOT EXISTS idx_file_versions_file ON file_versions(file_id, version_number);
CREATE INDEX IF NOT EXISTS idx_file_versions_root ON file_versions(root_hash);

-- Share links with optional expiration
CREATE TABLE IF NOT EXISTS file_shares (
  id TEXT PRIMARY KEY,
  file_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,         -- URL-safe share token
  expires_at DATETIME,                -- NULL for no expiration
  access_count INTEGER DEFAULT 0,     -- Track usage
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (file_id) REFERENCES files(id),
  FOREIGN KEY (created_by) REFERENCES personnel(id)
);

CREATE INDEX IF NOT EXISTS idx_file_shares_token ON file_shares(token);
CREATE INDEX IF NOT EXISTS idx_file_shares_file ON file_shares(file_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_expires ON file_shares(expires_at);

-- Upload sessions for chunked uploads
CREATE TABLE IF NOT EXISTS upload_sessions (
  id TEXT PRIMARY KEY,
  file_id TEXT,                       -- NULL until first chunk processed
  folder_id TEXT,
  filename TEXT NOT NULL,
  total_size INTEGER NOT NULL,
  uploaded_size INTEGER DEFAULT 0,
  chunk_hashes TEXT,                  -- JSON array of chunk hashes in order
  status TEXT DEFAULT 'pending',      -- 'pending' | 'uploading' | 'processing' | 'complete' | 'failed'
  owner_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,       -- Auto-cleanup incomplete uploads
  FOREIGN KEY (folder_id) REFERENCES folders(id),
  FOREIGN KEY (owner_id) REFERENCES personnel(id)
);

CREATE INDEX IF NOT EXISTS idx_upload_sessions_status ON upload_sessions(status);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_expires ON upload_sessions(expires_at);
