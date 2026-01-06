-- Calendar Participants - Sample Data
-- Uses business keys (event_title, personnel_email, team_name) for sync resolution

-- Engineering Daily Standup (evt-001) - Engineering team
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, team_name, role, added_at) VALUES 
('mmc', 'cp-001', 'Engineering Daily Standup', 'dpark@mmc.com', NULL, 'organizer', '2024-12-01T00:00:00Z'),
('mmc', 'cp-002', 'Engineering Daily Standup', NULL, 'Engineering', 'required', '2024-12-01T00:00:00Z');

-- IT Team Weekly (evt-002) - IT team
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, team_name, role, added_at) VALUES 
('mmc', 'cp-003', 'IT Team Weekly', 'mchen@mmc.com', NULL, 'organizer', '2024-12-01T00:00:00Z'),
('mmc', 'cp-004', 'IT Team Weekly', NULL, 'IT Department', 'required', '2024-12-01T00:00:00Z');

-- Sales Region Sync (evt-003) - Sales team
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, team_name, role, added_at) VALUES 
('mmc', 'cp-005', 'Sales Region Sync', 'cmiller@mmc.com', NULL, 'organizer', '2024-12-01T00:00:00Z'),
('mmc', 'cp-006', 'Sales Region Sync', NULL, 'Sales', 'required', '2024-12-01T00:00:00Z');

-- Executive Leadership Meeting (evt-005) - Exec team
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, team_name, role, added_at) VALUES 
('mmc', 'cp-007', 'Executive Leadership Meeting', 'tanderson@mmc.com', NULL, 'organizer', '2024-12-01T00:00:00Z'),
('mmc', 'cp-008', 'Executive Leadership Meeting', NULL, 'Executive Leadership', 'required', '2024-12-01T00:00:00Z');

-- MMC All-Hands Meeting (evt-007) - Everyone
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, team_name, role, added_at) VALUES 
('mmc', 'cp-009', 'MMC All-Hands Meeting', 'tanderson@mmc.com', NULL, 'organizer', '2024-12-01T00:00:00Z'),
('mmc', 'cp-010', 'MMC All-Hands Meeting', NULL, 'Executive Leadership', 'required', '2024-12-01T00:00:00Z'),
('mmc', 'cp-011', 'MMC All-Hands Meeting', NULL, 'Engineering', 'required', '2024-12-01T00:00:00Z'),
('mmc', 'cp-012', 'MMC All-Hands Meeting', NULL, 'IT Department', 'required', '2024-12-01T00:00:00Z'),
('mmc', 'cp-013', 'MMC All-Hands Meeting', NULL, 'HR Department', 'required', '2024-12-01T00:00:00Z'),
('mmc', 'cp-014', 'MMC All-Hands Meeting', NULL, 'Finance', 'required', '2024-12-01T00:00:00Z'),
('mmc', 'cp-015', 'MMC All-Hands Meeting', NULL, 'Sales', 'required', '2024-12-01T00:00:00Z'),
('mmc', 'cp-016', 'MMC All-Hands Meeting', NULL, 'Operations', 'required', '2024-12-01T00:00:00Z'),
('mmc', 'cp-017', 'MMC All-Hands Meeting', NULL, 'Manufacturing', 'required', '2024-12-01T00:00:00Z'),
('mmc', 'cp-018', 'MMC All-Hands Meeting', NULL, 'Customer Service', 'required', '2024-12-01T00:00:00Z');

-- Engineering Sprint Review (evt-006) - Engineering + Product stakeholders
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, team_name, role, added_at) VALUES 
('mmc', 'cp-019', 'Engineering Sprint Review', 'dpark@mmc.com', NULL, 'organizer', '2024-12-01T00:00:00Z'),
('mmc', 'cp-020', 'Engineering Sprint Review', NULL, 'Engineering', 'required', '2024-12-01T00:00:00Z'),
('mmc', 'cp-021', 'Engineering Sprint Review', 'rthompson@mmc.com', NULL, 'optional', '2024-12-01T00:00:00Z');

-- Project Phoenix kickoff (cross-functional)
-- ERP System Upgrade Kickoff (evt-027) - Digital Task Force
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, team_name, role, added_at) VALUES 
('mmc', 'cp-022', 'ERP System Upgrade Kickoff', 'mchen@mmc.com', NULL, 'organizer', '2024-12-01T00:00:00Z'),
('mmc', 'cp-023', 'ERP System Upgrade Kickoff', NULL, 'Digital Task Force', 'required', '2024-12-01T00:00:00Z');

-- Product Design Workshop (evt-014) - Engineering R&D
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, team_name, role, added_at) VALUES 
('mmc', 'cp-024', 'Product Design Workshop', 'dpark@mmc.com', NULL, 'organizer', '2024-12-01T00:00:00Z'),
('mmc', 'cp-025', 'Product Design Workshop', NULL, 'R&D', 'required', '2024-12-01T00:00:00Z'),
('mmc', 'cp-026', 'Product Design Workshop', NULL, 'Prototyping', 'required', '2024-12-01T00:00:00Z');

-- Finance Month-End Review (evt-008) - Finance team
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, team_name, role, added_at) VALUES 
('mmc', 'cp-027', 'Finance Month-End Review', 'msullivan@mmc.com', NULL, 'organizer', '2024-12-01T00:00:00Z'),
('mmc', 'cp-028', 'Finance Month-End Review', NULL, 'Finance', 'required', '2024-12-01T00:00:00Z');

-- HR Office Hours (evt-004) - HR team
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, team_name, role, added_at) VALUES 
('mmc', 'cp-029', 'HR Office Hours', 'pmartinez@mmc.com', NULL, 'organizer', '2024-12-01T00:00:00Z'),
('mmc', 'cp-030', 'HR Office Hours', NULL, 'HR Department', 'optional', '2024-12-01T00:00:00Z');

-- Safety Committee (cross-functional)
-- Cybersecurity Awareness Training (evt-013) - Safety Committee style
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, team_name, role, added_at) VALUES 
('mmc', 'cp-031', 'Cybersecurity Awareness Training', 'mchen@mmc.com', NULL, 'organizer', '2024-12-01T00:00:00Z'),
('mmc', 'cp-032', 'Cybersecurity Awareness Training', NULL, 'Safety Committee', 'required', '2024-12-01T00:00:00Z');
