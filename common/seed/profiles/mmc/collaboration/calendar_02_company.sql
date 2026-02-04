-- ============================================================================
-- MMC Calendar Events - Company-Wide Events
-- ============================================================================
-- Events that apply to the entire company, not department-specific
-- Timezone: America/Chicago (Central)
-- ============================================================================

-- ============================================================================
-- COMPANY-WIDE RECURRING
-- ============================================================================

-- MMC All-Hands Monthly (1st Wednesday of each month)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_until, organizer_email, location, virtual_url, timezone, aco, description_aco) VALUES
('mmc', 'co-001', 'MMC All-Hands Meeting', 
'Monthly company-wide meeting with updates from leadership.

**Agenda:**
- CEO update and company news
- Department highlights
- Q&A session

All employees are expected to attend. Remote participation available via video link.',
'2025-01-08T14:00:00', '2025-01-08T15:00:00', 0, 'all-hands', 'monthly', 1, NULL, 'tanderson@mmc.com', 'Main Cafeteria', 'https://meet.mmc.com/all-hands', 'America/Chicago', '{"sensitivity":"low"}', '{"sensitivity":"low"}');

-- ============================================================================
-- COMPANY-WIDE TRAINING
-- ============================================================================

-- Cybersecurity Training (Annual - February)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, virtual_url, timezone, aco, description_aco) VALUES
('mmc', 'train-001', 'Cybersecurity Awareness Training',
'Annual mandatory cybersecurity training for all employees.

**Topics covered:**
- Phishing awareness
- Password security
- Data handling best practices
- Incident reporting

Completion required by end of Q1.',
'2025-02-15T13:00:00', '2025-02-15T15:00:00', 0, 'training', 'mchen@mmc.com', NULL, 'https://training.mmc.com/security-2025', 'America/Chicago', '{"sensitivity":"low"}', '{"sensitivity":"low"}');

-- ============================================================================
-- CROSS-DEPARTMENTAL RECURRING
-- ============================================================================

-- Engineering/IT Sync (Monthly)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_until, organizer_email, location, timezone, aco, description_aco) VALUES
('mmc', 'xdept-001', 'Engineering / IT Sync',
'Monthly coordination meeting between Engineering and IT.

**Topics:**
- Development environment needs
- Tool requests and licensing
- Infrastructure requirements
- Security compliance',
'2025-01-15T11:00:00', '2025-01-15T12:00:00', 0, 'meeting', 'monthly', 1, NULL, 'dpark@mmc.com', 'IT Help Desk', 'America/Chicago', '{"sensitivity":"low"}', '{"sensitivity":"low"}');

-- ============================================================================
-- COMPANY-WIDE PARTICIPANTS
-- ============================================================================

-- All-Hands - use Executive Leadership team as organizer
INSERT INTO calendar_participants (profile_id, id, event_title, team_name, role, added_at) VALUES
('mmc', 'part-co-001', 'MMC All-Hands Meeting', 'Executive Leadership', 'organizer', '2025-01-01T00:00:00Z');

-- Cybersecurity Training - IT organizes
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-train-001', 'Cybersecurity Awareness Training', 'mchen@mmc.com', 'organizer', '2025-01-01T00:00:00Z');

-- Engineering / IT Sync
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-xd-001a', 'Engineering / IT Sync', 'dpark@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-xd-001b', 'Engineering / IT Sync', 'mchen@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-xd-001c', 'Engineering / IT Sync', 'jadams@mmc.com', 'optional', '2025-01-01T00:00:00Z');
