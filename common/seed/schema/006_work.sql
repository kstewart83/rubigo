-- ============================================================================
-- 006_work.sql - Work management schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS activities (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    name TEXT NOT NULL,
    description TEXT,
    initiative_id TEXT,
    status TEXT DEFAULT 'planned',
    start_date TEXT,
    end_date TEXT,
    PRIMARY KEY (id, profile_id)
);

CREATE TABLE IF NOT EXISTS roles (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    name TEXT NOT NULL,
    description TEXT,
    PRIMARY KEY (id, profile_id)
);

CREATE TABLE IF NOT EXISTS assignments (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    activity_id TEXT NOT NULL,
    person_id TEXT NOT NULL,
    role_id TEXT,
    PRIMARY KEY (id, profile_id)
);

CREATE TABLE IF NOT EXISTS allocations (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    assignment_id TEXT NOT NULL,
    hours REAL,
    period TEXT,
    PRIMARY KEY (id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_roles_profile ON roles(profile_id);
CREATE INDEX IF NOT EXISTS idx_activities_profile ON activities(profile_id);
