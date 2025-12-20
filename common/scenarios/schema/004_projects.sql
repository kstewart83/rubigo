-- ============================================================================
-- 004_projects.sql - Projects and Requirements schema
-- ============================================================================

-- Strategic Structure
CREATE TABLE IF NOT EXISTS projects (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    name TEXT NOT NULL,
    description TEXT,
    solution_id TEXT,
    status TEXT DEFAULT 'planning',
    start_date TEXT,
    end_date TEXT,
    PRIMARY KEY (id, profile_id)
);

CREATE TABLE IF NOT EXISTS objectives (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    title TEXT NOT NULL,
    description TEXT,
    project_id TEXT,
    parent_id TEXT,
    status TEXT DEFAULT 'draft',
    PRIMARY KEY (id, profile_id)
);

CREATE TABLE IF NOT EXISTS metrics (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    name TEXT NOT NULL,
    description TEXT,
    unit TEXT,
    current_value REAL,
    PRIMARY KEY (id, profile_id)
);

CREATE TABLE IF NOT EXISTS kpis (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    metric_id TEXT NOT NULL,
    objective_id TEXT,
    target_value REAL,
    direction TEXT,
    threshold_warning REAL,
    threshold_critical REAL,
    PRIMARY KEY (id, profile_id)
);

CREATE TABLE IF NOT EXISTS initiatives (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    name TEXT NOT NULL,
    description TEXT,
    kpi_id TEXT,
    status TEXT DEFAULT 'planned',
    start_date TEXT,
    end_date TEXT,
    PRIMARY KEY (id, profile_id)
);

-- Requirements
CREATE TABLE IF NOT EXISTS features (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    name TEXT NOT NULL,
    description TEXT,
    objective_id TEXT,
    status TEXT DEFAULT 'planned',
    PRIMARY KEY (id, profile_id)
);

CREATE TABLE IF NOT EXISTS rules (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    feature_id TEXT NOT NULL,
    role TEXT NOT NULL,
    requirement TEXT NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'draft',
    PRIMARY KEY (id, profile_id)
);

CREATE TABLE IF NOT EXISTS scenarios (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    rule_id TEXT NOT NULL,
    name TEXT NOT NULL,
    narrative TEXT,
    status TEXT DEFAULT 'draft',
    PRIMARY KEY (id, profile_id)
);

CREATE TABLE IF NOT EXISTS specifications (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    feature_id TEXT NOT NULL,
    name TEXT NOT NULL,
    narrative TEXT,
    category TEXT,
    status TEXT DEFAULT 'draft',
    PRIMARY KEY (id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_projects_profile ON projects(profile_id);
CREATE INDEX IF NOT EXISTS idx_objectives_profile ON objectives(profile_id);
CREATE INDEX IF NOT EXISTS idx_features_profile ON features(profile_id);
CREATE INDEX IF NOT EXISTS idx_rules_profile ON rules(profile_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_profile ON scenarios(profile_id);
