-- ============================================================================
-- 000_init.sql - Base PRAGMA settings and profile table
-- ============================================================================

PRAGMA foreign_keys = OFF;  -- Disabled for bulk loading; validated by sync script
PRAGMA journal_mode = WAL;

-- Profile table (demo company configurations)
-- This is the parent table for all profile-specific data
CREATE TABLE IF NOT EXISTS profile (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    industry TEXT,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Index helper for profile queries
CREATE INDEX IF NOT EXISTS idx_profile_short_name ON profile(short_name);
