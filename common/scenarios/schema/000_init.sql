-- ============================================================================
-- 000_init.sql - Base PRAGMA settings and profile metadata
-- ============================================================================

PRAGMA foreign_keys = OFF;  -- Disabled for bulk loading; validated by sync script
PRAGMA journal_mode = WAL;

-- Profile metadata table (company/demo configuration)
-- Named "profile" to distinguish from "scenarios" table (BDD test cases)
CREATE TABLE IF NOT EXISTS profile (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    industry TEXT,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);
