-- ============================================================================
-- MMC Calendar Events - Engineering Department
-- ============================================================================
-- Engineering recurring meetings, one-off events, and participants
-- Timezone: America/Chicago (Central)
-- ============================================================================

-- ============================================================================
-- ENGINEERING DEPARTMENT EVENTS
-- ============================================================================

-- Daily Standup (M-F at 9:00am, 15 min)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, location, timezone, aco, description_aco) VALUES
('mmc', 'eng-001', 'Engineering Daily Standup',
'Daily sync for the engineering team.

**Format:**
- What did you work on yesterday?
- What are you working on today?
- Any blockers?

Keep updates brief - 2 minutes per person max. Detailed discussions should be taken offline.',
'2025-01-06T09:00:00', '2025-01-06T09:15:00', 0, 'standup', 'weekly', 1, '["Mon","Tue","Wed","Thu","Fri"]', NULL, 'dpark@mmc.com', 'Engineering Open Plan', 'America/Chicago', '{"sensitivity":"low"}', '{"sensitivity":"low"}');

-- Sprint Planning (Biweekly Monday, 2hr)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, location, timezone, aco, description_aco) VALUES
('mmc', 'eng-002', 'Sprint Planning',
'Biweekly sprint planning session.

**Agenda:**
1. Review backlog priorities
2. Estimate stories for upcoming sprint
3. Commit to sprint goals
4. Identify dependencies and risks

Come prepared with your capacity for the sprint.',
'2025-01-06T10:00:00', '2025-01-06T12:00:00', 0, 'planning', 'weekly', 2, '["Mon"]', NULL, 'dpark@mmc.com', 'Conference Room 2A', 'America/Chicago', '{"sensitivity":"low"}', '{"sensitivity":"low"}');

-- Sprint Retrospective (Biweekly Friday, 1hr)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, location, timezone, aco, description_aco) VALUES
('mmc', 'eng-003', 'Sprint Retrospective',
'Reflect on the completed sprint.

**Format:**
- What went well?
- What could be improved?
- Action items for next sprint

This is a safe space for honest feedback. What''s said in retro stays in retro.',
'2025-01-17T15:00:00', '2025-01-17T16:00:00', 0, 'review', 'weekly', 2, '["Fri"]', NULL, 'dpark@mmc.com', 'Conference Room 2A', 'America/Chicago', '{"sensitivity":"low"}', '{"sensitivity":"low"}');

-- Engineering All-Hands (2nd Thursday monthly)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_until, organizer_email, location, timezone, aco, description_aco) VALUES
('mmc', 'eng-004', 'Engineering All-Hands',
'Monthly Engineering department meeting.

**Agenda:**
- Team updates and wins
- Technical deep dives
- Process improvements
- Open discussion

Lunch will be provided.',
'2025-01-09T12:00:00', '2025-01-09T13:00:00', 0, 'meeting', 'monthly', 1, NULL, 'dpark@mmc.com', 'CAD Lab', 'America/Chicago', '{"sensitivity":"low"}', '{"sensitivity":"low"}');

-- ============================================================================
-- MANAGER 1:1s (David Park)
-- ============================================================================

-- David / Jennifer 1:1 (Weekly Tuesday 10am)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, timezone, aco, description_aco) VALUES
('mmc', 'eng-101', 'David / Jennifer 1:1',
'Weekly one-on-one with Jennifer Adams (Senior Mechanical Engineer).

Standing agenda:
- Project status
- Career development
- Any concerns or blockers',
'2025-01-07T10:00:00', '2025-01-07T10:30:00', 0, '1:1', 'weekly', 1, '["Tue"]', NULL, 'dpark@mmc.com', 'America/Chicago', '{"sensitivity":"low"}', '{"sensitivity":"low"}');

-- David / Michael Torres 1:1 (Weekly Tuesday 11am)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, timezone, aco, description_aco) VALUES
('mmc', 'eng-102', 'David / Michael 1:1',
'Weekly one-on-one with Michael Torres (Senior Engineer).

Standing agenda:
- Project status
- Career development
- Any concerns or blockers',
'2025-01-07T11:00:00', '2025-01-07T11:30:00', 0, '1:1', 'weekly', 1, '["Tue"]', NULL, 'dpark@mmc.com', 'America/Chicago', '{"sensitivity":"low"}', '{"sensitivity":"low"}');

-- David / Kevin Zhang 1:1 (Weekly Wednesday 10am) - R&D sensitive
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, timezone, aco, description_aco) VALUES
('mmc', 'eng-103', 'David / Kevin 1:1',
'Weekly one-on-one with Kevin Zhang (R&D Engineer).

Topics often include Project Phoenix and other R&D initiatives.',
'2025-01-08T10:00:00', '2025-01-08T10:30:00', 0, '1:1', 'weekly', 1, '["Wed"]', NULL, 'dpark@mmc.com', 'America/Chicago', '{"sensitivity":"low"}', '{"sensitivity":"moderate","compartments":["🍎"]}');

-- David / Lisa Chen 1:1 (Biweekly Thursday 2pm)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, timezone, aco, description_aco) VALUES
('mmc', 'eng-104', 'David / Lisa 1:1',
'Biweekly one-on-one with Lisa Chen (CAD Designer).

Standing agenda:
- Project status
- Career development
- Any concerns or blockers',
'2025-01-09T14:00:00', '2025-01-09T14:30:00', 0, '1:1', 'weekly', 2, '["Thu"]', NULL, 'dpark@mmc.com', 'America/Chicago', '{"sensitivity":"low"}', '{"sensitivity":"low"}');

-- David / Robert Thompson 1:1 (Biweekly Friday 11am)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, timezone, aco, description_aco) VALUES
('mmc', 'eng-106', 'David / Robert 1:1',
'Biweekly one-on-one with Robert Thompson (Mechanical Engineer).

Standing agenda:
- Project status and workload
- Technical challenges
- Professional development',
'2025-01-10T11:00:00', '2025-01-10T11:30:00', 0, '1:1', 'weekly', 2, '["Fri"]', NULL, 'dpark@mmc.com', 'America/Chicago', '{"sensitivity":"low"}', '{"sensitivity":"low"}');

-- Skip-level: David / Richard 1:1 (Biweekly Friday 10am)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, timezone, aco, description_aco) VALUES
('mmc', 'eng-105', 'David / Richard 1:1',
'Biweekly skip-level with Richard Nakamura (CTO).

Discussion topics:
- Engineering team health
- Strategic initiatives
- Resource needs',
'2025-01-10T10:00:00', '2025-01-10T10:30:00', 0, '1:1', 'weekly', 2, '["Fri"]', NULL, 'rnakamura@mmc.com', 'America/Chicago', '{"sensitivity":"low"}', '{"sensitivity":"low"}');

-- ============================================================================
-- CALENDAR PARTICIPANTS
-- ============================================================================
-- Roles: organizer, required, optional

-- Company All-Hands - Everyone attends (represented by team)
INSERT INTO calendar_participants (profile_id, id, event_title, team_name, role, added_at) VALUES
('mmc', 'part-co-001', 'MMC All-Hands Meeting', 'Executive Leadership', 'organizer', '2025-01-01T00:00:00Z');

-- Engineering Daily Standup - Use team instead of listing every individual
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-eng-001a', 'Engineering Daily Standup', 'dpark@mmc.com', 'organizer', '2025-01-01T00:00:00Z');
INSERT INTO calendar_participants (profile_id, id, event_title, team_name, role, added_at) VALUES
('mmc', 'part-eng-001b', 'Engineering Daily Standup', 'Engineering', 'required', '2025-01-01T00:00:00Z');

-- Sprint Planning - Use team instead of listing individuals
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-eng-002a', 'Sprint Planning', 'dpark@mmc.com', 'organizer', '2025-01-01T00:00:00Z');
INSERT INTO calendar_participants (profile_id, id, event_title, team_name, role, added_at) VALUES
('mmc', 'part-eng-002b', 'Sprint Planning', 'Engineering', 'required', '2025-01-01T00:00:00Z');

-- Sprint Retrospective - Use team instead of listing individuals
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-eng-003a', 'Sprint Retrospective', 'dpark@mmc.com', 'organizer', '2025-01-01T00:00:00Z');
INSERT INTO calendar_participants (profile_id, id, event_title, team_name, role, added_at) VALUES
('mmc', 'part-eng-003b', 'Sprint Retrospective', 'Engineering', 'required', '2025-01-01T00:00:00Z');

-- Engineering All-Hands - entire engineering team
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-eng-004a', 'Engineering All-Hands', 'dpark@mmc.com', 'organizer', '2025-01-01T00:00:00Z');
INSERT INTO calendar_participants (profile_id, id, event_title, team_name, role, added_at) VALUES
('mmc', 'part-eng-004b', 'Engineering All-Hands', 'Engineering', 'required', '2025-01-01T00:00:00Z');

-- Cybersecurity Awareness Training - IT team + all
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-cyber-001a', 'Cybersecurity Awareness Training', 'mchen@mmc.com', 'organizer', '2025-01-01T00:00:00Z');
INSERT INTO calendar_participants (profile_id, id, event_title, team_name, role, added_at) VALUES
('mmc', 'part-cyber-001b', 'Cybersecurity Awareness Training', 'IT', 'required', '2025-01-01T00:00:00Z');

-- Code Review Session - engineering team
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-eng-cr-001a', 'Code Review Session', 'mtorres@mmc.com', 'organizer', '2025-01-01T00:00:00Z');
INSERT INTO calendar_participants (profile_id, id, event_title, team_name, role, added_at) VALUES
('mmc', 'part-eng-cr-001b', 'Code Review Session', 'Engineering', 'optional', '2025-01-01T00:00:00Z');

-- David / Jennifer 1:1
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-eng-101a', 'David / Jennifer 1:1', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-eng-101b', 'David / Jennifer 1:1', 'jadams@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- David / Michael 1:1
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-eng-102a', 'David / Michael 1:1', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-eng-102b', 'David / Michael 1:1', 'mtorres@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- David / Kevin 1:1
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-eng-103a', 'David / Kevin 1:1', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-eng-103b', 'David / Kevin 1:1', 'kzhang@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- David / Lisa 1:1
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-eng-104a', 'David / Lisa 1:1', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-eng-104b', 'David / Lisa 1:1', 'lchen@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- David / Robert 1:1
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-eng-106a', 'David / Robert 1:1', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-eng-106b', 'David / Robert 1:1', 'rthompson@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- David / Richard (Skip-level)
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-eng-105a', 'David / Richard 1:1', 'rnakamura@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-eng-105b', 'David / Richard 1:1', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Engineering / IT Sync
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-xd-001a', 'Engineering / IT Sync', 'dpark@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-xd-001b', 'Engineering / IT Sync', 'mchen@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-xd-001c', 'Engineering / IT Sync', 'jadams@mmc.com', 'optional', '2025-01-01T00:00:00Z');

-- Project Phoenix Sync
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-phx-001a', 'Project Phoenix Sync', 'tbrown@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-phx-001b', 'Project Phoenix Sync', 'kzhang@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-phx-001c', 'Project Phoenix Sync', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Performance Review - Lisa Chen
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-perf-001a', 'Performance Review - Lisa Chen', 'dpark@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-perf-001b', 'Performance Review - Lisa Chen', 'lchen@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- ============================================================================
-- ONE-OFF EVENT PARTICIPANTS
-- ============================================================================

-- Q1 Goals Setting - Engineering (David organizing team planning)
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-q1goals-a', 'Q1 Goals Setting - Engineering', 'dpark@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-q1goals-b', 'Q1 Goals Setting - Engineering', 'jadams@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-q1goals-c', 'Q1 Goals Setting - Engineering', 'kzhang@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-q1goals-d', 'Q1 Goals Setting - Engineering', 'mtorres@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- CAD Software Vendor Demo
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-cadvend-a', 'CAD Software Vendor Demo', 'dpark@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-cadvend-b', 'CAD Software Vendor Demo', 'jadams@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cadvend-c', 'CAD Software Vendor Demo', 'lchen@mmc.com', 'optional', '2025-01-01T00:00:00Z');

-- Interview - Senior Engineer Candidate (panel)
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-intv-sr-a', 'Interview - Senior Engineer Candidate', 'dpark@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-intv-sr-b', 'Interview - Senior Engineer Candidate', 'jadams@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-intv-sr-c', 'Interview - Senior Engineer Candidate', 'kzhang@mmc.com', 'optional', '2025-01-01T00:00:00Z');

-- Prototype Review - HVAC Controller
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-proto-a', 'Prototype Review - HVAC Controller', 'dpark@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-proto-b', 'Prototype Review - HVAC Controller', 'mtorres@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-proto-c', 'Prototype Review - HVAC Controller', 'kzhang@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Compressor Design Review
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-comprev-a', 'Compressor Design Review', 'jadams@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-comprev-b', 'Compressor Design Review', 'mtorres@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-comprev-c', 'Compressor Design Review', 'dpark@mmc.com', 'optional', '2025-01-01T00:00:00Z');

-- Budget Review with Finance
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-budget-a', 'Budget Review with Finance', 'dpark@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-budget-b', 'Budget Review with Finance', 'awhite@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Product Design Workshop
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-pdw-a', 'Product Design Workshop', 'dpark@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-pdw-b', 'Product Design Workshop', 'jadams@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-pdw-c', 'Product Design Workshop', 'kzhang@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-pdw-d', 'Product Design Workshop', 'lchen@mmc.com', 'optional', '2025-01-01T00:00:00Z');

-- Safety Training - Annual Refresher (manufacturing team)
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-safety-ann-a', 'Safety Training - Annual Refresher', 'mtorres@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-safety-ann-b', 'Safety Training - Annual Refresher', 'jadams@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-safety-ann-c', 'Safety Training - Annual Refresher', 'kzhang@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-safety-ann-d', 'Safety Training - Annual Refresher', 'joconnell@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Sales Engineering Sync - Customer Demo Prep
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-salesdemo-a', 'Sales Engineering Sync - Customer Demo Prep', 'dpark@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-salesdemo-b', 'Sales Engineering Sync - Customer Demo Prep', 'kzhang@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-salesdemo-c', 'Sales Engineering Sync - Customer Demo Prep', 'jadams@mmc.com', 'optional', '2025-01-01T00:00:00Z');

-- Interview - CAD Designer
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-intv-cad-a', 'Interview - CAD Designer', 'dpark@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-intv-cad-b', 'Interview - CAD Designer', 'lchen@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- CAD Training - New Features
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-cadtrain-a', 'CAD Training - New Features', 'jadams@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-cadtrain-b', 'CAD Training - New Features', 'lchen@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cadtrain-c', 'CAD Training - New Features', 'joconnell@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Team Building - Escape Room
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-escape-a', 'Team Building - Escape Room', 'dpark@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-escape-b', 'Team Building - Escape Room', 'jadams@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-escape-c', 'Team Building - Escape Room', 'mtorres@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-escape-d', 'Team Building - Escape Room', 'kzhang@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-escape-e', 'Team Building - Escape Room', 'lchen@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Quarterly Review with CTO
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-ctoreview-a', 'Quarterly Review with CTO', 'dpark@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ctoreview-b', 'Quarterly Review with CTO', 'tbrown@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- New Hire Onboarding - Engineering
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-onboard-a', 'New Hire Onboarding - Engineering', 'dpark@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-onboard-b', 'New Hire Onboarding - Engineering', 'jadams@mmc.com', 'optional', '2025-01-01T00:00:00Z');

-- Emergency Standup - Production Issue
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-emerg-a', 'Emergency Standup - Production Issue', 'dpark@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-emerg-b', 'Emergency Standup - Production Issue', 'mtorres@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-emerg-c', 'Emergency Standup - Production Issue', 'kzhang@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Year-End Planning - 2026 Roadmap
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-roadmap-a', 'Year-End Planning - 2026 Roadmap', 'dpark@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-roadmap-b', 'Year-End Planning - 2026 Roadmap', 'jadams@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-roadmap-c', 'Year-End Planning - 2026 Roadmap', 'kzhang@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-roadmap-d', 'Year-End Planning - 2026 Roadmap', 'tbrown@mmc.com', 'optional', '2025-01-01T00:00:00Z');

-- Patent Review Meeting
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-patent-a', 'Patent Review Meeting', 'dpark@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-patent-b', 'Patent Review Meeting', 'kzhang@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Holiday Party Planning
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-holiday-a', 'Holiday Party Planning', 'dpark@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-holiday-b', 'Holiday Party Planning', 'jadams@mmc.com', 'optional', '2025-01-01T00:00:00Z');

-- Year-End Engineering Review
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-yerev-a', 'Year-End Engineering Review', 'dpark@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-yerev-b', 'Year-End Engineering Review', 'jadams@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-yerev-c', 'Year-End Engineering Review', 'kzhang@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-yerev-d', 'Year-End Engineering Review', 'mtorres@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Team Lunch - Holiday Celebration
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-tlunch-a', 'Team Lunch - Holiday Celebration', 'dpark@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-tlunch-b', 'Team Lunch - Holiday Celebration', 'jadams@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-tlunch-c', 'Team Lunch - Holiday Celebration', 'kzhang@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-tlunch-d', 'Team Lunch - Holiday Celebration', 'mtorres@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-tlunch-e', 'Team Lunch - Holiday Celebration', 'lchen@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Q1 2026 Kickoff - Engineering  
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-q1kick-a', 'Q1 2026 Kickoff - Engineering', 'dpark@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-q1kick-b', 'Q1 2026 Kickoff - Engineering', 'jadams@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-q1kick-c', 'Q1 2026 Kickoff - Engineering', 'kzhang@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-q1kick-d', 'Q1 2026 Kickoff - Engineering', 'mtorres@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-q1kick-e', 'Q1 2026 Kickoff - Engineering', 'lchen@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Project Phoenix Status Review
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-phxstat-a', 'Project Phoenix Status Review', 'dpark@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-phxstat-b', 'Project Phoenix Status Review', 'kzhang@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-phxstat-c', 'Project Phoenix Status Review', 'tbrown@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Interview - Electrical Engineer
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-intv-elec-a', 'Interview - Electrical Engineer', 'dpark@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-intv-elec-b', 'Interview - Electrical Engineer', 'psharma@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Safety Training - New Equipment
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-safety-new-a', 'Safety Training - New Equipment', 'jadams@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-safety-new-b', 'Safety Training - New Equipment', 'mtorres@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-safety-new-c', 'Safety Training - New Equipment', 'kzhang@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-safety-new-d', 'Safety Training - New Equipment', 'joconnell@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-safety-new-e', 'Safety Training - New Equipment', 'dpark@mmc.com', 'optional', '2025-01-01T00:00:00Z');

-- Budget Planning - Q1
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-budq1-a', 'Budget Planning - Q1', 'dpark@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-budq1-b', 'Budget Planning - Q1', 'awhite@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Vendor Demo - 3D Printer
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-3dprint-a', 'Vendor Demo - 3D Printer', 'kzhang@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-3dprint-b', 'Vendor Demo - 3D Printer', 'jadams@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-3dprint-c', 'Vendor Demo - 3D Printer', 'lchen@mmc.com', 'optional', '2025-01-01T00:00:00Z');

-- Code Review - Controller Firmware
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-codereview-a', 'Code Review - Controller Firmware', 'mtorres@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-codereview-b', 'Code Review - Controller Firmware', 'psharma@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-codereview-c', 'Code Review - Controller Firmware', 'kzhang@mmc.com', 'optional', '2025-01-01T00:00:00Z');

-- Engineering/Sales Sync - Demo Prep
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-engsales-a', 'Engineering/Sales Sync - Demo Prep', 'dpark@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-engsales-b', 'Engineering/Sales Sync - Demo Prep', 'jadams@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Q1 Goals Review
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-q1rev-a', 'Q1 Goals Review', 'dpark@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-q1rev-b', 'Q1 Goals Review', 'jadams@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-q1rev-c', 'Q1 Goals Review', 'kzhang@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-q1rev-d', 'Q1 Goals Review', 'mtorres@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Customer Visit - Acme Industries
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-acme-a', 'Customer Visit - Acme Industries', 'dpark@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-acme-b', 'Customer Visit - Acme Industries', 'jadams@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-acme-c', 'Customer Visit - Acme Industries', 'kzhang@mmc.com', 'optional', '2025-01-01T00:00:00Z');

-- ============================================================================
-- ORGANIZER AS REQUIRED PARTICIPANT
-- ============================================================================
-- The organizer role indicates ownership. For attendance, we also need
-- the organizer listed as required participant.

INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
-- Engineering recurring events - dpark as required
('mmc', 'part-org-req-001', 'Engineering Daily Standup', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-org-req-002', 'Sprint Planning', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-org-req-003', 'Sprint Retrospective', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-org-req-004', 'Engineering All-Hands', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-org-req-005', 'Engineering / IT Sync', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Engineering standalone events
('mmc', 'part-org-req-010', 'Budget Planning - Q1', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-org-req-011', 'Budget Review with Finance', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-org-req-012', 'CAD Software Vendor Demo', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-org-req-013', 'Customer Visit - Acme Industries', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-org-req-014', 'Engineering/Sales Sync - Demo Prep', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-org-req-015', 'Holiday Party Planning', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-org-req-016', 'Interview - CAD Designer', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-org-req-017', 'Interview - Electrical Engineer', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-org-req-018', 'Interview - Senior Engineer Candidate', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-org-req-019', 'New Hire Onboarding - Engineering', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-org-req-020', 'Patent Review Meeting', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-org-req-021', 'Performance Review - Lisa Chen', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-org-req-022', 'Product Design Workshop', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-org-req-023', 'Project Phoenix Status Review', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-org-req-024', 'Prototype Review - HVAC Controller', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-org-req-025', 'Q1 2026 Kickoff - Engineering', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-org-req-026', 'Q1 Goals Review', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-org-req-027', 'Q1 Goals Setting - Engineering', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-org-req-028', 'Quarterly Review with CTO', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-org-req-029', 'Sales Engineering Sync - Customer Demo Prep', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-org-req-030', 'Team Building - Escape Room', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-org-req-031', 'Team Lunch - Holiday Celebration', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-org-req-032', 'Year-End Engineering Review', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-org-req-033', 'Year-End Planning - 2026 Roadmap', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Other engineering organizers as required
('mmc', 'part-org-req-040', 'CAD Training - New Features', 'jadams@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-org-req-041', 'Compressor Design Review', 'jadams@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-org-req-042', 'Safety Training - New Equipment', 'jadams@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-org-req-043', 'Vendor Demo - 3D Printer', 'kzhang@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-org-req-044', 'Code Review - Controller Firmware', 'mtorres@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-org-req-045', 'Code Review Session', 'mtorres@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-org-req-046', 'Safety Training - Annual Refresher', 'mtorres@mmc.com', 'required', '2025-01-01T00:00:00Z');

