-- ============================================================================
-- 008_collaboration.sql - Chat Channels, Memberships, Messages schema
-- ============================================================================

CREATE TABLE IF NOT EXISTS chat_channels (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'channel',
    PRIMARY KEY (id, profile_id)
);

CREATE TABLE IF NOT EXISTS chat_memberships (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    channel_id TEXT NOT NULL,
    person_id TEXT NOT NULL,
    joined_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (id, profile_id),
    UNIQUE(profile_id, channel_id, person_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    channel_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    content TEXT NOT NULL,
    sent_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_channels_profile ON chat_channels(profile_id);
CREATE INDEX IF NOT EXISTS idx_chat_memberships_profile ON chat_memberships(profile_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_profile ON chat_messages(profile_id);
