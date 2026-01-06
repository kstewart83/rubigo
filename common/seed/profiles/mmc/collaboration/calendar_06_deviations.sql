-- ============================================================================
-- MMC Calendar Events - Deviations (Holiday Cancellations)
-- ============================================================================
-- Cancel recurring events that fall on company holidays
-- ============================================================================

-- ============================================================================
-- CALENDAR DEVIATIONS - Holiday Cancellations
-- ============================================================================
-- Cancel recurring events that fall on company holidays

-- New Year's Day 2025 (Wednesday Jan 1) - Cancel Wed events
INSERT INTO calendar_deviations (profile_id, id, event_id, original_date, cancelled) VALUES
('mmc', 'hol-cancel-2025-01-01-standup', 'eng-001', '2025-01-01', 1),
('mmc', 'hol-cancel-2025-01-01-kevin11', 'eng-103', '2025-01-01', 1);

-- MLK Day 2025 (Monday Jan 20) - Cancel Mon events
INSERT INTO calendar_deviations (profile_id, id, event_id, original_date, cancelled) VALUES
('mmc', 'hol-cancel-2025-01-20-standup', 'eng-001', '2025-01-20', 1),
('mmc', 'hol-cancel-2025-01-20-sprint', 'eng-002', '2025-01-20', 1);

-- Presidents Day 2025 (Monday Feb 17) - Cancel Mon events
INSERT INTO calendar_deviations (profile_id, id, event_id, original_date, cancelled) VALUES
('mmc', 'hol-cancel-2025-02-17-standup', 'eng-001', '2025-02-17', 1),
('mmc', 'hol-cancel-2025-02-17-sprint', 'eng-002', '2025-02-17', 1);

-- Memorial Day 2025 (Monday May 26) - Cancel Mon events
INSERT INTO calendar_deviations (profile_id, id, event_id, original_date, cancelled) VALUES
('mmc', 'hol-cancel-2025-05-26-standup', 'eng-001', '2025-05-26', 1),
('mmc', 'hol-cancel-2025-05-26-sprint', 'eng-002', '2025-05-26', 1);

-- Independence Day 2025 (Friday Jul 4) - Cancel Fri events
INSERT INTO calendar_deviations (profile_id, id, event_id, original_date, cancelled) VALUES
('mmc', 'hol-cancel-2025-07-04-standup', 'eng-001', '2025-07-04', 1),
('mmc', 'hol-cancel-2025-07-04-retro', 'eng-003', '2025-07-04', 1),
('mmc', 'hol-cancel-2025-07-04-richard11', 'eng-105', '2025-07-04', 1);

-- Labor Day 2025 (Monday Sep 1) - Cancel Mon events
INSERT INTO calendar_deviations (profile_id, id, event_id, original_date, cancelled) VALUES
('mmc', 'hol-cancel-2025-09-01-standup', 'eng-001', '2025-09-01', 1),
('mmc', 'hol-cancel-2025-09-01-sprint', 'eng-002', '2025-09-01', 1);

-- Thanksgiving 2025 (Thursday Nov 27) - Cancel Thu events
INSERT INTO calendar_deviations (profile_id, id, event_id, original_date, cancelled) VALUES
('mmc', 'hol-cancel-2025-11-27-standup', 'eng-001', '2025-11-27', 1),
('mmc', 'hol-cancel-2025-11-27-lisa11', 'eng-104', '2025-11-27', 1),
('mmc', 'hol-cancel-2025-11-27-phoenix', 'phoenix-001', '2025-11-27', 1);

-- Christmas 2025 (Thursday Dec 25) - Cancel Thu events
INSERT INTO calendar_deviations (profile_id, id, event_id, original_date, cancelled) VALUES
('mmc', 'hol-cancel-2025-12-25-standup', 'eng-001', '2025-12-25', 1),
('mmc', 'hol-cancel-2025-12-25-lisa11', 'eng-104', '2025-12-25', 1),
('mmc', 'hol-cancel-2025-12-25-phoenix', 'phoenix-001', '2025-12-25', 1);

-- New Year's Day 2026 (Thursday Jan 1) - Cancel Thu events
INSERT INTO calendar_deviations (profile_id, id, event_id, original_date, cancelled) VALUES
('mmc', 'hol-cancel-2026-01-01-standup', 'eng-001', '2026-01-01', 1),
('mmc', 'hol-cancel-2026-01-01-lisa11', 'eng-104', '2026-01-01', 1),
('mmc', 'hol-cancel-2026-01-01-phoenix', 'phoenix-001', '2026-01-01', 1);

