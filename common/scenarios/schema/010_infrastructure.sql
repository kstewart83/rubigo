-- ============================================================================
-- 010_infrastructure.sql - IT Infrastructure schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS infrastructure_types (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    name TEXT NOT NULL,
    description TEXT,
    PRIMARY KEY (id, profile_id)
);

CREATE TABLE IF NOT EXISTS infrastructure (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    space TEXT,
    capacity INTEGER,
    assigned_to TEXT,
    PRIMARY KEY (id, profile_id)
);

CREATE TABLE IF NOT EXISTS components (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    placement_type TEXT,
    rack_id TEXT,
    desk_id TEXT,
    u_position INTEGER,
    status TEXT DEFAULT 'active',
    PRIMARY KEY (id, profile_id)
);

CREATE TABLE IF NOT EXISTS assets (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    name TEXT NOT NULL,
    category TEXT,
    manufacturer TEXT,
    model TEXT,
    serial_number TEXT,
    mac_address TEXT,
    status TEXT DEFAULT 'active',
    rack TEXT,
    position_u INTEGER,
    height_u INTEGER,
    space TEXT,
    storage_location TEXT,
    notes TEXT,
    PRIMARY KEY (id, profile_id)
);

CREATE TABLE IF NOT EXISTS component_connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    from_component_id TEXT NOT NULL,
    to_component_id TEXT NOT NULL,
    UNIQUE(profile_id, from_component_id, to_component_id)
);

CREATE INDEX IF NOT EXISTS idx_infrastructure_profile ON infrastructure(profile_id);
CREATE INDEX IF NOT EXISTS idx_components_profile ON components(profile_id);
CREATE INDEX IF NOT EXISTS idx_assets_profile ON assets(profile_id);
CREATE INDEX IF NOT EXISTS idx_component_connections_profile ON component_connections(profile_id);
