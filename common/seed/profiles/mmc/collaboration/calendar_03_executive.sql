-- ============================================================================
-- MMC Calendar Events - Executive Leadership
-- ============================================================================
-- Executive recurring meetings, strategic engagements, and participants
-- Timezone: America/Chicago (Central)
-- ============================================================================

-- ============================================================================
-- EXECUTIVE LEADERSHIP EVENTS
-- ============================================================================

-- Weekly Executive Team Meeting (Monday 9am)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, location, timezone, aco, description_aco) VALUES
('mmc', 'exec-001', 'Executive Team Meeting',
'Weekly leadership sync covering company performance, strategic initiatives, and cross-functional coordination.

Standing Agenda:
- Financial review (CFO)
- Operations update (COO)
- Technology initiatives (CTO)
- Strategic priorities (CEO)',
'2025-01-06T09:00:00', '2025-01-06T10:30:00', 0, 'meeting', 'weekly', 1, '["Mon"]', NULL, 'tanderson@mmc.com', 'Executive Boardroom', 'America/Chicago', '{"sensitivity":"moderate"}', '{"sensitivity":"moderate"}');

-- CEO / CFO Weekly 1:1 (Tuesday 8am)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, timezone, aco, description_aco) VALUES
('mmc', 'exec-002', 'Thomas / Margaret 1:1',
'Weekly sync with CFO on financial matters, investor relations, and budget planning.',
'2025-01-07T08:00:00', '2025-01-07T08:45:00', 0, '1:1', 'weekly', 1, '["Tue"]', NULL, 'tanderson@mmc.com', 'America/Chicago', '{"sensitivity":"moderate"}', '{"sensitivity":"moderate"}');

-- CEO / CTO Weekly 1:1 (Tuesday 3pm)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, timezone, aco, description_aco) VALUES
('mmc', 'exec-003', 'Thomas / Richard 1:1',
'Weekly sync with CTO on technology strategy, R&D initiatives, and digital transformation.',
'2025-01-07T15:00:00', '2025-01-07T15:45:00', 0, '1:1', 'weekly', 1, '["Tue"]', NULL, 'tanderson@mmc.com', 'America/Chicago', '{"sensitivity":"moderate"}', '{"sensitivity":"moderate"}');

-- CEO / COO Weekly 1:1 (Wednesday 8am)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, timezone, aco, description_aco) VALUES
('mmc', 'exec-004', 'Thomas / Diana 1:1',
'Weekly sync with COO on operations, manufacturing, and supply chain.',
'2025-01-08T08:00:00', '2025-01-08T08:45:00', 0, '1:1', 'weekly', 1, '["Wed"]', NULL, 'tanderson@mmc.com', 'America/Chicago', '{"sensitivity":"moderate"}', '{"sensitivity":"moderate"}');

-- CFO / Finance Team Weekly (Wednesday 2pm)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, location, timezone, aco) VALUES
('mmc', 'exec-005', 'Finance Leadership Meeting',
'Weekly Finance team sync covering accounting, reporting, and financial planning.',
'2025-01-08T14:00:00', '2025-01-08T15:00:00', 0, 'meeting', 'weekly', 1, '["Wed"]', NULL, 'msullivan@mmc.com', 'Finance Conference Room', 'America/Chicago', '{"sensitivity":"moderate"}');

-- CTO / Engineering Leadership (Thursday 10am)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, location, timezone, aco) VALUES
('mmc', 'exec-006', 'Technology Leadership Sync',
'Weekly meeting with Engineering and IT leadership on technical initiatives.',
'2025-01-09T10:00:00', '2025-01-09T11:00:00', 0, 'meeting', 'weekly', 1, '["Thu"]', NULL, 'rnakamura@mmc.com', 'Engineering Hub', 'America/Chicago', '{"sensitivity":"moderate"}');

-- COO / Operations Leadership (Friday 9am)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, location, timezone, aco) VALUES
('mmc', 'exec-007', 'Operations Review',
'Weekly operations review covering manufacturing, supply chain, and logistics.',
'2025-01-10T09:00:00', '2025-01-10T10:00:00', 0, 'meeting', 'weekly', 1, '["Fri"]', NULL, 'dprince@mmc.com', 'Operations Center', 'America/Chicago', '{"sensitivity":"low"}');

-- ============================================================================
-- EXECUTIVE ONE-OFF EVENTS (Strategic Engagements 2025-2026)
-- ============================================================================

-- Q1 2025 Board Prep (January)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco, description_aco) VALUES
('mmc', 'exec-strat-001', 'Q1 Board Meeting Prep',
'Prepare materials and presentations for quarterly board meeting. Review financials, strategic initiatives, and key metrics.',
'2025-01-15T13:00:00', '2025-01-15T16:00:00', 0, 'planning', 'tanderson@mmc.com', 'Executive Boardroom', 'America/Chicago', '{"sensitivity":"moderate"}', '{"sensitivity":"moderate"}'),
('mmc', 'exec-strat-002', 'Q1 Board of Directors Meeting',
'Quarterly board meeting with company directors. Review company performance and strategic direction.',
'2025-01-22T09:00:00', '2025-01-22T16:00:00', 0, 'meeting', 'tanderson@mmc.com', 'Executive Boardroom', 'America/Chicago', '{"sensitivity":"moderate"}', '{"sensitivity":"moderate"}');

-- Annual Strategic Planning (February)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'exec-strat-003', 'Annual Strategy Offsite - Day 1',
'Executive team strategic planning offsite. Day 1: Market analysis, competitive landscape, long-term vision.',
'2025-02-10T08:00:00', '2025-02-10T17:00:00', 0, 'planning', 'tanderson@mmc.com', 'Marriott Conference Center', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'exec-strat-004', 'Annual Strategy Offsite - Day 2',
'Executive team strategic planning offsite. Day 2: Growth initiatives, resource allocation, 3-year roadmap.',
'2025-02-11T08:00:00', '2025-02-11T17:00:00', 0, 'planning', 'tanderson@mmc.com', 'Marriott Conference Center', 'America/Chicago', '{"sensitivity":"moderate"}');

-- Investor Relations (March)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, timezone, aco, description_aco) VALUES
('mmc', 'exec-strat-005', 'Investor Call - Q1 Earnings',
'Quarterly earnings call with investors and analysts.',
'2025-03-12T10:00:00', '2025-03-12T11:30:00', 0, 'meeting', 'msullivan@mmc.com', 'America/Chicago', '{"sensitivity":"moderate"}', '{"sensitivity":"moderate"}'),
('mmc', 'exec-strat-006', 'Major Customer Contract Review',
'Review and finalize major customer contract renewal. Legal and finance teams in attendance.',
'2025-03-18T14:00:00', '2025-03-18T16:00:00', 0, 'meeting', 'dprince@mmc.com', 'America/Chicago', '{"sensitivity":"moderate"}', '{"sensitivity":"moderate"}');

-- Q2 Events (April-June)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'exec-strat-007', 'Q2 Board Meeting Prep',
'Prepare materials for Q2 board meeting.',
'2025-04-14T13:00:00', '2025-04-14T16:00:00', 0, 'planning', 'tanderson@mmc.com', 'Executive Boardroom', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'exec-strat-008', 'Q2 Board of Directors Meeting',
'Quarterly board meeting with company directors.',
'2025-04-21T09:00:00', '2025-04-21T16:00:00', 0, 'meeting', 'tanderson@mmc.com', 'Executive Boardroom', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'exec-strat-009', 'Manufacturing Expansion Review',
'Review proposal for manufacturing capacity expansion. COO presenting recommendations.',
'2025-05-06T10:00:00', '2025-05-06T12:00:00', 0, 'review', 'dprince@mmc.com', 'Operations Center', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'exec-strat-010', 'Technology Investment Committee',
'Review major technology investments for FY2026. CTO presenting IT infrastructure and R&D proposals.',
'2025-05-20T14:00:00', '2025-05-20T16:00:00', 0, 'meeting', 'rnakamura@mmc.com', 'Executive Boardroom', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'exec-strat-011', 'Mid-Year Financial Review',
'Comprehensive mid-year financial performance review with executive team.',
'2025-06-10T09:00:00', '2025-06-10T12:00:00', 0, 'review', 'msullivan@mmc.com', 'Executive Boardroom', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'exec-strat-012', 'Investor Call - Q2 Earnings',
'Quarterly earnings call with investors and analysts.',
'2025-06-18T10:00:00', '2025-06-18T11:30:00', 0, 'meeting', 'msullivan@mmc.com', NULL, 'America/Chicago', '{"sensitivity":"moderate"}');

-- Q3 Events (July-September)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'exec-strat-013', 'Q3 Board Meeting Prep',
'Prepare materials for Q3 board meeting.',
'2025-07-14T13:00:00', '2025-07-14T16:00:00', 0, 'planning', 'tanderson@mmc.com', 'Executive Boardroom', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'exec-strat-014', 'Q3 Board of Directors Meeting',
'Quarterly board meeting with company directors.',
'2025-07-21T09:00:00', '2025-07-21T16:00:00', 0, 'meeting', 'tanderson@mmc.com', 'Executive Boardroom', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'exec-strat-015', 'Supply Chain Optimization Review',
'Review supply chain improvements and vendor consolidation strategy.',
'2025-08-12T10:00:00', '2025-08-12T12:00:00', 0, 'review', 'dprince@mmc.com', 'Operations Center', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'exec-strat-016', 'Digital Transformation Checkpoint',
'Review progress on digital transformation initiatives with IT and business stakeholders.',
'2025-08-26T14:00:00', '2025-08-26T16:00:00', 0, 'review', 'rnakamura@mmc.com', 'IT Conference Room', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'exec-strat-017', 'Investor Call - Q3 Earnings',
'Quarterly earnings call with investors and analysts.',
'2025-09-17T10:00:00', '2025-09-17T11:30:00', 0, 'meeting', 'msullivan@mmc.com', NULL, 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'exec-strat-018', 'Annual Budget Planning Kickoff',
'Kick off FY2026 budget planning process with department heads.',
'2025-09-23T09:00:00', '2025-09-23T12:00:00', 0, 'planning', 'msullivan@mmc.com', 'Executive Boardroom', 'America/Chicago', '{"sensitivity":"moderate"}');

-- Q4 Events (October-December)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'exec-strat-019', 'Q4 Board Meeting Prep',
'Prepare materials for Q4 board meeting.',
'2025-10-13T13:00:00', '2025-10-13T16:00:00', 0, 'planning', 'tanderson@mmc.com', 'Executive Boardroom', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'exec-strat-020', 'Q4 Board of Directors Meeting',
'Quarterly board meeting with company directors.',
'2025-10-20T09:00:00', '2025-10-20T16:00:00', 0, 'meeting', 'tanderson@mmc.com', 'Executive Boardroom', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'exec-strat-021', 'FY2026 Budget Review - Round 1',
'First review of FY2026 budget proposals from all departments.',
'2025-10-28T09:00:00', '2025-10-28T16:00:00', 0, 'planning', 'msullivan@mmc.com', 'Executive Boardroom', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'exec-strat-022', 'FY2026 Budget Review - Final',
'Final budget review and approval for FY2026.',
'2025-11-11T09:00:00', '2025-11-11T16:00:00', 0, 'planning', 'msullivan@mmc.com', 'Executive Boardroom', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'exec-strat-023', 'Year-End Performance Reviews - Exec Direct Reports',
'Annual performance review discussions for executive direct reports.',
'2025-12-02T09:00:00', '2025-12-02T17:00:00', 0, 'review', 'tanderson@mmc.com', 'Executive Office', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'exec-strat-024', 'Annual Company Town Hall',
'Company-wide year-end town hall. CEO address, awards, and FY2026 preview.',
'2025-12-10T15:00:00', '2025-12-10T17:00:00', 0, 'meeting', 'tanderson@mmc.com', 'Main Cafeteria', 'America/Chicago', '{"sensitivity":"low"}'),
('mmc', 'exec-strat-025', 'Investor Call - Q4 Earnings',
'Quarterly earnings call with investors and analysts.',
'2025-12-17T10:00:00', '2025-12-17T11:30:00', 0, 'meeting', 'msullivan@mmc.com', NULL, 'America/Chicago', '{"sensitivity":"moderate"}');

-- January 2026 Events
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'exec-strat-026', 'FY2026 Kickoff - Executive Team',
'Executive team kickoff for new fiscal year. Review goals, priorities, and Q1 focus areas.',
'2026-01-05T09:00:00', '2026-01-05T12:00:00', 0, 'planning', 'tanderson@mmc.com', 'Executive Boardroom', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'exec-strat-027', 'Q1 2026 Board Prep',
'Prepare materials for Q1 2026 board meeting.',
'2026-01-12T13:00:00', '2026-01-12T16:00:00', 0, 'planning', 'tanderson@mmc.com', 'Executive Boardroom', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'exec-strat-028', 'Project Phoenix Executive Review',
'Executive review of Project Phoenix progress. CTO presenting R&D results to C-suite.',
'2026-01-14T14:00:00', '2026-01-14T16:00:00', 0, 'review', 'rnakamura@mmc.com', 'Executive Boardroom', 'America/Chicago', '{"sensitivity":"high","compartments":["🍎"]}'),
('mmc', 'exec-strat-029', 'Q1 2026 Board of Directors Meeting',
'Quarterly board meeting with company directors.',
'2026-01-19T09:00:00', '2026-01-19T16:00:00', 0, 'meeting', 'tanderson@mmc.com', 'Executive Boardroom', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'exec-strat-030', 'Strategic Partner Meeting - Acme Corp',
'Strategic partnership discussion with Acme Corp executives.',
'2026-01-21T10:00:00', '2026-01-21T12:00:00', 0, 'meeting', 'tanderson@mmc.com', 'Executive Boardroom', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'exec-strat-031', 'Sales Strategy Review',
'Review sales performance and strategy for FY2026 with Sales leadership.',
'2026-01-27T14:00:00', '2026-01-27T16:00:00', 0, 'review', 'dprince@mmc.com', 'Sales Conference Room', 'America/Chicago', '{"sensitivity":"moderate"}');

-- ============================================================================
-- EXECUTIVE EVENT PARTICIPANTS
-- ============================================================================

-- Weekly Executive Team Meeting (all C-suite)
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-exec-001a', 'Executive Team Meeting', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-exec-001b', 'Executive Team Meeting', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-exec-001c', 'Executive Team Meeting', 'rnakamura@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-exec-001d', 'Executive Team Meeting', 'dprince@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- CEO / CFO 1:1
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-exec-002a', 'Thomas / Margaret 1:1', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-exec-002b', 'Thomas / Margaret 1:1', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- CEO / CTO 1:1
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-exec-003a', 'Thomas / Richard 1:1', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-exec-003b', 'Thomas / Richard 1:1', 'rnakamura@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- CEO / COO 1:1
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-exec-004a', 'Thomas / Diana 1:1', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-exec-004b', 'Thomas / Diana 1:1', 'dprince@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Finance Leadership Meeting
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-exec-005a', 'Finance Leadership Meeting', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z');
INSERT INTO calendar_participants (profile_id, id, event_title, team_name, role, added_at) VALUES
('mmc', 'part-exec-005b', 'Finance Leadership Meeting', 'Finance', 'required', '2025-01-01T00:00:00Z');

-- Technology Leadership Sync
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-exec-006a', 'Technology Leadership Sync', 'rnakamura@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-exec-006b', 'Technology Leadership Sync', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-exec-006c', 'Technology Leadership Sync', 'mchen@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Operations Review
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-exec-007a', 'Operations Review', 'dprince@mmc.com', 'organizer', '2025-01-01T00:00:00Z');
INSERT INTO calendar_participants (profile_id, id, event_title, team_name, role, added_at) VALUES
('mmc', 'part-exec-007b', 'Operations Review', 'Operations', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-exec-007c', 'Operations Review', 'Manufacturing', 'required', '2025-01-01T00:00:00Z');

-- Board meetings and strategic events - all C-suite attend
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-strat-001a', 'Q1 Board Meeting Prep', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-001b', 'Q1 Board Meeting Prep', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-001c', 'Q1 Board Meeting Prep', 'rnakamura@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-001d', 'Q1 Board Meeting Prep', 'dprince@mmc.com', 'required', '2025-01-01T00:00:00Z');

INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-strat-002a', 'Q1 Board of Directors Meeting', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-002b', 'Q1 Board of Directors Meeting', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-002c', 'Q1 Board of Directors Meeting', 'rnakamura@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-002d', 'Q1 Board of Directors Meeting', 'dprince@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Strategy Offsite - all executives
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-strat-003a', 'Annual Strategy Offsite - Day 1', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-003b', 'Annual Strategy Offsite - Day 1', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-003c', 'Annual Strategy Offsite - Day 1', 'rnakamura@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-003d', 'Annual Strategy Offsite - Day 1', 'dprince@mmc.com', 'required', '2025-01-01T00:00:00Z');

INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-strat-004a', 'Annual Strategy Offsite - Day 2', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-004b', 'Annual Strategy Offsite - Day 2', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-004c', 'Annual Strategy Offsite - Day 2', 'rnakamura@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-004d', 'Annual Strategy Offsite - Day 2', 'dprince@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Investor calls - CEO and CFO
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-strat-005a', 'Investor Call - Q1 Earnings', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-005b', 'Investor Call - Q1 Earnings', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Major Customer Contract - COO + CFO
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-strat-006a', 'Major Customer Contract Review', 'dprince@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-006b', 'Major Customer Contract Review', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-006c', 'Major Customer Contract Review', 'tanderson@mmc.com', 'optional', '2025-01-01T00:00:00Z');

-- Technology Investment Committee - CTO + CEO + CFO
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-strat-010a', 'Technology Investment Committee', 'rnakamura@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-010b', 'Technology Investment Committee', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-010c', 'Technology Investment Committee', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Mid-Year Financial Review - all executives
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-strat-011a', 'Mid-Year Financial Review', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-011b', 'Mid-Year Financial Review', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-011c', 'Mid-Year Financial Review', 'rnakamura@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-011d', 'Mid-Year Financial Review', 'dprince@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Annual Company Town Hall - all executives + everyone invited
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-strat-024a', 'Annual Company Town Hall', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-024b', 'Annual Company Town Hall', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-024c', 'Annual Company Town Hall', 'rnakamura@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-024d', 'Annual Company Town Hall', 'dprince@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- FY2026 Kickoff - all executives
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-strat-026a', 'FY2026 Kickoff - Executive Team', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-026b', 'FY2026 Kickoff - Executive Team', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-026c', 'FY2026 Kickoff - Executive Team', 'rnakamura@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-026d', 'FY2026 Kickoff - Executive Team', 'dprince@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Project Phoenix Executive Review - CTO + executives with clearance
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-strat-028a', 'Project Phoenix Executive Review', 'rnakamura@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-028b', 'Project Phoenix Executive Review', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-028c', 'Project Phoenix Executive Review', 'tbrown@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Q1 2026 Board of Directors Meeting
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-strat-029a', 'Q1 2026 Board of Directors Meeting', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-029b', 'Q1 2026 Board of Directors Meeting', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-029c', 'Q1 2026 Board of Directors Meeting', 'rnakamura@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-029d', 'Q1 2026 Board of Directors Meeting', 'dprince@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Strategic Partner Meeting - CEO + COO
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-strat-030a', 'Strategic Partner Meeting - Acme Corp', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-030b', 'Strategic Partner Meeting - Acme Corp', 'dprince@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Sales Strategy Review - COO + Sales leadership
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-strat-031a', 'Sales Strategy Review', 'dprince@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-031b', 'Sales Strategy Review', 'cmiller@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-031c', 'Sales Strategy Review', 'tanderson@mmc.com', 'optional', '2025-01-01T00:00:00Z');

-- Q2 Board Prep and Meeting - all executives
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-strat-007a', 'Q2 Board Meeting Prep', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-007b', 'Q2 Board Meeting Prep', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-007c', 'Q2 Board Meeting Prep', 'rnakamura@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-007d', 'Q2 Board Meeting Prep', 'dprince@mmc.com', 'required', '2025-01-01T00:00:00Z');

INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-strat-008a', 'Q2 Board of Directors Meeting', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-008b', 'Q2 Board of Directors Meeting', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-008c', 'Q2 Board of Directors Meeting', 'rnakamura@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-008d', 'Q2 Board of Directors Meeting', 'dprince@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Q3 Board Prep and Meeting - all executives
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-strat-013a', 'Q3 Board Meeting Prep', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-013b', 'Q3 Board Meeting Prep', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-013c', 'Q3 Board Meeting Prep', 'rnakamura@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-013d', 'Q3 Board Meeting Prep', 'dprince@mmc.com', 'required', '2025-01-01T00:00:00Z');

INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-strat-014a', 'Q3 Board of Directors Meeting', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-014b', 'Q3 Board of Directors Meeting', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-014c', 'Q3 Board of Directors Meeting', 'rnakamura@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-014d', 'Q3 Board of Directors Meeting', 'dprince@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Q4 Board Prep and Meeting - all executives
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-strat-019a', 'Q4 Board Meeting Prep', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-019b', 'Q4 Board Meeting Prep', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-019c', 'Q4 Board Meeting Prep', 'rnakamura@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-019d', 'Q4 Board Meeting Prep', 'dprince@mmc.com', 'required', '2025-01-01T00:00:00Z');

INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-strat-020a', 'Q4 Board of Directors Meeting', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-020b', 'Q4 Board of Directors Meeting', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-020c', 'Q4 Board of Directors Meeting', 'rnakamura@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-020d', 'Q4 Board of Directors Meeting', 'dprince@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Q1 2026 Board Prep
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-strat-027a', 'Q1 2026 Board Prep', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-027b', 'Q1 2026 Board Prep', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-027c', 'Q1 2026 Board Prep', 'rnakamura@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-027d', 'Q1 2026 Board Prep', 'dprince@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Investor Calls Q2-Q4 - CEO + CFO
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-strat-012a', 'Investor Call - Q2 Earnings', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-012b', 'Investor Call - Q2 Earnings', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z');

INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-strat-017a', 'Investor Call - Q3 Earnings', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-017b', 'Investor Call - Q3 Earnings', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z');

INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-strat-025a', 'Investor Call - Q4 Earnings', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-025b', 'Investor Call - Q4 Earnings', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Manufacturing Expansion Review - COO + CEO + CFO
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-strat-009a', 'Manufacturing Expansion Review', 'dprince@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-009b', 'Manufacturing Expansion Review', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-009c', 'Manufacturing Expansion Review', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Supply Chain Optimization Review - COO + CFO
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-strat-015a', 'Supply Chain Optimization Review', 'dprince@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-015b', 'Supply Chain Optimization Review', 'msullivan@mmc.com', 'optional', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-015c', 'Supply Chain Optimization Review', 'rnakamura@mmc.com', 'optional', '2025-01-01T00:00:00Z');

-- Digital Transformation Checkpoint - CTO + CEO + Eng Director
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-strat-016a', 'Digital Transformation Checkpoint', 'rnakamura@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-016b', 'Digital Transformation Checkpoint', 'tanderson@mmc.com', 'optional', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-016c', 'Digital Transformation Checkpoint', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Annual Budget Planning events - CFO + all department heads
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-strat-018a', 'Annual Budget Planning Kickoff', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-018b', 'Annual Budget Planning Kickoff', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-018c', 'Annual Budget Planning Kickoff', 'rnakamura@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-018d', 'Annual Budget Planning Kickoff', 'dprince@mmc.com', 'required', '2025-01-01T00:00:00Z');

INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-strat-021a', 'FY2026 Budget Review - Round 1', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-021b', 'FY2026 Budget Review - Round 1', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-021c', 'FY2026 Budget Review - Round 1', 'rnakamura@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-021d', 'FY2026 Budget Review - Round 1', 'dprince@mmc.com', 'required', '2025-01-01T00:00:00Z');

INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-strat-022a', 'FY2026 Budget Review - Final', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-022b', 'FY2026 Budget Review - Final', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-022c', 'FY2026 Budget Review - Final', 'rnakamura@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-022d', 'FY2026 Budget Review - Final', 'dprince@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Year-End Performance Reviews - CEO + HR
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-strat-023a', 'Year-End Performance Reviews - Exec Direct Reports', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-strat-023b', 'Year-End Performance Reviews - Exec Direct Reports', 'pmartinez@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- ============================================================================
-- OTHER ORGANIZERS AS REQUIRED PARTICIPANT
-- ============================================================================
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
-- COO (Diana Prince) events
('mmc', 'part-exec-orgreq-001', 'Major Customer Contract Review', 'dprince@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-exec-orgreq-002', 'Manufacturing Expansion Review', 'dprince@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-exec-orgreq-003', 'Operations Review', 'dprince@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-exec-orgreq-004', 'Sales Strategy Review', 'dprince@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-exec-orgreq-005', 'Supply Chain Optimization Review', 'dprince@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- CTO (Richard Nakamura) events
('mmc', 'part-exec-orgreq-010', 'Digital Transformation Checkpoint', 'rnakamura@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-exec-orgreq-011', 'Project Phoenix Executive Review', 'rnakamura@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-exec-orgreq-012', 'Technology Investment Committee', 'rnakamura@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-exec-orgreq-013', 'Technology Leadership Sync', 'rnakamura@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- IT Director (Mike Chen)
('mmc', 'part-exec-orgreq-020', 'Cybersecurity Awareness Training', 'mchen@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Project Lead (Tony Brown)
('mmc', 'part-exec-orgreq-030', 'Project Phoenix Sync', 'tbrown@mmc.com', 'required', '2025-01-01T00:00:00Z');

