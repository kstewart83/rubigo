-- ============================================================================
-- MMC Calendar Events - Company Holidays
-- ============================================================================
-- ACO: public - holidays are universal knowledge
-- Date Range: 2025-2026
-- Timezone: America/Chicago (Central)
-- ============================================================================

INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, organizer_email, aco) VALUES
('mmc', 'hol-001', 'New Year''s Day', 'Company Holiday - Office Closed. All employees off.', '2025-01-01T00:00:00', '2025-01-01T23:59:59', 1, 'holiday', NULL, '{"sensitivity":"public"}'),
('mmc', 'hol-002', 'Martin Luther King Jr. Day', 'Company Holiday - Office Closed. Honoring Dr. Martin Luther King Jr.', '2025-01-20T00:00:00', '2025-01-20T23:59:59', 1, 'holiday', NULL, '{"sensitivity":"public"}'),
('mmc', 'hol-003', 'Presidents Day', 'Company Holiday - Office Closed.', '2025-02-17T00:00:00', '2025-02-17T23:59:59', 1, 'holiday', NULL, '{"sensitivity":"public"}'),
('mmc', 'hol-004', 'Memorial Day', 'Company Holiday - Office Closed. Honoring those who served.', '2025-05-26T00:00:00', '2025-05-26T23:59:59', 1, 'holiday', NULL, '{"sensitivity":"public"}'),
('mmc', 'hol-005', 'Independence Day', 'Company Holiday - Office Closed. Happy Fourth of July!', '2025-07-04T00:00:00', '2025-07-04T23:59:59', 1, 'holiday', NULL, '{"sensitivity":"public"}'),
('mmc', 'hol-006', 'Labor Day', 'Company Holiday - Office Closed.', '2025-09-01T00:00:00', '2025-09-01T23:59:59', 1, 'holiday', NULL, '{"sensitivity":"public"}'),
('mmc', 'hol-007', 'Thanksgiving', 'Company Holiday - Office Closed Thursday and Friday.', '2025-11-27T00:00:00', '2025-11-28T23:59:59', 1, 'holiday', NULL, '{"sensitivity":"public"}'),
('mmc', 'hol-008', 'Christmas', 'Company Holiday - Office Closed.', '2025-12-25T00:00:00', '2025-12-25T23:59:59', 1, 'holiday', NULL, '{"sensitivity":"public"}'),
('mmc', 'hol-009', 'New Year''s Day 2026', 'Company Holiday - Office Closed. Happy New Year!', '2026-01-01T00:00:00', '2026-01-01T23:59:59', 1, 'holiday', NULL, '{"sensitivity":"public"}');
