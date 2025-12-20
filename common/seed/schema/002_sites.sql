-- ============================================================================
-- 002_sites.sql - Sites hierarchy schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS regions (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    name TEXT NOT NULL,
    description TEXT,
    PRIMARY KEY (id, profile_id)
);

CREATE TABLE IF NOT EXISTS sites (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    name TEXT NOT NULL,
    region_id TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    country TEXT DEFAULT 'USA',
    PRIMARY KEY (id, profile_id)
);

CREATE TABLE IF NOT EXISTS buildings (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    name TEXT NOT NULL,
    site_id TEXT,
    floors INTEGER DEFAULT 1,
    PRIMARY KEY (id, profile_id)
);

CREATE TABLE IF NOT EXISTS spaces (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    name TEXT NOT NULL,
    building_id TEXT,
    floor INTEGER,
    space_type TEXT,
    capacity INTEGER,
    PRIMARY KEY (id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_sites_profile ON sites(profile_id);
CREATE INDEX IF NOT EXISTS idx_buildings_profile ON buildings(profile_id);
CREATE INDEX IF NOT EXISTS idx_spaces_profile ON spaces(profile_id);
