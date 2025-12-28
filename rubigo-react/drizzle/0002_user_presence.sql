-- User Presence tracking for real-time online/away/offline indicators

CREATE TABLE user_presence (
    personnel_id TEXT PRIMARY KEY REFERENCES personnel(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'online',
    last_seen TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for querying online users
CREATE INDEX idx_user_presence_status ON user_presence(status);
