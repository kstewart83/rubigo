-- ============================================================================
-- 003_solution_space.sql - Solutions, Products, Services schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS solutions (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    PRIMARY KEY (id, profile_id)
);

CREATE TABLE IF NOT EXISTS products (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    solution_id TEXT,
    version TEXT,
    PRIMARY KEY (id, profile_id)
);

CREATE TABLE IF NOT EXISTS services (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    name TEXT NOT NULL,
    solution_id TEXT,
    service_level TEXT,
    PRIMARY KEY (id, profile_id)
);

CREATE TABLE IF NOT EXISTS releases (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    product_id TEXT,
    version TEXT NOT NULL,
    release_date TEXT,
    notes TEXT,
    PRIMARY KEY (id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_solutions_profile ON solutions(profile_id);
CREATE INDEX IF NOT EXISTS idx_products_profile ON products(profile_id);
CREATE INDEX IF NOT EXISTS idx_services_profile ON services(profile_id);
