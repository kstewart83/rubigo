-- ============================================================================
-- 009_access_control.sql - Access Control Objects and Subject Control Objects
-- ============================================================================
-- Source: access-control.toml

CREATE TABLE IF NOT EXISTS classification_guides (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    sensitivity_levels TEXT,  -- JSON array of valid levels
    compartments TEXT         -- JSON array of valid compartments
);

-- Access control is embedded in entities via ACO/SCO JSON columns
-- This file defines any standalone access control configuration tables

-- ============================================================================
-- Default Classification Guide
-- ============================================================================

INSERT INTO classification_guides (id, name, description, sensitivity_levels, compartments) VALUES
('guide-mmc', 'MMC Classification Guide', 'Default classification guide for Midwest Manufacturing Co.', 
 '["unrestricted", "low", "medium", "high", "critical"]',
 '["hr", "finance", "engineering", "executive", "legal"]');

-- NOTE: ACO (Access Control Object) and SCO (Subject Control Object) are stored
-- as JSON fields on individual entities. This table provides the reference guide
-- for valid sensitivity levels and compartments.
