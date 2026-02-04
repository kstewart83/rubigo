-- ============================================================================
-- MMC Calendar Events - CEO (Thomas Anderson) Schedule
-- ============================================================================
-- Dense CEO calendar with executive activities, external meetings, deep work
-- Timezone: America/Chicago (Central)
-- ============================================================================

-- ============================================================================
-- CEO RECURRING WEEKLY EVENTS (Additional)
-- ============================================================================

-- Monday: Strategic Planning Block (11am-12pm)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, location, timezone, aco) VALUES
('mmc', 'ceo-rec-001', 'Strategic Planning',
'Weekly protected time for strategic thinking, market analysis, and long-term planning.',
'2025-01-06T11:00:00', '2025-01-06T12:00:00', 0, 'focus', 'weekly', 1, '["Mon"]', NULL, 'tanderson@mmc.com', 'CEO Office', 'America/Chicago', '{"sensitivity":"moderate"}');

-- Monday: Lunch with Leadership (rotating) (12pm-1pm)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, location, timezone, aco) VALUES
('mmc', 'ceo-rec-002', 'Leadership Lunch',
'Informal lunch with rotating leadership team members. Build relationships and gather insights.',
'2025-01-06T12:00:00', '2025-01-06T13:00:00', 0, 'meeting', 'weekly', 1, '["Mon"]', NULL, 'tanderson@mmc.com', 'Executive Dining Room', 'America/Chicago', '{"sensitivity":"low"}');

-- Monday: Operations Review (2pm-3pm)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, location, timezone, aco) VALUES
('mmc', 'ceo-rec-003', 'CEO Operations Briefing',
'Weekly briefing from COO on key operational metrics, issues, and decisions needed.',
'2025-01-06T14:00:00', '2025-01-06T15:00:00', 0, 'meeting', 'weekly', 1, '["Mon"]', NULL, 'tanderson@mmc.com', 'CEO Office', 'America/Chicago', '{"sensitivity":"moderate"}');

-- Monday: Email and Correspondence (3pm-4pm)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, location, timezone, aco) VALUES
('mmc', 'ceo-rec-004', 'Email & Correspondence',
'Protected time for executive correspondence, board communication, and key stakeholder follow-ups.',
'2025-01-06T15:00:00', '2025-01-06T16:00:00', 0, 'focus', 'weekly', 1, '["Mon"]', NULL, 'tanderson@mmc.com', 'CEO Office', 'America/Chicago', '{"sensitivity":"moderate"}');

-- Tuesday: Sales Pipeline Review (10am-11am)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, location, timezone, aco) VALUES
('mmc', 'ceo-rec-005', 'Sales Pipeline Review',
'Weekly review of sales pipeline, major opportunities, and customer health.',
'2025-01-07T10:00:00', '2025-01-07T11:00:00', 0, 'meeting', 'weekly', 1, '["Tue"]', NULL, 'tanderson@mmc.com', 'Sales Conference Room', 'America/Chicago', '{"sensitivity":"moderate"}');

-- Tuesday: Lunch Block (12pm-1pm)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, location, timezone, aco) VALUES
('mmc', 'ceo-rec-006', 'Lunch',
'Lunch break.',
'2025-01-07T12:00:00', '2025-01-07T13:00:00', 0, 'appointment', 'weekly', 1, '["Tue"]', NULL, 'tanderson@mmc.com', NULL, 'America/Chicago', '{"sensitivity":"low"}');

-- Tuesday: Market Intelligence Review (2pm-2:45pm)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, location, timezone, aco) VALUES
('mmc', 'ceo-rec-007', 'Market Intelligence',
'Review competitive intelligence, market trends, and industry news with strategy team.',
'2025-01-07T14:00:00', '2025-01-07T14:45:00', 0, 'meeting', 'weekly', 1, '["Tue"]', NULL, 'tanderson@mmc.com', 'CEO Office', 'America/Chicago', '{"sensitivity":"moderate"}');

-- Wednesday: HR & Talent Review (10am-11am)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, location, timezone, aco) VALUES
('mmc', 'ceo-rec-008', 'HR & Talent Review',
'Weekly sync with HR on hiring, retention, culture initiatives, and people decisions.',
'2025-01-08T10:00:00', '2025-01-08T11:00:00', 0, 'meeting', 'weekly', 1, '["Wed"]', NULL, 'tanderson@mmc.com', 'CEO Office', 'America/Chicago', '{"sensitivity":"moderate"}');

-- Wednesday: Lunch Block (12pm-1pm)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, location, timezone, aco) VALUES
('mmc', 'ceo-rec-009', 'Lunch',
'Lunch break.',
'2025-01-08T12:00:00', '2025-01-08T13:00:00', 0, 'appointment', 'weekly', 1, '["Wed"]', NULL, 'tanderson@mmc.com', NULL, 'America/Chicago', '{"sensitivity":"low"}');

-- Thursday: Deep Work / Thinking Time (9am-12pm)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, location, timezone, aco) VALUES
('mmc', 'ceo-rec-010', 'CEO Deep Work',
'Protected block for strategic thinking, document review, and focused work. No meetings.',
'2025-01-09T09:00:00', '2025-01-09T12:00:00', 0, 'focus', 'weekly', 1, '["Thu"]', NULL, 'tanderson@mmc.com', 'CEO Office', 'America/Chicago', '{"sensitivity":"moderate"}');

-- Thursday: Lunch Block (12pm-1pm)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, location, timezone, aco) VALUES
('mmc', 'ceo-rec-011', 'Lunch',
'Lunch break.',
'2025-01-09T12:00:00', '2025-01-09T13:00:00', 0, 'appointment', 'weekly', 1, '["Thu"]', NULL, 'tanderson@mmc.com', NULL, 'America/Chicago', '{"sensitivity":"low"}');

-- Thursday: External Calls Block (2pm-4pm)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, location, timezone, aco) VALUES
('mmc', 'ceo-rec-012', 'External Calls',
'Reserved block for investor calls, partner discussions, and external stakeholder meetings.',
'2025-01-09T14:00:00', '2025-01-09T16:00:00', 0, 'meeting', 'weekly', 1, '["Thu"]', NULL, 'tanderson@mmc.com', 'CEO Office', 'America/Chicago', '{"sensitivity":"moderate"}');

-- Friday: Week Review & Planning (9am-10am)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, location, timezone, aco) VALUES
('mmc', 'ceo-rec-013', 'Week Review & Planning',
'Review accomplishments, prepare for next week, and align on priorities with EA.',
'2025-01-10T09:00:00', '2025-01-10T10:00:00', 0, 'planning', 'weekly', 1, '["Fri"]', NULL, 'tanderson@mmc.com', 'CEO Office', 'America/Chicago', '{"sensitivity":"low"}');

-- Friday: Skip-level Meetings (10am-12pm)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, location, timezone, aco) VALUES
('mmc', 'ceo-rec-014', 'Skip-Level Meetings',
'Bi-weekly skip-level conversations with employees 2+ levels down. Rotating schedule.',
'2025-01-10T10:00:00', '2025-01-10T12:00:00', 0, '1:1', 'weekly', 2, '["Fri"]', NULL, 'tanderson@mmc.com', 'CEO Office', 'America/Chicago', '{"sensitivity":"moderate"}');

-- Friday: Lunch Block (12pm-1pm)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, location, timezone, aco) VALUES
('mmc', 'ceo-rec-015', 'Lunch',
'Lunch break.',
'2025-01-10T12:00:00', '2025-01-10T13:00:00', 0, 'appointment', 'weekly', 1, '["Fri"]', NULL, 'tanderson@mmc.com', NULL, 'America/Chicago', '{"sensitivity":"low"}');

-- Friday: Media & Communications Prep (2pm-3pm)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, location, timezone, aco) VALUES
('mmc', 'ceo-rec-016', 'Communications Prep',
'Prep for upcoming media, investor presentations, and external communications.',
'2025-01-10T14:00:00', '2025-01-10T15:00:00', 0, 'planning', 'weekly', 1, '["Fri"]', NULL, 'tanderson@mmc.com', 'CEO Office', 'America/Chicago', '{"sensitivity":"moderate"}');

-- ============================================================================
-- JANUARY 2026 CEO ONE-OFF EVENTS
-- ============================================================================

-- Week of Jan 5: Additional meetings
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'ceo-jan-001', 'New Year Planning - Executive Team',
'Detailed planning session to finalize Q1 priorities and resource allocation.',
'2026-01-05T14:00:00', '2026-01-05T16:00:00', 0, 'planning', 'tanderson@mmc.com', 'Executive Boardroom', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'ceo-jan-002', 'Bank of Chicago - Relationship Meeting',
'Annual relationship meeting with primary banking partner.',
'2026-01-06T09:00:00', '2026-01-06T10:00:00', 0, 'meeting', 'tanderson@mmc.com', 'Bank of Chicago Downtown', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'ceo-jan-003', 'Industry Association Call',
'Quarterly call with HVAC Industry Association leadership.',
'2026-01-07T11:00:00', '2026-01-07T11:45:00', 0, 'meeting', 'tanderson@mmc.com', NULL, 'America/Chicago', '{"sensitivity":"low"}'),
('mmc', 'ceo-jan-004', 'Legal Counsel Quarterly',
'Quarterly check-in with external legal counsel on regulatory and contract matters.',
'2026-01-08T15:00:00', '2026-01-08T16:00:00', 0, 'meeting', 'tanderson@mmc.com', 'CEO Office', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'ceo-jan-005', 'Board Member Pre-call - Williams',
'Pre-board meeting call with lead independent director.',
'2026-01-09T13:00:00', '2026-01-09T13:30:00', 0, 'meeting', 'tanderson@mmc.com', NULL, 'America/Chicago', '{"sensitivity":"moderate"}');

-- Week of Jan 12: Heavy board prep week
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'ceo-jan-006', 'Board Deck Review',
'Final review of board presentation materials with CFO.',
'2026-01-12T14:00:00', '2026-01-12T16:00:00', 0, 'planning', 'tanderson@mmc.com', 'Executive Boardroom', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'ceo-jan-007', 'Facilities Tour - New Wing',
'Tour of new manufacturing wing with facilities team.',
'2026-01-13T11:00:00', '2026-01-13T12:00:00', 0, 'meeting', 'tanderson@mmc.com', 'Manufacturing Floor', 'America/Chicago', '{"sensitivity":"low"}'),
('mmc', 'ceo-jan-008', 'Customer Advisory Board Call',
'Quarterly call with key customer advisory board members.',
'2026-01-14T10:00:00', '2026-01-14T11:00:00', 0, 'meeting', 'tanderson@mmc.com', NULL, 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'ceo-jan-009', 'Insurance Renewal Review',
'Annual insurance coverage review with risk management.',
'2026-01-15T09:00:00', '2026-01-15T10:00:00', 0, 'review', 'tanderson@mmc.com', 'CEO Office', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'ceo-jan-010', 'Supplier Partnership Meeting',
'Strategic discussion with key component supplier CEO.',
'2026-01-15T14:00:00', '2026-01-15T15:30:00', 0, 'meeting', 'tanderson@mmc.com', 'Executive Boardroom', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'ceo-jan-011', 'Board Member Pre-call - Chen',
'Pre-board meeting call with finance committee chair.',
'2026-01-16T09:00:00', '2026-01-16T09:30:00', 0, 'meeting', 'tanderson@mmc.com', NULL, 'America/Chicago', '{"sensitivity":"moderate"}');

-- Week of Jan 19: Board week
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'ceo-jan-012', 'Board Dinner',
'Pre-board meeting dinner with directors.',
'2026-01-18T18:00:00', '2026-01-18T21:00:00', 0, 'meeting', 'tanderson@mmc.com', 'The Capital Grille', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'ceo-jan-013', 'Post-Board Debrief',
'Executive team debrief on board meeting outcomes and action items.',
'2026-01-20T09:00:00', '2026-01-20T10:00:00', 0, 'meeting', 'tanderson@mmc.com', 'Executive Boardroom', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'ceo-jan-014', 'Media Interview - Trade Publication',
'Interview with HVAC Industry Journal on 2026 outlook.',
'2026-01-20T11:00:00', '2026-01-20T11:45:00', 0, 'meeting', 'tanderson@mmc.com', 'CEO Office', 'America/Chicago', '{"sensitivity":"low"}'),
('mmc', 'ceo-jan-015', 'Talent Review - VP Positions',
'Succession planning discussion for VP-level roles.',
'2026-01-21T14:00:00', '2026-01-21T15:30:00', 0, 'review', 'tanderson@mmc.com', 'CEO Office', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'ceo-jan-016', 'University Partnership Discussion',
'Exploratory meeting with State University engineering dean.',
'2026-01-22T10:00:00', '2026-01-22T11:00:00', 0, 'meeting', 'tanderson@mmc.com', 'Executive Boardroom', 'America/Chicago', '{"sensitivity":"low"}'),
('mmc', 'ceo-jan-017', 'Investor Call - BlackRock',
'Periodic investor update call.',
'2026-01-23T14:00:00', '2026-01-23T15:00:00', 0, 'meeting', 'tanderson@mmc.com', 'CEO Office', 'America/Chicago', '{"sensitivity":"moderate"}');

-- Week of Jan 26: Strategy and planning focus
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'ceo-jan-018', 'Product Roadmap Review',
'Deep dive into 2026-2027 product roadmap with CTO and Product.',
'2026-01-26T14:00:00', '2026-01-26T16:00:00', 0, 'review', 'tanderson@mmc.com', 'Engineering Hub', 'America/Chicago', '{"sensitivity":"high","compartments":["🍎"]}'),
('mmc', 'ceo-jan-019', 'Community Relations Event',
'Annual chamber of commerce luncheon. CEO keynote remarks.',
'2026-01-27T11:30:00', '2026-01-27T13:30:00', 0, 'meeting', 'tanderson@mmc.com', 'Marriott Ballroom', 'America/Chicago', '{"sensitivity":"low"}'),
('mmc', 'ceo-jan-020', 'IT Security Briefing',
'Annual cybersecurity posture review with CISO.',
'2026-01-28T09:00:00', '2026-01-28T10:00:00', 0, 'review', 'tanderson@mmc.com', 'CEO Office', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'ceo-jan-021', 'Quarterly Financial Review',
'Detailed Q4 2025 financial review and Q1 2026 forecast.',
'2026-01-28T14:00:00', '2026-01-28T16:00:00', 0, 'review', 'tanderson@mmc.com', 'Executive Boardroom', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'ceo-jan-022', 'Customer Escalation Call',
'CEO involvement in strategic account issue resolution.',
'2026-01-29T10:00:00', '2026-01-29T10:30:00', 0, 'meeting', 'tanderson@mmc.com', NULL, 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'ceo-jan-023', 'M&A Opportunity Review',
'Confidential review of potential acquisition target with CFO and advisors.',
'2026-01-29T14:00:00', '2026-01-29T16:00:00', 0, 'meeting', 'tanderson@mmc.com', 'CEO Office', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'ceo-jan-024', 'Month-End Wrap Up',
'End of month review and February priorities alignment.',
'2026-01-30T15:00:00', '2026-01-30T16:00:00', 0, 'planning', 'tanderson@mmc.com', 'CEO Office', 'America/Chicago', '{"sensitivity":"low"}');

-- ============================================================================
-- CEO EVENT PARTICIPANTS
-- ============================================================================

-- CEO Recurring Events
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
-- Strategic Planning (solo focus time)
('mmc', 'part-ceo-rec-001', 'Strategic Planning', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
-- Leadership Lunch (rotating execs)
('mmc', 'part-ceo-rec-002a', 'Leadership Lunch', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-rec-002b', 'Leadership Lunch', 'msullivan@mmc.com', 'optional', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-rec-002c', 'Leadership Lunch', 'rnakamura@mmc.com', 'optional', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-rec-002d', 'Leadership Lunch', 'dprince@mmc.com', 'optional', '2025-01-01T00:00:00Z'),
-- CEO Operations Briefing
('mmc', 'part-ceo-rec-003a', 'CEO Operations Briefing', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-rec-003b', 'CEO Operations Briefing', 'dprince@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Email & Correspondence (solo focus time)
('mmc', 'part-ceo-rec-004', 'Email & Correspondence', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
-- Sales Pipeline Review
('mmc', 'part-ceo-rec-005a', 'Sales Pipeline Review', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-rec-005b', 'Sales Pipeline Review', 'cmiller@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-rec-005c', 'Sales Pipeline Review', 'dprince@mmc.com', 'optional', '2025-01-01T00:00:00Z'),
-- Lunch (solo)
('mmc', 'part-ceo-rec-006', 'Lunch', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
-- Market Intelligence
('mmc', 'part-ceo-rec-007a', 'Market Intelligence', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-rec-007b', 'Market Intelligence', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- HR & Talent Review
('mmc', 'part-ceo-rec-008a', 'HR & Talent Review', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-rec-008b', 'HR & Talent Review', 'pmartinez@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Lunch (solo)
('mmc', 'part-ceo-rec-009', 'Lunch', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
-- CEO Deep Work (solo focus time)
('mmc', 'part-ceo-rec-010', 'CEO Deep Work', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
-- Lunch (solo)
('mmc', 'part-ceo-rec-011', 'Lunch', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
-- External Calls (solo - varies)
('mmc', 'part-ceo-rec-012', 'External Calls', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
-- Week Review & Planning
('mmc', 'part-ceo-rec-013', 'Week Review & Planning', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
-- Skip-Level Meetings (rotating employees)
('mmc', 'part-ceo-rec-014', 'Skip-Level Meetings', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
-- Lunch (solo)
('mmc', 'part-ceo-rec-015', 'Lunch', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
-- Communications Prep
('mmc', 'part-ceo-rec-016a', 'Communications Prep', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-rec-016b', 'Communications Prep', 'msullivan@mmc.com', 'optional', '2025-01-01T00:00:00Z');

-- January 2026 one-offs - key participants
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
-- New Year Planning - all execs
('mmc', 'part-ceo-jan-001a', 'New Year Planning - Executive Team', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-jan-001b', 'New Year Planning - Executive Team', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-jan-001c', 'New Year Planning - Executive Team', 'rnakamura@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-jan-001d', 'New Year Planning - Executive Team', 'dprince@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Bank meeting - CEO + CFO
('mmc', 'part-ceo-jan-002a', 'Bank of Chicago - Relationship Meeting', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-jan-002b', 'Bank of Chicago - Relationship Meeting', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Industry Association Call (external - CEO solo)
('mmc', 'part-ceo-jan-003', 'Industry Association Call', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
-- Legal Counsel (external)
('mmc', 'part-ceo-jan-004', 'Legal Counsel Quarterly', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
-- Board Pre-call (external)
('mmc', 'part-ceo-jan-005', 'Board Member Pre-call - Williams', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
-- Board Deck Review - CEO + CFO
('mmc', 'part-ceo-jan-006a', 'Board Deck Review', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-jan-006b', 'Board Deck Review', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Facilities Tour - CEO + COO
('mmc', 'part-ceo-jan-007a', 'Facilities Tour - New Wing', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-jan-007b', 'Facilities Tour - New Wing', 'dprince@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Customer Advisory Board (external + Sales VP)
('mmc', 'part-ceo-jan-008a', 'Customer Advisory Board Call', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-jan-008b', 'Customer Advisory Board Call', 'cmiller@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Insurance Renewal - CEO + CFO
('mmc', 'part-ceo-jan-009a', 'Insurance Renewal Review', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-jan-009b', 'Insurance Renewal Review', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Supplier Partnership - CEO + COO
('mmc', 'part-ceo-jan-010a', 'Supplier Partnership Meeting', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-jan-010b', 'Supplier Partnership Meeting', 'dprince@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Board Pre-call Chen (external)
('mmc', 'part-ceo-jan-011', 'Board Member Pre-call - Chen', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
-- Board Dinner (all execs)
('mmc', 'part-ceo-jan-012a', 'Board Dinner', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-jan-012b', 'Board Dinner', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-jan-012c', 'Board Dinner', 'rnakamura@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-jan-012d', 'Board Dinner', 'dprince@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Post-Board Debrief (all execs)
('mmc', 'part-ceo-jan-013a', 'Post-Board Debrief', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-jan-013b', 'Post-Board Debrief', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-jan-013c', 'Post-Board Debrief', 'rnakamura@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-jan-013d', 'Post-Board Debrief', 'dprince@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Media Interview (solo)
('mmc', 'part-ceo-jan-014', 'Media Interview - Trade Publication', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
-- Talent Review - CEO + HR
('mmc', 'part-ceo-jan-015a', 'Talent Review - VP Positions', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-jan-015b', 'Talent Review - VP Positions', 'pmartinez@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- University Partnership (external)
('mmc', 'part-ceo-jan-016', 'University Partnership Discussion', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
-- Investor Call - CEO + CFO
('mmc', 'part-ceo-jan-017a', 'Investor Call - BlackRock', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-jan-017b', 'Investor Call - BlackRock', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Product Roadmap Review - CEO + CTO + Eng Director
('mmc', 'part-ceo-jan-018a', 'Product Roadmap Review', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-jan-018b', 'Product Roadmap Review', 'rnakamura@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-jan-018c', 'Product Roadmap Review', 'dpark@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Community Relations (external event)
('mmc', 'part-ceo-jan-019', 'Community Relations Event', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
-- IT Security Briefing - CEO + CTO
('mmc', 'part-ceo-jan-020a', 'IT Security Briefing', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-jan-020b', 'IT Security Briefing', 'rnakamura@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-jan-020c', 'IT Security Briefing', 'mchen@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Quarterly Financial Review - CEO + CFO
('mmc', 'part-ceo-jan-021a', 'Quarterly Financial Review', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-jan-021b', 'Quarterly Financial Review', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Customer Escalation - CEO + COO
('mmc', 'part-ceo-jan-022a', 'Customer Escalation Call', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-jan-022b', 'Customer Escalation Call', 'dprince@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- M&A Opportunity Review - highly confidential
('mmc', 'part-ceo-jan-023a', 'M&A Opportunity Review', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-jan-023b', 'M&A Opportunity Review', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Month-End Wrap Up (solo - CEO as required attendee)
('mmc', 'part-ceo-jan-024a', 'Month-End Wrap Up', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-jan-024b', 'Month-End Wrap Up', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- Additional CEO events needing participants
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
-- Legal Counsel Quarterly - CEO + CFO optional
('mmc', 'part-ceo-legal-001a', 'Legal Counsel Quarterly', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-legal-001b', 'Legal Counsel Quarterly', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-legal-001c', 'Legal Counsel Quarterly', 'msullivan@mmc.com', 'optional', '2025-01-01T00:00:00Z'),
-- Board Pre-calls (CEO solo with board member - CEO as required)
('mmc', 'part-ceo-board-001a', 'Board Member Pre-call - Williams', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-board-001b', 'Board Member Pre-call - Williams', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-board-002a', 'Board Member Pre-call - Chen', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-board-002b', 'Board Member Pre-call - Chen', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Industry Association Call (CEO solo)
('mmc', 'part-ceo-ind-001a', 'Industry Association Call', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-ind-001b', 'Industry Association Call', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- University Partnership Discussion - CEO solo
('mmc', 'part-ceo-univ-001a', 'University Partnership Discussion', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-univ-001b', 'University Partnership Discussion', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Community Relations Event - CEO solo
('mmc', 'part-ceo-comm-001a', 'Community Relations Event', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-comm-001b', 'Community Relations Event', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Media Interview - CEO solo
('mmc', 'part-ceo-media-001a', 'Media Interview - Trade Publication', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-media-001b', 'Media Interview - Trade Publication', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Skip-Level Meetings - CEO solo (rotating employees join)
('mmc', 'part-ceo-skip-001a', 'Skip-Level Meetings', 'tanderson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-skip-001b', 'Skip-Level Meetings', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- ============================================================================
-- CEO ORGANIZER AS REQUIRED PARTICIPANT
-- ============================================================================
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
-- Recurring events
('mmc', 'part-ceo-orgreq-001', 'Executive Team Meeting', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-002', 'HR & Talent Review', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-003', 'Week Review & Planning', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-004', 'CEO Operations Briefing', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-005', 'Lunch', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-006', 'External Calls', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-007', 'Strategic Planning', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-008', 'Email & Correspondence', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-009', 'CEO Deep Work', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Board meetings
('mmc', 'part-ceo-orgreq-010', 'Q1 Board Meeting Prep', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-011', 'Q1 Board of Directors Meeting', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-012', 'Q2 Board Meeting Prep', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-013', 'Q2 Board of Directors Meeting', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-014', 'Q3 Board Meeting Prep', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-015', 'Q3 Board of Directors Meeting', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-016', 'Q4 Board Meeting Prep', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-017', 'Q4 Board of Directors Meeting', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-018', 'Q1 2026 Board Prep', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-019', 'Q1 2026 Board of Directors Meeting', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-020', 'Board Deck Review', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-021', 'Board Dinner', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-022', 'Post-Board Debrief', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Strategy and partner meetings
('mmc', 'part-ceo-orgreq-030', 'Annual Company Town Hall', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-031', 'Annual Strategy Offsite - Day 1', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-032', 'Annual Strategy Offsite - Day 2', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-033', 'Bank of Chicago - Relationship Meeting', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-034', 'Communications Prep', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-035', 'Customer Advisory Board Call', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-036', 'Customer Escalation Call', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-037', 'Facilities Tour - New Wing', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-038', 'FY2026 Kickoff - Executive Team', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-039', 'Insurance Renewal Review', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-040', 'Investor Call - BlackRock', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-041', 'IT Security Briefing', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-042', 'Leadership Lunch', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-043', 'M&A Opportunity Review', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-044', 'Market Intelligence', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-045', 'MMC All-Hands Meeting', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-046', 'New Year Planning - Executive Team', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-047', 'Product Roadmap Review', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-048', 'Quarterly Financial Review', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-049', 'Sales Pipeline Review', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-050', 'Strategic Partner Meeting - Acme Corp', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-051', 'Supplier Partnership Meeting', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-052', 'Talent Review - VP Positions', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ceo-orgreq-053', 'Year-End Performance Reviews - Exec Direct Reports', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z');

