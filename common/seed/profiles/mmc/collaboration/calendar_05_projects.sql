-- ============================================================================
-- MMC Calendar Events - Cross-Functional Projects
-- ============================================================================
-- Project Phoenix and other cross-functional project events
-- Timezone: America/Chicago (Central)
-- ============================================================================

-- ============================================================================
-- PROJECT PHOENIX (Secret R&D Initiative)
-- ============================================================================

-- Project Phoenix Weekly Sync (Thursday 4pm)
INSERT INTO calendar_events (profile_id, id, title, description, start_time, end_time, all_day, event_type, recurrence, recurrence_interval, recurrence_days, recurrence_until, organizer_email, location, timezone, aco, description_aco) VALUES
('mmc', 'phoenix-001', 'Project Phoenix Sync',
'Weekly sync for Project Phoenix task force.

Next-generation HVAC unit development initiative.',
'2025-01-09T16:00:00', '2025-01-09T17:00:00', 0, 'meeting', 'weekly', 1, '["Thu"]', NULL, 'tbrown@mmc.com', 'Prototyping Lab', 'America/Chicago', '{"sensitivity":"high","compartments":["🍎"]}', '{"sensitivity":"high","compartments":["🍎"]}');

-- ============================================================================
-- PROJECT PHOENIX PARTICIPANTS
-- ============================================================================

-- Project Phoenix Sync
INSERT INTO calendar_participants (profile_id, id, event_title, personnel_email, role, added_at) VALUES
('mmc', 'part-phoenix-001a', 'Project Phoenix Sync', 'tbrown@mmc.com', 'organizer', '2025-01-01T00:00:00Z'),
('mmc', 'part-phoenix-001b', 'Project Phoenix Sync', 'kzhang@mmc.com', 'required', '2025-01-01T00:00:00Z'),
('mmc', 'part-phoenix-001c', 'Project Phoenix Sync', 'jadams@mmc.com', 'required', '2025-01-01T00:00:00Z');
INSERT INTO calendar_participants (profile_id, id, event_title, team_name, role, added_at) VALUES
('mmc', 'part-phoenix-001d', 'Project Phoenix Sync', 'Project Phoenix', 'required', '2025-01-01T00:00:00Z');
