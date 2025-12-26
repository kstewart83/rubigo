-- ============================================================================
-- 005_teams.sql - Teams schema for profiles.sqlite
-- ============================================================================
-- Uses email/name for business key resolution during sync

-- Teams - Ad-hoc groups of personnel
CREATE TABLE IF NOT EXISTS teams (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    name TEXT NOT NULL,
    description TEXT,
    created_by_email TEXT,  -- Business key: personnel email
    aco TEXT DEFAULT '{"sensitivity":"low"}',
    PRIMARY KEY (id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_teams_profile ON teams(profile_id);
CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(name, profile_id);

-- Team Members - Junction table for team membership
-- Uses team_name + personnel_email as business keys
CREATE TABLE IF NOT EXISTS team_members (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    team_name TEXT NOT NULL,
    personnel_email TEXT NOT NULL,
    joined_at TEXT NOT NULL,
    PRIMARY KEY (id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_name, profile_id);
CREATE INDEX IF NOT EXISTS idx_team_members_personnel ON team_members(personnel_email, profile_id);

-- Team Teams - Junction table for hierarchical team nesting
-- Uses team names as business keys
CREATE TABLE IF NOT EXISTS team_teams (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    parent_team_name TEXT NOT NULL,
    child_team_name TEXT NOT NULL,
    added_at TEXT NOT NULL,
    PRIMARY KEY (id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_team_teams_parent ON team_teams(parent_team_name, profile_id);
CREATE INDEX IF NOT EXISTS idx_team_teams_child ON team_teams(child_team_name, profile_id);

-- Team Owners - Personnel who can edit/delete a team
-- Uses team_name + personnel_email as business keys
CREATE TABLE IF NOT EXISTS team_owners (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    team_name TEXT NOT NULL,
    personnel_email TEXT NOT NULL,
    added_at TEXT NOT NULL,
    PRIMARY KEY (id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_team_owners_team ON team_owners(team_name, profile_id);
