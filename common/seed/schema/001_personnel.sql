-- ============================================================================
-- 001_personnel.sql - Personnel schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS personnel (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    title TEXT,
    department TEXT,
    site TEXT,
    building TEXT,
    level INTEGER,
    space TEXT,
    manager TEXT,
    photo TEXT,
    desk_phone TEXT,
    cell_phone TEXT,
    bio TEXT,
    is_agent INTEGER DEFAULT 0,
    -- Security/ABAC fields
    clearance_level TEXT DEFAULT 'low',
    tenant_clearances TEXT DEFAULT '[]',
    access_roles TEXT DEFAULT '[]',
    PRIMARY KEY (id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_personnel_profile ON personnel(profile_id);
CREATE INDEX IF NOT EXISTS idx_personnel_email ON personnel(email);
