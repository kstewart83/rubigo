-- ============================================================================
-- 0003_classification_guides_draft_system.sql
-- Adds draft system fields to classification_guides for collaborative editing
-- ============================================================================

-- Add draft fields to support single-owner draft workflow
ALTER TABLE classification_guides ADD COLUMN draft_title TEXT;
ALTER TABLE classification_guides ADD COLUMN draft_content TEXT;
ALTER TABLE classification_guides ADD COLUMN draft_by TEXT;
ALTER TABLE classification_guides ADD COLUMN draft_started_at TEXT;
ALTER TABLE classification_guides ADD COLUMN base_version INTEGER;
