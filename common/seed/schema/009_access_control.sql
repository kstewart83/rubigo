-- ============================================================================
-- 009_access_control.sql - Access control schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS classification_guides (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    name TEXT NOT NULL,
    description TEXT,
    levels TEXT,  -- JSON array of sensitivity levels
    PRIMARY KEY (id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_classification_guides_profile ON classification_guides(profile_id);
