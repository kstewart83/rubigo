-- ============================================================================
-- 006_work.sql - Activities, Roles, Assignments, Allocations
-- ============================================================================
-- Source: projects.toml (work management entities)

CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    parent_id TEXT REFERENCES activities(id),
    initiative_id TEXT REFERENCES initiatives(id),
    status TEXT DEFAULT 'planned' CHECK(status IN ('planned', 'active', 'complete', 'cancelled', 'blocked'))
);

CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    activity_id TEXT NOT NULL REFERENCES activities(id),
    role_id TEXT NOT NULL REFERENCES roles(id),
    quantity INTEGER DEFAULT 1,
    unit TEXT DEFAULT 'fte',
    raci_type TEXT CHECK(raci_type IN ('responsible', 'accountable', 'consulted', 'informed'))
);

CREATE TABLE IF NOT EXISTS allocations (
    id TEXT PRIMARY KEY,
    assignment_id TEXT NOT NULL REFERENCES assignments(id),
    person_id TEXT NOT NULL REFERENCES personnel(id),
    quantity_contributed REAL,
    start_date TEXT,
    end_date TEXT
);

-- ============================================================================
-- Roles
-- ============================================================================

INSERT INTO roles (id, name, description) VALUES
('role-proj-mgr', 'Project Manager', 'Oversees project planning, execution, and delivery');

INSERT INTO roles (id, name, description) VALUES
('role-dev', 'Developer', 'Designs and implements software solutions');

INSERT INTO roles (id, name, description) VALUES
('role-qa', 'Quality Assurance', 'Tests and validates software quality');

INSERT INTO roles (id, name, description) VALUES
('role-analyst', 'Business Analyst', 'Gathers requirements and defines specifications');

-- NOTE: Activities, assignments, and allocations would be populated from projects.toml
-- This schema is ready for full data migration
