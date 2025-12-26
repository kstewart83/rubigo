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
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    event_title TEXT NOT NULL,       -- Business key: resolve to event_id
    personnel_email TEXT,            -- Business key: resolve to personnel_id
    team_name TEXT,                  -- Business key: resolve to team_id
    role TEXT DEFAULT 'required',    -- organizer, required, optional, excluded
    added_at TEXT NOT NULL,
    PRIMARY KEY (id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_profile ON calendar_events(profile_id);
CREATE INDEX IF NOT EXISTS idx_calendar_participants_profile ON calendar_participants(profile_id);

CREATE TABLE IF NOT EXISTS calendar_deviations (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    event_id TEXT NOT NULL,
    original_date TEXT,
    new_date TEXT,
    cancelled INTEGER DEFAULT 0,
    override_start_time TEXT,
    override_end_time TEXT,
    override_title TEXT,
    override_description TEXT,
    override_location TEXT,
    override_timezone TEXT,
    PRIMARY KEY (id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_calendar_deviations_profile ON calendar_deviations(profile_id);
CREATE INDEX IF NOT EXISTS idx_calendar_deviations_event ON calendar_deviations(event_id);
