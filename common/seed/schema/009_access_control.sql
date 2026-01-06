-- ============================================================================
-- 009_access_control.sql - Access control schema  
-- ============================================================================

CREATE TABLE IF NOT EXISTS classification_guides (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    title TEXT NOT NULL,
    guide_type TEXT NOT NULL CHECK (guide_type IN ('sensitivity', 'compartment', 'role')),
    level TEXT NOT NULL,
    content_markdown TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'superseded')),
    PRIMARY KEY (id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_classification_guides_profile ON classification_guides(profile_id);
CREATE INDEX IF NOT EXISTS idx_classification_guides_type ON classification_guides(profile_id, guide_type);
