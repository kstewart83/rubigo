-- Session Events table for SSE real-time event delivery
-- Events are persisted per-session for catch-up after disconnection

CREATE TABLE session_events (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    acked_at TEXT
);

-- Index for efficient catch-up queries
CREATE INDEX idx_session_events_lookup ON session_events(session_id, created_at);

-- Index for cleanup of old acknowledged events
CREATE INDEX idx_session_events_acked ON session_events(acked_at) WHERE acked_at IS NOT NULL;
