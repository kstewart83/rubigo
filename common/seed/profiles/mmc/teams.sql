-- ============================================================================
-- Teams - MMC Organizational Teams
-- ============================================================================
-- NOTE: Uses personnel emails as business keys. Sync script resolves to IDs.

-- Core Department Teams
-- created_by references personnel by email
INSERT INTO teams (profile_id, id, name, description, created_by_email, aco) VALUES 
('mmc', 'a1b2c3', 'Executive Leadership', 'C-suite executives and senior leadership', 'tanderson@mmc.com', '{"sensitivity":"low"}'),
('mmc', 'd4e5f6', 'IT Department', 'Information Technology team', 'mchen@mmc.com', '{"sensitivity":"low"}'),
('mmc', 'g7h8i9', 'HR Department', 'Human Resources team', 'pmartinez@mmc.com', '{"sensitivity":"low"}'),
('mmc', 'j1k2l3', 'Engineering', 'Product engineering and CAD design', 'dpark@mmc.com', '{"sensitivity":"low"}'),
('mmc', 'm4n5o6', 'Finance', 'Finance and accounting team', 'msullivan@mmc.com', '{"sensitivity":"low"}'),
('mmc', 'p7q8r9', 'Sales', 'Sales and business development', 'cmiller@mmc.com', '{"sensitivity":"low"}'),
('mmc', 's1t2u3', 'Operations', 'Warehouse and logistics operations', 'tanderson@mmc.com', '{"sensitivity":"low"}'),
('mmc', 'v4w5x6', 'Manufacturing', 'Production and quality control', 'tanderson@mmc.com', '{"sensitivity":"low"}'),
('mmc', 'y7z8a9', 'Customer Service', 'Customer support team', 'tanderson@mmc.com', '{"sensitivity":"low"}');

-- Nested Teams (sub-teams)
INSERT INTO teams (profile_id, id, name, description, created_by_email, aco) VALUES 
('mmc', 'b2c3d4', 'Network Operations', 'Network infrastructure and security', 'mchen@mmc.com', '{"sensitivity":"low"}'),
('mmc', 'e5f6g7', 'Help Desk', 'IT support and helpdesk', 'mchen@mmc.com', '{"sensitivity":"low"}'),
('mmc', 'h8i9j0', 'Recruiting', 'Talent acquisition team', 'pmartinez@mmc.com', '{"sensitivity":"low"}'),
-- CROSS-FUNCTIONAL TEAMS
('mmc', 'xf001', 'Project Phoenix', 'Next-gen HVAC unit launch task force', 'tbrown@mmc.com', '{"sensitivity":"high","compartments":["🍎","🍇"]}'),
('mmc', 'xf002', 'Safety Committee', 'Plant safety and compliance oversight', 'vhugo@mmc.com', '{"sensitivity":"low"}'),
('mmc', 'xf003', 'Digital Task Force', 'ERP upgrade and digital transformation', 'mchen@mmc.com', '{"sensitivity":"low"}'),

-- MORE NESTED TEAMS
('mmc', 'nt001', 'R&D', 'Research and Development', 'dpark@mmc.com', '{"sensitivity":"low"}'),
('mmc', 'nt002', 'Prototyping', 'Rapid prototyping lab', 'dpark@mmc.com', '{"sensitivity":"moderate","compartments":["🍎"]}'),
('mmc', 'nt003', 'QA Engineering', 'Quality Assurance for Engineering', 'dpark@mmc.com', '{"sensitivity":"low"}'),
('mmc', 'nt004', 'Day Shift', 'Manufacturing Day Shift (6AM-2PM)', 'jwalsh@mmc.com', '{"sensitivity":"low"}'),
('mmc', 'nt005', 'Night Shift', 'Manufacturing Night Shift (10PM-6AM)', 'jwalsh@mmc.com', '{"sensitivity":"low"}');

-- ============================================================================
-- Team Members - Uses team name + personnel email as business keys
-- ============================================================================

INSERT INTO team_members (profile_id, id, team_name, personnel_email, joined_at) VALUES 
-- Executive Leadership
('mmc', 'tm001', 'Executive Leadership', 'tanderson@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm002', 'Executive Leadership', 'msullivan@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm003', 'Executive Leadership', 'rnakamura@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm004', 'Executive Leadership', 'dprince@mmc.com', '2024-01-01T00:00:00Z'),
-- IT Department
('mmc', 'tm010', 'IT Department', 'mchen@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm011', 'IT Department', 'skim@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm012', 'IT Department', 'jwright@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm013', 'IT Department', 'glee@mmc.com', '2024-01-01T00:00:00Z'),
-- HR Department
('mmc', 'tm020', 'HR Department', 'pmartinez@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm021', 'HR Department', 'jwilson@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm022', 'HR Department', 'hscott@mmc.com', '2024-01-01T00:00:00Z'),
-- Engineering
('mmc', 'tm030', 'Engineering', 'dpark@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm031', 'Engineering', 'jadams@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm032', 'Engineering', 'rthompson@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm033', 'Engineering', 'lchen@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm034', 'Engineering', 'mtorres@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm035', 'Engineering', 'kzhang@mmc.com', '2024-01-01T00:00:00Z'),
-- Finance
('mmc', 'tm040', 'Finance', 'erodriguez@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm041', 'Finance', 'dfoster@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm042', 'Finance', 'avance@mmc.com', '2024-01-01T00:00:00Z'),
-- Sales
('mmc', 'tm050', 'Sales', 'cmiller@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm051', 'Sales', 'ajohnson@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm052', 'Sales', 'kobrien@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm053', 'Sales', 'ntaylor@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm054', 'Sales', 'erigby@mmc.com', '2024-01-01T00:00:00Z'),
-- Network Operations (sub-team)
('mmc', 'tm060', 'Network Operations', 'skim@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm061', 'Network Operations', 'fwright@mmc.com', '2024-01-01T00:00:00Z'),
-- Help Desk (sub-team)
('mmc', 'tm070', 'Help Desk', 'jwright@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm071', 'Help Desk', 'erodriguez2@mmc.com', '2024-01-01T00:00:00Z'),
-- Operations
('mmc', 'tm080', 'Operations', 'bmitchell@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm081', 'Operations', 'lnchen@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm082', 'Operations', 'sharris@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm083', 'Operations', 'otto@mmc.com', '2024-01-01T00:00:00Z'),
-- Manufacturing
('mmc', 'tm090', 'Manufacturing', 'jwalsh@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm091', 'Manufacturing', 'crodriguez@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm092', 'Manufacturing', 'msantos@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm093', 'Manufacturing', 'dewilliams@mmc.com', '2024-01-01T00:00:00Z'),
-- Customer Service
('mmc', 'tm100', 'Customer Service', 'rgreen@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm101', 'Customer Service', 'marjohnson@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm102', 'Customer Service', 'slee@mmc.com', '2024-01-01T00:00:00Z'),
-- Recruiting (sub-team of HR)
('mmc', 'tm110', 'Recruiting', 'achen@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm111', 'Recruiting', 'ivance2@mmc.com', '2024-01-01T00:00:00Z'),
-- R&D
('mmc', 'tm120', 'R&D', 'kzhang@mmc.com', '2024-01-01T00:00:00Z'),
-- Prototyping
('mmc', 'tm130', 'Prototyping', 'kzhang@mmc.com', '2024-01-01T00:00:00Z'),
-- QA Engineering
('mmc', 'tm140', 'QA Engineering', 'rchang@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm141', 'QA Engineering', 'achen@mmc.com', '2024-01-01T00:00:00Z'),
-- Day Shift
('mmc', 'tm150', 'Day Shift', 'crodriguez@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm151', 'Day Shift', 'xrhodes@mmc.com', '2024-01-01T00:00:00Z'),
-- Night Shift
('mmc', 'tm160', 'Night Shift', 'pmiller@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm161', 'Night Shift', 'sgreen@mmc.com', '2024-01-01T00:00:00Z'),
-- Project Phoenix (Cross-Functional)
('mmc', 'tm170', 'Project Phoenix', 'tbrown@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm171', 'Project Phoenix', 'kzhang@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm172', 'Project Phoenix', 'fcastle@mmc.com', '2024-01-01T00:00:00Z'),
-- Safety Committee (Cross-Functional)
('mmc', 'tm180', 'Safety Committee', 'vhugo@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm181', 'Safety Committee', 'kdanvers@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm182', 'Safety Committee', 'lmiles@mmc.com', '2024-01-01T00:00:00Z'),
-- Digital Task Force (Cross-Functional)
('mmc', 'tm190', 'Digital Task Force', 'mchen@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm191', 'Digital Task Force', 'bross@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'tm192', 'Digital Task Force', 'oqueen@mmc.com', '2024-01-01T00:00:00Z');

-- ============================================================================
-- Team Teams - Hierarchy using team names
-- ============================================================================

INSERT INTO team_teams (profile_id, id, parent_team_name, child_team_name, added_at) VALUES 
('mmc', 'tt001', 'IT Department', 'Network Operations', '2024-01-01T00:00:00Z'),
('mmc', 'tt002', 'IT Department', 'Help Desk', '2024-01-01T00:00:00Z'),
('mmc', 'tt003', 'HR Department', 'Recruiting', '2024-01-01T00:00:00Z'),
('mmc', 'tt004', 'Engineering', 'R&D', '2024-01-01T00:00:00Z'),
('mmc', 'tt005', 'Engineering', 'QA Engineering', '2024-01-01T00:00:00Z'),
('mmc', 'tt006', 'R&D', 'Prototyping', '2024-01-01T00:00:00Z'),
('mmc', 'tt007', 'Manufacturing', 'Day Shift', '2024-01-01T00:00:00Z'),
('mmc', 'tt008', 'Manufacturing', 'Night Shift', '2024-01-01T00:00:00Z');

-- ============================================================================
-- Team Owners - Uses team name + personnel email
-- ============================================================================

INSERT INTO team_owners (profile_id, id, team_name, personnel_email, added_at) VALUES 
('mmc', 'to001', 'Executive Leadership', 'tanderson@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'to010', 'IT Department', 'mchen@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'to020', 'HR Department', 'pmartinez@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'to030', 'Engineering', 'dpark@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'to040', 'Finance', 'msullivan@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'to050', 'Sales', 'cmiller@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'to060', 'Network Operations', 'mchen@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'to070', 'Help Desk', 'mchen@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'to080', 'Recruiting', 'pmartinez@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'to090', 'Operations', 'bmitchell@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'to100', 'Manufacturing', 'jwalsh@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'to110', 'Customer Service', 'rgreen@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'to120', 'R&D', 'dpark@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'to130', 'Prototyping', 'dpark@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'to140', 'QA Engineering', 'dpark@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'to150', 'Day Shift', 'jwalsh@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'to160', 'Night Shift', 'jwalsh@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'to170', 'Project Phoenix', 'tbrown@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'to180', 'Safety Committee', 'vhugo@mmc.com', '2024-01-01T00:00:00Z'),
('mmc', 'to190', 'Digital Task Force', 'mchen@mmc.com', '2024-01-01T00:00:00Z');
