-- ============================================================================
-- MMC Calendar Events - Individual One-Off Events
-- ============================================================================
-- PTO, appointments, interviews, vendor demos, and other non-recurring events
-- Timezone: America/Chicago (Central)
-- ============================================================================

-- appointment: Lab Equipment Calibration
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-e24eb324', 'Lab Equipment Calibration',
'Annual calibration of thermal testing equipment.',
'2025-02-25T08:00:00', '2025-02-25T12:00:00', 0, 'appointment', 'kzhang@mmc.com', 'Prototyping Lab', 'America/Chicago', '{"sensitivity":"low"}');

-- appointment: Performance Review - Lisa Chen
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-b141fc56', 'Performance Review - Lisa Chen',
'Annual performance review meeting.

**Review Topics:**
- Goal achievement
- Competency assessment  
- Career development planning
- Compensation discussion',
'2025-03-17T14:00:00', '2025-03-17T15:00:00', 0, 'appointment', 'dpark@mmc.com', 'Conference Room 2A', 'America/Chicago', '{"sensitivity":"low"}');

-- appointment: Efficiency Testing - New Compressor
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-da2333eb', 'Efficiency Testing - New Compressor',
'Run thermal efficiency tests on prototype compressor.',
'2025-04-02T09:00:00', '2025-04-02T16:00:00', 0, 'appointment', 'kzhang@mmc.com', 'Prototyping Lab', 'America/Chicago', '{"sensitivity":"low"}');

-- appointment: Customer Site Visit - Acme Corp
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-11be6ae4', 'Customer Site Visit - Acme Corp',
'On-site visit to troubleshoot installation issues.',
'2025-04-22T08:00:00', '2025-04-22T17:00:00', 0, 'appointment', 'jadams@mmc.com', NULL, 'America/Chicago', '{"sensitivity":"low"}');

-- appointment: Dentist Appointment
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-815154f7', 'Dentist Appointment',
'Reminder: Leave by 3pm for dental checkup.',
'2025-08-20T15:00:00', '2025-08-20T17:00:00', 0, 'appointment', 'jadams@mmc.com', NULL, 'America/Chicago', '{"sensitivity":"low"}');

-- appointment: Jennifer Adams - Dentist
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-91511f89', 'Jennifer Adams - Dentist',
'Dentist appointment - will be back by 11am.',
'2026-01-14T08:00:00', '2026-01-14T11:00:00', 0, 'appointment', 'jadams@mmc.com', NULL, 'America/Chicago', '{"sensitivity":"low"}');

-- conference: Industry Webinar - HVAC Innovations
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-87fce3a9', 'Industry Webinar - HVAC Innovations',
'Online conference on emerging HVAC technologies.',
'2025-05-20T14:00:00', '2025-05-20T16:00:00', 0, 'conference', 'kzhang@mmc.com', NULL, 'America/Chicago', '{"sensitivity":"low"}');

-- interview: Interview - Senior Engineer Candidate
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-2e48f9f9', 'Interview - Senior Engineer Candidate',
'Technical interview for Senior Engineer position. Review resume beforehand.',
'2025-01-22T14:00:00', '2025-01-22T15:00:00', 0, 'interview', 'dpark@mmc.com', 'Conference Room 2A', 'America/Chicago', '{"sensitivity":"low"}');

-- interview: Interview - CAD Designer
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-681c0184', 'Interview - CAD Designer',
'Portfolio review for CAD Designer position.',
'2025-04-15T13:00:00', '2025-04-15T14:00:00', 0, 'interview', 'dpark@mmc.com', 'Conference Room 2A', 'America/Chicago', '{"sensitivity":"low"}');

-- interview: Interview - Electrical Engineer
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-219db2bd', 'Interview - Electrical Engineer',
'Technical screen for electrical engineering role.',
'2026-01-10T14:00:00', '2026-01-10T15:00:00', 0, 'interview', 'dpark@mmc.com', 'Conference Room 2A', 'America/Chicago', '{"sensitivity":"low"}');

-- meeting: CAD Software Vendor Demo
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-545c95bf', 'CAD Software Vendor Demo',
'Demo of new CAD software features from AutoCAD team. Evaluating upgrade options.',
'2025-01-14T15:00:00', '2025-01-14T16:00:00', 0, 'meeting', 'dpark@mmc.com', 'Conference Room 2A', 'America/Chicago', '{"sensitivity":"low"}');

-- meeting: Budget Review with Finance
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-a7ce53b4', 'Budget Review with Finance',
'Review Q1 engineering budget actuals vs plan with Margaret Sullivan.',
'2025-02-20T09:00:00', '2025-02-20T10:00:00', 0, 'meeting', 'dpark@mmc.com', 'Finance Department', 'America/Chicago', '{"sensitivity":"low"}');

-- meeting: Sales Engineering Sync - Customer Demo Prep
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-7583d69a', 'Sales Engineering Sync - Customer Demo Prep',
'Prep session with Sales for upcoming customer demo. Need to review feature set.',
'2025-04-08T11:00:00', '2025-04-08T12:00:00', 0, 'meeting', 'dpark@mmc.com', 'Conference Room 2A', 'America/Chicago', '{"sensitivity":"low"}');

-- meeting: Team Building - Escape Room
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-9200a96d', 'Team Building - Escape Room',
'Engineering team outing. Meet in lobby at 3pm.',
'2025-05-16T15:00:00', '2025-05-16T18:00:00', 0, 'meeting', 'dpark@mmc.com', NULL, 'America/Chicago', '{"sensitivity":"low"}');

-- meeting: New Hire Onboarding - Engineering
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-12b68500', 'New Hire Onboarding - Engineering',
'Welcome meeting with new engineers joining Q3.',
'2025-07-07T09:00:00', '2025-07-07T10:00:00', 0, 'meeting', 'dpark@mmc.com', 'Engineering Open Plan', 'America/Chicago', '{"sensitivity":"low"}');

-- meeting: Present R&D Findings to Exec Team
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-ef2c5797', 'Present R&D Findings to Exec Team',
'Monthly R&D update presentation to leadership.',
'2025-07-15T10:00:00', '2025-07-15T11:00:00', 0, 'meeting', 'kzhang@mmc.com', 'Board Room', 'America/Chicago', '{"sensitivity":"low"}');

-- meeting: Elena Vasquez - Project Status
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-49917708', 'Elena Vasquez - Project Status',
'Mid-project check-in on conveyor belt system redesign.',
'2025-09-24T15:00:00', '2025-09-24T15:30:00', 0, 'meeting', 'evasquez@mmc.com', 'Engineering Open Plan', 'America/Chicago', '{"sensitivity":"low"}');

-- meeting: Patent Review Meeting
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-3a6c2c4d', 'Patent Review Meeting',
'Review potential patent filing for new compressor design with legal.',
'2025-11-05T14:00:00', '2025-11-05T15:00:00', 0, 'meeting', 'dpark@mmc.com', 'Conference Room 2A', 'America/Chicago', '{"sensitivity":"low"}');

-- meeting: Holiday Party Planning
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-a84c67a5', 'Holiday Party Planning',
'Help coordinate engineering contributions to company holiday party.',
'2025-12-01T12:00:00', '2025-12-01T12:30:00', 0, 'meeting', 'dpark@mmc.com', 'HR Suite', 'America/Chicago', '{"sensitivity":"low"}');

-- meeting: Team Lunch - Holiday Celebration
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-63e2c14d', 'Team Lunch - Holiday Celebration',
'Engineering team lunch at Main Street Brewery.',
'2025-12-18T12:00:00', '2025-12-18T14:00:00', 0, 'meeting', 'dpark@mmc.com', NULL, 'America/Chicago', '{"sensitivity":"low"}');

-- meeting: New CAD License Renewal
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-bd21793b', 'New CAD License Renewal',
'Discussion with IT about CAD software license renewal.',
'2026-01-09T11:00:00', '2026-01-09T11:30:00', 0, 'meeting', 'lchen@mmc.com', 'IT Help Desk', 'America/Chicago', '{"sensitivity":"low"}');

-- meeting: Budget Planning - Q1
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-71b86da5', 'Budget Planning - Q1',
'Review Q1 budget with Finance for equipment purchases.',
'2026-01-15T10:00:00', '2026-01-15T11:00:00', 0, 'meeting', 'dpark@mmc.com', 'Finance Department', 'America/Chicago', '{"sensitivity":"low"}');

-- meeting: Vendor Demo - 3D Printer
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-dbc2dd3b', 'Vendor Demo - 3D Printer',
'Demo of industrial 3D printer for prototyping lab.',
'2026-01-17T14:00:00', '2026-01-17T15:30:00', 0, 'meeting', 'kzhang@mmc.com', 'Prototyping Lab', 'America/Chicago', '{"sensitivity":"low"}');

-- meeting: Engineering/Sales Sync - Demo Prep
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-452e133f', 'Engineering/Sales Sync - Demo Prep',
'Prepare demo for upcoming customer visit.',
'2026-01-24T11:00:00', '2026-01-24T12:00:00', 0, 'meeting', 'dpark@mmc.com', 'Conference Room 2A', 'America/Chicago', '{"sensitivity":"low"}');

-- meeting: Customer Visit - Acme Industries
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-d19a889b', 'Customer Visit - Acme Industries',
'Acme Industries touring manufacturing facility.',
'2026-01-30T09:00:00', '2026-01-30T12:00:00', 0, 'meeting', 'dpark@mmc.com', 'Reception Area', 'America/Chicago', '{"sensitivity":"low"}');

-- out-of-office: Work From Home
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-f8eff742', 'Work From Home',
'Working remote - available via Slack.',
'2025-04-11T08:00:00', '2025-04-11T17:00:00', 0, 'out-of-office', 'lchen@mmc.com', NULL, 'America/Chicago', '{"sensitivity":"low"}');

-- out-of-office: Jennifer Adams - HVAC Conference
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-dff79acc', 'Jennifer Adams - HVAC Conference',
'Attending HVAC Industry Conference in Chicago. Presenting on energy efficiency innovations.',
'2025-06-14T00:00:00', '2025-06-18T23:59:59', 0, 'out-of-office', 'jadams@mmc.com', NULL, 'America/Chicago', '{"sensitivity":"low"}');

-- out-of-office: David Park - PTO
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-e7ff2b35', 'David Park - PTO',
'Vacation - Out of office. Jennifer Adams covering urgent matters.',
'2025-08-04T00:00:00', '2025-08-08T23:59:59', 0, 'out-of-office', 'dpark@mmc.com', NULL, 'America/Chicago', '{"sensitivity":"low"}');

-- out-of-office: Michael Torres - Jury Duty
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-7b5020c0', 'Michael Torres - Jury Duty',
'Out for jury duty. Contact Jennifer Adams for urgent matters.',
'2025-09-08T00:00:00', '2025-09-10T23:59:59', 0, 'out-of-office', 'mtorres@mmc.com', NULL, 'America/Chicago', '{"sensitivity":"low"}');

-- out-of-office: Lisa Chen - PTO
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-b7fadd0f', 'Lisa Chen - PTO',
'Vacation - Walt Disney World with family.',
'2025-10-13T00:00:00', '2025-10-17T23:59:59', 0, 'out-of-office', 'lchen@mmc.com', NULL, 'America/Chicago', '{"sensitivity":"low"}');

-- out-of-office: Kevin Zhang - Work From Home
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-f07a90b4', 'Kevin Zhang - Work From Home',
'Working remote through holidays. Slack for urgent matters.',
'2025-12-22T08:00:00', '2025-12-26T17:00:00', 0, 'out-of-office', 'kzhang@mmc.com', NULL, 'America/Chicago', '{"sensitivity":"low"}');

-- out-of-office: Michael Torres - Vacation
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-f3599859', 'Michael Torres - Vacation',
'Family vacation - back January 2nd.',
'2025-12-23T00:00:00', '2026-01-01T23:59:59', 0, 'out-of-office', 'mtorres@mmc.com', NULL, 'America/Chicago', '{"sensitivity":"low"}');

-- out-of-office: Lisa Chen - PTO
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-e1c5d378', 'Lisa Chen - PTO',
'Day off for personal matters.',
'2026-01-21T00:00:00', '2026-01-21T23:59:59', 0, 'out-of-office', 'lchen@mmc.com', NULL, 'America/Chicago', '{"sensitivity":"low"}');

-- out-of-office: Priya Sharma - Work From Home
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-6506a756', 'Priya Sharma - Work From Home',
'Working remote today.',
'2026-01-27T08:00:00', '2026-01-27T17:00:00', 0, 'out-of-office', 'psharma@mmc.com', NULL, 'America/Chicago', '{"sensitivity":"low"}');

-- planning: Q1 Goals Setting - Engineering
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-fa8c868b', 'Q1 Goals Setting - Engineering',
'Work with leadership to finalize Q1 OKRs for engineering team.',
'2025-01-08T13:00:00', '2025-01-08T14:30:00', 0, 'planning', 'dpark@mmc.com', 'Board Room', 'America/Chicago', '{"sensitivity":"low"}');

-- planning: Robert Chang - Test Automation Planning
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-46e7df7f', 'Robert Chang - Test Automation Planning',
'Plan automation improvements for QA testing pipeline.',
'2025-07-22T13:00:00', '2025-07-22T14:30:00', 0, 'planning', 'rchang@mmc.com', 'Conference Room 2A', 'America/Chicago', '{"sensitivity":"low"}');

-- planning: Annual Budget Planning Kickoff
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-3bb72374', 'Annual Budget Planning Kickoff',
'Kick off FY2026 budget planning process with department heads.',
'2025-09-23T09:00:00', '2025-09-23T12:00:00', 0, 'planning', 'msullivan@mmc.com', 'Executive Boardroom', 'America/Chicago', '{"sensitivity":"low"}');

-- planning: Year-End Planning - 2026 Roadmap
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-f74c7eea', 'Year-End Planning - 2026 Roadmap',
'Initial planning session for 2026 product roadmap.',
'2025-10-22T13:00:00', '2025-10-22T16:00:00', 0, 'planning', 'dpark@mmc.com', 'Board Room', 'America/Chicago', '{"sensitivity":"low"}');

-- planning: Q1 2026 Kickoff - Engineering
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-e38264a2', 'Q1 2026 Kickoff - Engineering',
'First team meeting of 2026. Review goals and priorities.',
'2026-01-06T10:00:00', '2026-01-06T11:30:00', 0, 'planning', 'dpark@mmc.com', 'CAD Lab', 'America/Chicago', '{"sensitivity":"low"}');

-- planning: Robert Chang - QA Planning
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-43b6c029', 'Robert Chang - QA Planning',
'Plan QA automation improvements for Q1.',
'2026-01-29T10:00:00', '2026-01-29T11:00:00', 0, 'planning', 'rchang@mmc.com', 'Conference Room 2A', 'America/Chicago', '{"sensitivity":"low"}');

-- reminder: Q1 Expense Reports Due
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-743b7a35', 'Q1 Expense Reports Due',
'Reminder: Submit all Q1 expense reports by end of day.',
'2025-03-28T09:00:00', '2025-03-28T09:30:00', 0, 'reminder', 'lchen@mmc.com', NULL, 'America/Chicago', '{"sensitivity":"low"}');

-- review: Prototype Review - HVAC Controller
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-4c8d21af', 'Prototype Review - HVAC Controller',
'Review first prototype of new HVAC controller board with manufacturing.',
'2025-02-05T10:00:00', '2025-02-05T11:30:00', 0, 'review', 'dpark@mmc.com', 'Prototyping Lab', 'America/Chicago', '{"sensitivity":"low"}');

-- review: Compressor Design Review
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-23b93614', 'Compressor Design Review',
'Peer review of compressor redesign specs with Michael Torres.',
'2025-02-12T14:00:00', '2025-02-12T15:30:00', 0, 'review', 'jadams@mmc.com', 'CAD Lab', 'America/Chicago', '{"sensitivity":"low"}');

-- review: Priya Sharma - Electrical Review
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-301dc3e5', 'Priya Sharma - Electrical Review',
'Review electrical schematics for new control panel.',
'2025-04-30T10:00:00', '2025-04-30T11:30:00', 0, 'review', 'psharma@mmc.com', 'CAD Lab', 'America/Chicago', '{"sensitivity":"low"}');

-- review: Code Review Session
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-8722b17c', 'Code Review Session',
'Review firmware changes for Controller v2.3 release.',
'2025-05-07T14:00:00', '2025-05-07T15:30:00', 0, 'review', 'mtorres@mmc.com', 'Engineering Open Plan', 'America/Chicago', '{"sensitivity":"low"}');

-- review: Draft Rendering Review - Project Phoenix
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-79ef88db', 'Draft Rendering Review - Project Phoenix',
'Present initial 3D renders for Phoenix unit cabinet design.',
'2025-06-18T10:00:00', '2025-06-18T11:00:00', 0, 'review', 'lchen@mmc.com', 'Prototyping Lab', 'America/Chicago', '{"sensitivity":"low"}');

-- review: Quarterly Review with CTO
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-34bc988f', 'Quarterly Review with CTO',
'One-on-one with Richard to discuss Q2 results and H2 planning.',
'2025-06-25T10:00:00', '2025-06-25T11:30:00', 0, 'review', 'dpark@mmc.com', 'Executive Suite', 'America/Chicago', '{"sensitivity":"low"}');

-- review: Morgan Davis - Design System Review
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-7187ad32', 'Morgan Davis - Design System Review',
'Present updated product design system guidelines.',
'2025-08-12T11:00:00', '2025-08-12T12:00:00', 0, 'review', 'mdavis@mmc.com', 'CAD Lab', 'America/Chicago', '{"sensitivity":"low"}');

-- review: Year-End Engineering Review
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-db9f9f04', 'Year-End Engineering Review',
'Review 2025 accomplishments and lessons learned. Prep for 2026.',
'2025-12-15T14:00:00', '2025-12-15T16:00:00', 0, 'review', 'dpark@mmc.com', 'CAD Lab', 'America/Chicago', '{"sensitivity":"low"}');

-- review: Project Phoenix Status Review
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-5d78ae50', 'Project Phoenix Status Review',
'Monthly Phoenix project status with exec sponsors.',
'2026-01-08T15:00:00', '2026-01-08T16:00:00', 0, 'review', 'dpark@mmc.com', 'Board Room', 'America/Chicago', '{"sensitivity":"low"}');

-- review: Code Review - Controller Firmware
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-7bdf2de2', 'Code Review - Controller Firmware',
'Review firmware updates for HVAC controller v3.0.',
'2026-01-22T13:00:00', '2026-01-22T14:30:00', 0, 'review', 'mtorres@mmc.com', 'Engineering Open Plan', 'America/Chicago', '{"sensitivity":"low"}');

-- review: Q1 Goals Review
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-3bc928ec', 'Q1 Goals Review',
'Mid-month check on Q1 goal progress.',
'2026-01-28T14:00:00', '2026-01-28T14:30:00', 0, 'review', 'dpark@mmc.com', NULL, 'America/Chicago', '{"sensitivity":"low"}');

-- training: Cybersecurity Awareness Training
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-ad0494c6', 'Cybersecurity Awareness Training',
'Annual mandatory cybersecurity training for all employees.

**Topics covered:**
- Phishing awareness
- Password security
- Data handling best practices
- Incident reporting

Completion required by end of Q1.',
'2025-02-15T13:00:00', '2025-02-15T15:00:00', 0, 'training', 'mchen@mmc.com', NULL, 'America/Chicago', '{"sensitivity":"low"}');

-- training: Product Design Workshop
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-be8c31fc', 'Product Design Workshop',
'Full-day collaborative workshop on next-generation product design.

**Agenda:**
- Morning: Design thinking session
- Afternoon: Prototyping exercises
- End of day: Team presentations

Lunch and snacks provided.',
'2025-03-10T09:00:00', '2025-03-10T17:00:00', 0, 'training', 'dpark@mmc.com', 'CAD Lab', 'America/Chicago', '{"sensitivity":"low"}');

-- training: Safety Training - Annual Refresher
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-6510bd71', 'Safety Training - Annual Refresher',
'Mandatory annual safety training for manufacturing floor access.',
'2025-03-20T09:00:00', '2025-03-20T11:00:00', 0, 'training', 'mtorres@mmc.com', 'Manufacturing Floor', 'America/Chicago', '{"sensitivity":"low"}');

-- training: CAD Training - New Features
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-94b9dc05', 'CAD Training - New Features',
'Learn new CAD software features from recent upgrade.',
'2025-05-08T13:00:00', '2025-05-08T15:00:00', 0, 'training', 'jadams@mmc.com', 'CAD Lab', 'America/Chicago', '{"sensitivity":"low"}');

-- training: Sarah Johnson - Structural Analysis Training
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-268cd420', 'Sarah Johnson - Structural Analysis Training',
'External training on advanced structural simulation software.',
'2025-06-03T09:00:00', '2025-06-03T17:00:00', 0, 'training', 'sjohnson@mmc.com', NULL, 'America/Chicago', '{"sensitivity":"low"}');

-- training: Safety Training - New Equipment
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, location, timezone, aco) VALUES
('mmc', 'evt-169885b1', 'Safety Training - New Equipment',
'Mandatory safety training for new manufacturing equipment.',
'2026-01-13T09:00:00', '2026-01-13T11:00:00', 0, 'training', 'jadams@mmc.com', 'Manufacturing Floor', 'America/Chicago', '{"sensitivity":"low"}');

-- ============================================================================
-- INDIVIDUAL EVENT PARTICIPANTS
-- ============================================================================
-- Solo work has organizer as required (organizer = ownership, required = attendance)

INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
-- Lab Equipment Calibration - Kevin solo
('mmc', 'part-ind-001a', 'Lab Equipment Calibration', 'kzhang@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ind-001b', 'Lab Equipment Calibration', 'kzhang@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Efficiency Testing - Kevin solo
('mmc', 'part-ind-002a', 'Efficiency Testing - New Compressor', 'kzhang@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ind-002b', 'Efficiency Testing - New Compressor', 'kzhang@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Customer Site Visit - Jennifer solo
('mmc', 'part-ind-003a', 'Customer Site Visit - Acme Corp', 'jadams@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ind-003b', 'Customer Site Visit - Acme Corp', 'jadams@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Industry Webinar - Kevin solo
('mmc', 'part-ind-004a', 'Industry Webinar - HVAC Innovations', 'kzhang@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ind-004b', 'Industry Webinar - HVAC Innovations', 'kzhang@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Elena Vasquez Project Status - solo
('mmc', 'part-ind-005a', 'Elena Vasquez - Project Status', 'evasquez@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ind-005b', 'Elena Vasquez - Project Status', 'evasquez@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- New CAD License Renewal - Lisa solo
('mmc', 'part-ind-006a', 'New CAD License Renewal', 'lchen@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ind-006b', 'New CAD License Renewal', 'lchen@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Present R&D Findings - Kevin to execs
('mmc', 'part-ind-007a', 'Present R&D Findings to Exec Team', 'kzhang@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ind-007b', 'Present R&D Findings to Exec Team', 'kzhang@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ind-007c', 'Present R&D Findings to Exec Team', 'tanderson@mmc.com', 'optional', '2025-01-01T00:00:00Z'),
-- Robert Chang planning sessions - solo
('mmc', 'part-ind-008a', 'Robert Chang - Test Automation Planning', 'rchang@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ind-008b', 'Robert Chang - Test Automation Planning', 'rchang@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-ind-009a', 'Robert Chang - QA Planning', 'rchang@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ind-009b', 'Robert Chang - QA Planning', 'rchang@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Morgan Davis Design Review - solo
('mmc', 'part-ind-010a', 'Morgan Davis - Design System Review', 'mdavis@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ind-010b', 'Morgan Davis - Design System Review', 'mdavis@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Q1 Expense Reports - Lisa solo reminder
('mmc', 'part-ind-011a', 'Q1 Expense Reports Due', 'lchen@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ind-011b', 'Q1 Expense Reports Due', 'lchen@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Priya Sharma Electrical Review - solo
('mmc', 'part-ind-012a', 'Priya Sharma - Electrical Review', 'psharma@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ind-012b', 'Priya Sharma - Electrical Review', 'psharma@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Draft Rendering Review - Lisa solo
('mmc', 'part-ind-013a', 'Draft Rendering Review - Project Phoenix', 'lchen@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ind-013b', 'Draft Rendering Review - Project Phoenix', 'lchen@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Sarah Johnson Training - solo external
('mmc', 'part-ind-014a', 'Sarah Johnson - Structural Analysis Training', 'sjohnson@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ind-014b', 'Sarah Johnson - Structural Analysis Training', 'sjohnson@mmc.com', 'required', '2025-01-01T00:00:00Z'),
-- Jennifer Adams HVAC Conference - solo
('mmc', 'part-ind-015a', 'Jennifer Adams - HVAC Conference', 'jadams@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-ind-015b', 'Jennifer Adams - HVAC Conference', 'jadams@mmc.com', 'required', '2025-01-01T00:00:00Z');

