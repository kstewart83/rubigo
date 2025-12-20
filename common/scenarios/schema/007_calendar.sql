-- ============================================================================
-- 007_calendar.sql - Calendar Events
-- ============================================================================
-- Source: events.toml

CREATE TABLE IF NOT EXISTS calendar_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    start_time TEXT NOT NULL,  -- ISO 8601
    end_time TEXT NOT NULL,    -- ISO 8601
    all_day INTEGER DEFAULT 0,
    event_type TEXT,
    recurrence TEXT DEFAULT 'none' CHECK(recurrence IN ('none', 'daily', 'weekly', 'biweekly', 'monthly', 'yearly')),
    recurrence_interval INTEGER DEFAULT 1,
    recurrence_days TEXT,      -- JSON array of day names
    recurrence_until TEXT,     -- ISO 8601 date
    organizer_id TEXT REFERENCES personnel(id),
    location TEXT,
    virtual_url TEXT,
    timezone TEXT DEFAULT 'America/New_York'
);

CREATE TABLE IF NOT EXISTS calendar_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL REFERENCES calendar_events(id),
    person_id TEXT NOT NULL REFERENCES personnel(id),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'declined', 'tentative')),
    UNIQUE(event_id, person_id)
);

-- ============================================================================
-- Sample Calendar Events (from events.toml)
-- ============================================================================

INSERT INTO calendar_events (title, description, start_time, end_time, event_type, recurrence, recurrence_days, organizer_id, location, timezone) VALUES
('Engineering Standup', 'Daily engineering team sync to discuss progress and blockers', '2024-12-16T09:00:00', '2024-12-16T09:30:00', 'meeting', 'daily', NULL, 'd827cb', 'Conference Room 2A', 'America/New_York');

INSERT INTO calendar_events (title, description, start_time, end_time, event_type, recurrence, recurrence_days, recurrence_until, organizer_id, location, timezone) VALUES
('Sprint Planning', 'Bi-weekly sprint planning session for the development team', '2024-12-16T10:00:00', '2024-12-16T12:00:00', 'meeting', 'biweekly', '["Monday"]', '2025-03-31', 'd827cb', 'Board Room', 'America/New_York');

INSERT INTO calendar_events (title, description, start_time, end_time, event_type, recurrence, recurrence_days, organizer_id, location, timezone) VALUES
('IT Department Weekly', 'Weekly IT department meeting for updates and planning', '2024-12-17T14:00:00', '2024-12-17T15:00:00', 'meeting', 'weekly', '["Tuesday"]', '1ea074', 'IT Help Desk', 'America/New_York');

INSERT INTO calendar_events (title, description, start_time, end_time, event_type, organizer_id, location, timezone) VALUES
('Q1 Budget Review', 'Quarterly budget review with finance team', '2025-01-15T09:00:00', '2025-01-15T11:00:00', 'meeting', 'cdb964', 'Board Room', 'America/New_York');

INSERT INTO calendar_events (title, description, start_time, end_time, all_day, event_type, organizer_id, timezone) VALUES
('Company Holiday - New Year', 'Office closed for New Year holiday', '2025-01-01T00:00:00', '2025-01-01T23:59:59', 1, 'holiday', '241a6d', 'America/New_York');

-- NOTE: Full events from events.toml would be migrated here
-- This is a representative sample showing the schema structure
