-- Migration: Update classification_guides table for new structure
-- Drop and recreate since table is currently empty (unused)

DROP TABLE IF EXISTS classification_guides;

CREATE TABLE classification_guides (
    id TEXT PRIMARY KEY NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    title TEXT NOT NULL,
    guide_type TEXT NOT NULL CHECK (guide_type IN ('sensitivity', 'compartment', 'role')),
    level TEXT NOT NULL,
    content_markdown TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'superseded')),
    effective_date TEXT,
    superseded_by TEXT,
    created_at TEXT NOT NULL,
    created_by TEXT NOT NULL,
    updated_at TEXT
);

-- Create index for common queries
CREATE INDEX idx_classification_guides_type ON classification_guides(guide_type);
CREATE INDEX idx_classification_guides_type_level ON classification_guides(guide_type, level);
CREATE INDEX idx_classification_guides_status ON classification_guides(status);
