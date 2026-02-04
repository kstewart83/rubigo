-- ============================================================================
-- MMC Calendar Events - CFO (Margaret Sullivan) Schedule
-- ============================================================================
-- Dense CFO calendar with finance activities, investor relations, reporting
-- Timezone: America/Chicago (Central)
-- ============================================================================

-- ============================================================================
-- CFO RECURRING WEEKLY EVENTS
-- ============================================================================

-- Monday: Financial Dashboard Review (9am-10am)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, location, timezone, aco) VALUES
('mmc', 'cfo-rec-001', 'Financial Dashboard Review',
'Weekly review of key financial metrics, cash position, and variance analysis.',
'2025-01-06T09:00:00', '2025-01-06T10:00:00', 0, 'review', 'weekly', 1, '["Mon"]', NULL, 'msullivan@mmc.com', 'Finance Conference Room', 'America/Chicago', '{"sensitivity":"moderate"}');

-- Monday: Accounting Team Standup (10am-10:30am)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, location, timezone, aco) VALUES
('mmc', 'cfo-rec-002', 'Accounting Team Standup',
'Quick sync with accounting team on close activities, issues, and priorities.',
'2025-01-06T10:00:00', '2025-01-06T10:30:00', 0, 'standup', 'weekly', 1, '["Mon"]', NULL, 'msullivan@mmc.com', 'Finance Conference Room', 'America/Chicago', '{"sensitivity":"low"}');

-- Monday: Lunch (12pm-1pm)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, timezone, aco) VALUES
('mmc', 'cfo-rec-003', 'Lunch',
'Lunch break.',
'2025-01-06T12:00:00', '2025-01-06T13:00:00', 0, 'appointment', 'weekly', 1, '["Mon"]', NULL, 'msullivan@mmc.com', 'America/Chicago', '{"sensitivity":"low"}');

-- Monday: AP/AR Review (2pm-3pm)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, location, timezone, aco) VALUES
('mmc', 'cfo-rec-004', 'AP/AR Review',
'Weekly review of accounts payable and receivable. Collections updates and payment approvals.',
'2025-01-06T14:00:00', '2025-01-06T15:00:00', 0, 'review', 'weekly', 1, '["Mon"]', NULL, 'msullivan@mmc.com', 'Finance Conference Room', 'America/Chicago', '{"sensitivity":"moderate"}');

-- Tuesday: Budget vs Actuals Review (9am-10am)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, location, timezone, aco) VALUES
('mmc', 'cfo-rec-005', 'Budget vs Actuals',
'Weekly variance analysis review with FP&A team.',
'2025-01-07T09:00:00', '2025-01-07T10:00:00', 0, 'review', 'weekly', 1, '["Tue"]', NULL, 'msullivan@mmc.com', 'Finance Conference Room', 'America/Chicago', '{"sensitivity":"moderate"}');

-- Tuesday: Lunch (12pm-1pm)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, timezone, aco) VALUES
('mmc', 'cfo-rec-006', 'Lunch',
'Lunch break.',
'2025-01-07T12:00:00', '2025-01-07T13:00:00', 0, 'appointment', 'weekly', 1, '["Tue"]', NULL, 'msullivan@mmc.com', 'America/Chicago', '{"sensitivity":"low"}');

-- Tuesday: Treasury Management (2pm-3pm)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, location, timezone, aco) VALUES
('mmc', 'cfo-rec-007', 'Treasury Management',
'Cash management, investment review, and banking relationship updates.',
'2025-01-07T14:00:00', '2025-01-07T15:00:00', 0, 'meeting', 'weekly', 1, '["Tue"]', NULL, 'msullivan@mmc.com', 'CFO Office', 'America/Chicago', '{"sensitivity":"moderate"}');

-- Wednesday: CFO Office Hours (10am-12pm)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, location, timezone, aco) VALUES
('mmc', 'cfo-rec-008', 'CFO Office Hours',
'Open door time for finance team questions, approvals, and escalations.',
'2025-01-08T10:00:00', '2025-01-08T12:00:00', 0, 'meeting', 'weekly', 1, '["Wed"]', NULL, 'msullivan@mmc.com', 'CFO Office', 'America/Chicago', '{"sensitivity":"low"}');

-- Wednesday: Lunch (12pm-1pm)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, timezone, aco) VALUES
('mmc', 'cfo-rec-009', 'Lunch',
'Lunch break.',
'2025-01-08T12:00:00', '2025-01-08T13:00:00', 0, 'appointment', 'weekly', 1, '["Wed"]', NULL, 'msullivan@mmc.com', 'America/Chicago', '{"sensitivity":"low"}');

-- Wednesday: Vendor and Contract Review (3pm-4pm)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, location, timezone, aco) VALUES
('mmc', 'cfo-rec-010', 'Vendor Contract Review',
'Review and approval of major vendor contracts and procurement decisions.',
'2025-01-08T15:00:00', '2025-01-08T16:00:00', 0, 'review', 'weekly', 1, '["Wed"]', NULL, 'msullivan@mmc.com', 'CFO Office', 'America/Chicago', '{"sensitivity":"moderate"}');

-- Thursday: Tax and Compliance (9am-10am)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, location, timezone, aco) VALUES
('mmc', 'cfo-rec-011', 'Tax & Compliance Review',
'Weekly review of tax matters, regulatory compliance, and audit prep.',
'2025-01-09T09:00:00', '2025-01-09T10:00:00', 0, 'review', 'weekly', 1, '["Thu"]', NULL, 'msullivan@mmc.com', 'Finance Conference Room', 'America/Chicago', '{"sensitivity":"moderate"}');

-- Thursday: Lunch (12pm-1pm)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, timezone, aco) VALUES
('mmc', 'cfo-rec-012', 'Lunch',
'Lunch break.',
'2025-01-09T12:00:00', '2025-01-09T13:00:00', 0, 'appointment', 'weekly', 1, '["Thu"]', NULL, 'msullivan@mmc.com', 'America/Chicago', '{"sensitivity":"low"}');

-- Thursday: Financial Reporting Prep (2pm-4pm)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, location, timezone, aco) VALUES
('mmc', 'cfo-rec-013', 'Financial Reporting',
'Prepare and review financial reports, board materials, and investor communications.',
'2025-01-09T14:00:00', '2025-01-09T16:00:00', 0, 'focus', 'weekly', 1, '["Thu"]', NULL, 'msullivan@mmc.com', 'CFO Office', 'America/Chicago', '{"sensitivity":"moderate"}');

-- Friday: Finance Team All-Hands (9am-10am, biweekly)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, location, timezone, aco) VALUES
('mmc', 'cfo-rec-014', 'Finance Team All-Hands',
'Biweekly all-hands with entire finance organization. Updates, recognition, and Q&A.',
'2025-01-10T09:00:00', '2025-01-10T10:00:00', 0, 'all-hands', 'weekly', 2, '["Fri"]', NULL, 'msullivan@mmc.com', 'Finance Conference Room', 'America/Chicago', '{"sensitivity":"low"}');

-- Friday: Lunch (12pm-1pm)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, timezone, aco) VALUES
('mmc', 'cfo-rec-015', 'Lunch',
'Lunch break.',
'2025-01-10T12:00:00', '2025-01-10T13:00:00', 0, 'appointment', 'weekly', 1, '["Fri"]', NULL, 'msullivan@mmc.com', 'America/Chicago', '{"sensitivity":"low"}');

-- Friday: Week Close and Planning (3pm-4pm)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, location, timezone, aco) VALUES
('mmc', 'cfo-rec-016', 'Week Close & Planning',
'Review week accomplishments, plan next week priorities, and clear action items.',
'2025-01-10T15:00:00', '2025-01-10T16:00:00', 0, 'planning', 'weekly', 1, '["Fri"]', NULL, 'msullivan@mmc.com', 'CFO Office', 'America/Chicago', '{"sensitivity":"low"}');

-- ============================================================================
-- JANUARY 2026 CFO ONE-OFF EVENTS
-- ============================================================================

-- Week of Jan 5
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'cfo-jan-001', 'Year-End Close Kickoff',
'Kickoff meeting for FY2025 year-end close process with accounting team.',
'2026-01-05T11:00:00', '2026-01-05T12:00:00', 0, 'meeting', 'msullivan@mmc.com', 'Finance Conference Room', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'cfo-jan-002', 'External Auditor Planning Call',
'Annual audit planning call with Ernst & Young.',
'2026-01-06T11:00:00', '2026-01-06T12:00:00', 0, 'meeting', 'msullivan@mmc.com', NULL, 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'cfo-jan-003', 'Insurance Broker Meeting',
'Annual review of insurance coverage and renewals.',
'2026-01-07T10:00:00', '2026-01-07T11:00:00', 0, 'meeting', 'msullivan@mmc.com', 'CFO Office', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'cfo-jan-004', 'Bank Line Renewal Discussion',
'Credit line renewal discussion with Bank of Chicago.',
'2026-01-08T09:00:00', '2026-01-08T10:00:00', 0, 'meeting', 'msullivan@mmc.com', NULL, 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'cfo-jan-005', 'Payroll Year-End Review',
'Review year-end payroll processing and W-2 preparation.',
'2026-01-09T10:00:00', '2026-01-09T11:00:00', 0, 'review', 'msullivan@mmc.com', 'Finance Conference Room', 'America/Chicago', '{"sensitivity":"moderate"}');

-- Week of Jan 12 (Board prep week)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'cfo-jan-006', 'Audit Committee Pre-Meeting',
'Pre-board meeting with audit committee chair.',
'2026-01-12T11:00:00', '2026-01-12T11:45:00', 0, 'meeting', 'msullivan@mmc.com', NULL, 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'cfo-jan-007', 'Financial Projections Review',
'Finalize 2026 financial projections for board presentation.',
'2026-01-13T09:00:00', '2026-01-13T11:00:00', 0, 'planning', 'msullivan@mmc.com', 'Finance Conference Room', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'cfo-jan-008', 'Property Tax Assessment Review',
'Annual property tax assessment review with tax counsel.',
'2026-01-14T11:00:00', '2026-01-14T12:00:00', 0, 'review', 'msullivan@mmc.com', 'CFO Office', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'cfo-jan-009', 'Capital Expenditure Committee',
'Review and approve Q1 capital expenditure requests.',
'2026-01-15T10:00:00', '2026-01-15T11:30:00', 0, 'meeting', 'msullivan@mmc.com', 'Executive Boardroom', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'cfo-jan-010', 'Investor Relations Strategy',
'Plan Q1 investor outreach and earnings call strategy.',
'2026-01-16T10:00:00', '2026-01-16T11:00:00', 0, 'planning', 'msullivan@mmc.com', 'CFO Office', 'America/Chicago', '{"sensitivity":"moderate"}');

-- Week of Jan 19 (Board week)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'cfo-jan-011', 'Audit Committee Meeting',
'Quarterly audit committee meeting. Present financial statements and audit status.',
'2026-01-19T08:00:00', '2026-01-19T09:00:00', 0, 'meeting', 'msullivan@mmc.com', 'Executive Boardroom', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'cfo-jan-012', 'Revenue Recognition Review',
'Quarterly review of revenue recognition policies and significant contracts.',
'2026-01-20T10:00:00', '2026-01-20T11:00:00', 0, 'review', 'msullivan@mmc.com', 'Finance Conference Room', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'cfo-jan-013', 'Benefits Broker Quarterly',
'Quarterly review of employee benefits utilization and costs.',
'2026-01-21T11:00:00', '2026-01-21T12:00:00', 0, 'meeting', 'msullivan@mmc.com', 'CFO Office', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'cfo-jan-014', 'Cost Reduction Initiative Review',
'Review progress on FY2026 cost reduction initiatives.',
'2026-01-22T09:00:00', '2026-01-22T10:30:00', 0, 'review', 'msullivan@mmc.com', 'Finance Conference Room', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'cfo-jan-015', 'Pension Committee Meeting',
'Quarterly pension plan review and investment performance.',
'2026-01-23T10:00:00', '2026-01-23T11:00:00', 0, 'meeting', 'msullivan@mmc.com', 'Executive Boardroom', 'America/Chicago', '{"sensitivity":"moderate"}');

-- Week of Jan 26
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'cfo-jan-016', 'Month-End Close Planning',
'Plan January month-end close activities and timeline.',
'2026-01-26T11:00:00', '2026-01-26T12:00:00', 0, 'planning', 'msullivan@mmc.com', 'Finance Conference Room', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'cfo-jan-017', 'External Auditor Fieldwork Kickoff',
'Kickoff meeting for annual audit fieldwork.',
'2026-01-27T09:00:00', '2026-01-27T10:00:00', 0, 'meeting', 'msullivan@mmc.com', 'Finance Conference Room', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'cfo-jan-018', 'IT Finance Systems Review',
'Review of finance system upgrade project status with IT.',
'2026-01-28T10:00:00', '2026-01-28T11:00:00', 0, 'review', 'msullivan@mmc.com', 'IT Conference Room', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'cfo-jan-019', 'Lease Accounting Review',
'Quarterly lease accounting review and compliance check.',
'2026-01-29T09:00:00', '2026-01-29T10:00:00', 0, 'review', 'msullivan@mmc.com', 'CFO Office', 'America/Chicago', '{"sensitivity":"moderate"}'),
('mmc', 'cfo-jan-020', 'CFO Mentorship Session',
'Monthly mentorship session with high-potential finance staff.',
'2026-01-30T10:00:00', '2026-01-30T11:00:00', 0, '1:1', 'msullivan@mmc.com', 'CFO Office', 'America/Chicago', '{"sensitivity":"low"}');

-- ============================================================================
-- CFO EVENT PARTICIPANTS
-- ============================================================================

-- CFO Recurring Events
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
-- Financial Dashboard Review - CFO + Controller
('mmc', 'part-cfo-rec-001a', 'Financial Dashboard Review', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-rec-001b', 'Financial Dashboard Review', 'dfoster@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Accounting Team Standup - CFO + team
('mmc', 'part-cfo-rec-002a', 'Accounting Team Standup', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-rec-002b', 'Accounting Team Standup', 'dfoster@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Lunch (solo)
('mmc', 'part-cfo-rec-003', 'Lunch', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
-- AP/AR Review - CFO + Controller
('mmc', 'part-cfo-rec-004a', 'AP/AR Review', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-rec-004b', 'AP/AR Review', 'dfoster@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Budget vs Actuals - CFO + FP&A
('mmc', 'part-cfo-rec-005a', 'Budget vs Actuals', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-rec-005b', 'Budget vs Actuals', 'dfoster@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Lunch (solo)
('mmc', 'part-cfo-rec-006', 'Lunch', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
-- Treasury Management (solo focus)
('mmc', 'part-cfo-rec-007', 'Treasury Management', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
-- CFO Office Hours (solo - others join ad-hoc)
('mmc', 'part-cfo-rec-008', 'CFO Office Hours', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
-- Lunch (solo)
('mmc', 'part-cfo-rec-009', 'Lunch', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
-- Vendor Contract Review - CFO + Controller + Legal
('mmc', 'part-cfo-rec-010a', 'Vendor Contract Review', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-rec-010b', 'Vendor Contract Review', 'dprince@mmc.com', 'optional', '2025-01-01T00:00:00Z'),
-- Tax & Compliance Review - CFO + Controller
('mmc', 'part-cfo-rec-011a', 'Tax & Compliance Review', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-rec-011b', 'Tax & Compliance Review', 'dfoster@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Lunch (solo)
('mmc', 'part-cfo-rec-012', 'Lunch', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
-- Financial Reporting (solo focus)
('mmc', 'part-cfo-rec-013', 'Financial Reporting', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
-- Finance Team All-Hands - CFO + Finance team
('mmc', 'part-cfo-rec-014', 'Finance Team All-Hands', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
-- Lunch (solo)
('mmc', 'part-cfo-rec-015', 'Lunch', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
-- Week Close & Planning (solo)
('mmc', 'part-cfo-rec-016', 'Week Close & Planning', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z');

-- Finance Team for All-Hands
INSERT INTO calendar_participants (profile_id, id, event_title, team_name, role, added_at) VALUES
('mmc', 'part-cfo-rec-014b', 'Finance Team All-Hands', 'Finance', 'required', '2025-01-01T00:00:00Z');

-- January 2026 one-off participants
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
-- Year-End Close Kickoff - CFO + Controller
('mmc', 'part-cfo-jan-001a', 'Year-End Close Kickoff', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-jan-001b', 'Year-End Close Kickoff', 'dfoster@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- External Auditor Planning Call (external)
('mmc', 'part-cfo-jan-002', 'External Auditor Planning Call', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
-- Insurance Broker Meeting (external)
('mmc', 'part-cfo-jan-003', 'Insurance Broker Meeting', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
-- Bank Line Renewal Discussion (external + CEO)
('mmc', 'part-cfo-jan-004a', 'Bank Line Renewal Discussion', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-jan-004b', 'Bank Line Renewal Discussion', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Payroll Year-End Review - CFO + HR
('mmc', 'part-cfo-jan-005a', 'Payroll Year-End Review', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-jan-005b', 'Payroll Year-End Review', 'pmartinez@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Audit Committee Pre-Meeting (external)
('mmc', 'part-cfo-jan-006', 'Audit Committee Pre-Meeting', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
-- Financial Projections Review - CFO + Controller
('mmc', 'part-cfo-jan-007a', 'Financial Projections Review', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-jan-007b', 'Financial Projections Review', 'dfoster@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Property Tax Assessment Review (external)
('mmc', 'part-cfo-jan-008', 'Property Tax Assessment Review', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
-- Capital Expenditure Committee - CFO + CEO + COO
('mmc', 'part-cfo-jan-009a', 'Capital Expenditure Committee', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-jan-009b', 'Capital Expenditure Committee', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-jan-009c', 'Capital Expenditure Committee', 'dprince@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Investor Relations Strategy (solo planning)
('mmc', 'part-cfo-jan-010', 'Investor Relations Strategy', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
-- Audit Committee Meeting (board function)
('mmc', 'part-cfo-jan-011', 'Audit Committee Meeting', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
-- Revenue Recognition Review - CFO + Controller
('mmc', 'part-cfo-jan-012a', 'Revenue Recognition Review', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-jan-012b', 'Revenue Recognition Review', 'dfoster@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Benefits Broker Quarterly (external + HR)
('mmc', 'part-cfo-jan-013a', 'Benefits Broker Quarterly', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-jan-013b', 'Benefits Broker Quarterly', 'pmartinez@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Cost Reduction Initiative Review - CFO + COO
('mmc', 'part-cfo-jan-014a', 'Cost Reduction Initiative Review', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-jan-014b', 'Cost Reduction Initiative Review', 'dprince@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Pension Committee Meeting - CFO + CEO optional
('mmc', 'part-cfo-jan-015a', 'Pension Committee Meeting', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-jan-015b', 'Pension Committee Meeting', 'tanderson@mmc.com', 'optional', '2025-01-01T00:00:00Z'),
-- Month-End Close Planning - CFO + Controller
('mmc', 'part-cfo-jan-016a', 'Month-End Close Planning', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-jan-016b', 'Month-End Close Planning', 'dfoster@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- External Auditor Fieldwork Kickoff - CFO + Controller
('mmc', 'part-cfo-jan-017a', 'External Auditor Fieldwork Kickoff', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-jan-017b', 'External Auditor Fieldwork Kickoff', 'dfoster@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- IT Finance Systems Review - CFO + IT
('mmc', 'part-cfo-jan-018a', 'IT Finance Systems Review', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-jan-018b', 'IT Finance Systems Review', 'mchen@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Lease Accounting Review - CFO + Controller
('mmc', 'part-cfo-jan-019a', 'Lease Accounting Review', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-jan-019b', 'Lease Accounting Review', 'dfoster@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- CFO Mentorship Session (1:1 with rotating mentees)
('mmc', 'part-cfo-jan-020', 'CFO Mentorship Session', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z');

-- Additional CFO events needing participants
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
-- External Auditor Planning Call - CFO + Controller
('mmc', 'part-cfo-audit-001a', 'External Auditor Planning Call', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-audit-001b', 'External Auditor Planning Call', 'dfoster@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Audit Committee Pre-Meeting - CFO + CEO
('mmc', 'part-cfo-audit-002a', 'Audit Committee Pre-Meeting', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-audit-002b', 'Audit Committee Pre-Meeting', 'tanderson@mmc.com', 'optional', '2025-01-01T00:00:00Z'),
-- Audit Committee Meeting - CFO + CEO + Controller
('mmc', 'part-cfo-audit-003a', 'Audit Committee Meeting', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-audit-003b', 'Audit Committee Meeting', 'tanderson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-audit-003c', 'Audit Committee Meeting', 'dfoster@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Insurance Broker Meeting - CFO + COO
('mmc', 'part-cfo-ins-001a', 'Insurance Broker Meeting', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-ins-001b', 'Insurance Broker Meeting', 'dprince@mmc.com', 'optional', '2025-01-01T00:00:00Z'),
-- Property Tax Assessment Review - CFO + Controller
('mmc', 'part-cfo-tax-001a', 'Property Tax Assessment Review', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-tax-001b', 'Property Tax Assessment Review', 'dfoster@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Investor Relations Strategy - CFO + CEO
('mmc', 'part-cfo-ir-001a', 'Investor Relations Strategy', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-ir-001b', 'Investor Relations Strategy', 'tanderson@mmc.com', 'optional', '2025-01-01T00:00:00Z'),
-- Treasury Management - CFO + Controller
('mmc', 'part-cfo-treas-001a', 'Treasury Management', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-treas-001b', 'Treasury Management', 'dfoster@mmc.com', 'optional', '2025-01-01T00:00:00Z'),
-- CFO Office Hours - solo (CFO as required)
('mmc', 'part-cfo-office-001a', 'CFO Office Hours', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-office-001b', 'CFO Office Hours', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Financial Reporting - solo focus
('mmc', 'part-cfo-report-001a', 'Financial Reporting', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-report-001b', 'Financial Reporting', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Payroll Year-End Review - CFO + HR
('mmc', 'part-cfo-payroll-001a', 'Payroll Year-End Review', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-payroll-001b', 'Payroll Year-End Review', 'pmartinez@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Benefits Broker Quarterly - CFO + HR
('mmc', 'part-cfo-benefits-001a', 'Benefits Broker Quarterly', 'msullivan@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-benefits-001b', 'Benefits Broker Quarterly', 'pmartinez@mmc.com', 'required', '2025-01-01T00:00:00Z');

-- ============================================================================
-- CFO ORGANIZER AS REQUIRED PARTICIPANT
-- ============================================================================
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
-- Finance recurring events
('mmc', 'part-cfo-orgreq-001', 'AP/AR Review', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-orgreq-002', 'Accounting Team Standup', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-orgreq-003', 'Budget vs Actuals', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-orgreq-004', 'CFO Mentorship Session', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-orgreq-005', 'Finance Leadership Meeting', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-orgreq-006', 'Finance Team All-Hands', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-orgreq-007', 'Financial Dashboard Review', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-orgreq-008', 'Month-End Close Planning', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-orgreq-009', 'Lunch', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-orgreq-010', 'Week Close & Planning', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Budget planning
('mmc', 'part-cfo-orgreq-020', 'Annual Budget Planning Kickoff', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-orgreq-021', 'FY2026 Budget Review - Round 1', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-orgreq-022', 'FY2026 Budget Review - Final', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-orgreq-023', 'Year-End Close Kickoff', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Investor calls
('mmc', 'part-cfo-orgreq-030', 'Investor Call - Q1 Earnings', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-orgreq-031', 'Investor Call - Q2 Earnings', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-orgreq-032', 'Investor Call - Q3 Earnings', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-orgreq-033', 'Investor Call - Q4 Earnings', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-orgreq-034', 'Investor Relations Strategy', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Audit and compliance
('mmc', 'part-cfo-orgreq-040', 'Audit Committee Meeting', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-orgreq-041', 'Audit Committee Pre-Meeting', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-orgreq-042', 'External Auditor Fieldwork Kickoff', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-orgreq-043', 'External Auditor Planning Call', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-orgreq-044', 'Tax & Compliance Review', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Other finance meetings
('mmc', 'part-cfo-orgreq-050', 'Bank Line Renewal Discussion', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-orgreq-051', 'Benefits Broker Quarterly', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-orgreq-052', 'Capital Expenditure Committee', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-orgreq-053', 'Cost Reduction Initiative Review', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-orgreq-054', 'Financial Projections Review', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-orgreq-055', 'Insurance Broker Meeting', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-orgreq-056', 'IT Finance Systems Review', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-orgreq-057', 'Lease Accounting Review', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-orgreq-058', 'Mid-Year Financial Review', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-orgreq-059', 'Payroll Year-End Review', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-orgreq-060', 'Pension Committee Meeting', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-orgreq-061', 'Property Tax Assessment Review', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-orgreq-062', 'Revenue Recognition Review', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-orgreq-063', 'Treasury Management', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-cfo-orgreq-064', 'Vendor Contract Review', 'msullivan@mmc.com', 'required', '2025-01-01T00:00:00Z');

