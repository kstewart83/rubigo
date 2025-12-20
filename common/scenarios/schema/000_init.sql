-- ============================================================================
-- 000_init.sql - Base PRAGMA settings and scenario metadata
-- ============================================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- Scenario metadata table
CREATE TABLE IF NOT EXISTS scenario (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    industry TEXT,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);
