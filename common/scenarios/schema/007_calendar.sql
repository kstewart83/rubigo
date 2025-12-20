-- ============================================================================
-- 007_calendar.sql - Calendar Events schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS calendar_events (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    title TEXT NOT NULL,
    description TEXT,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    all_day INTEGER DEFAULT 0,
    event_type TEXT,
    recurrence TEXT,
    recurrence_interval INTEGER DEFAULT 1,
    recurrence_days TEXT,
    recurrence_until TEXT,
    organizer_id TEXT,
    location TEXT,
    virtual_url TEXT,
    timezone TEXT DEFAULT 'America/New_York',
    PRIMARY KEY (id, profile_id)
);

CREATE TABLE IF NOT EXISTS calendar_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    event_id TEXT NOT NULL,
    person_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    UNIQUE(profile_id, event_id, person_id)
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_profile ON calendar_events(profile_id);
CREATE INDEX IF NOT EXISTS idx_calendar_participants_profile ON calendar_participants(profile_id);
