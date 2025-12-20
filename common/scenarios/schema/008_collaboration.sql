-- ============================================================================
-- 008_collaboration.sql - Chat, Email
-- ============================================================================
-- Source: chat.toml, collaboration.toml (email sections)

-- ============================================================================
-- Chat Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS chat_channels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'channel' CHECK(type IN ('channel', 'dm'))
);

CREATE TABLE IF NOT EXISTS chat_memberships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id TEXT NOT NULL REFERENCES chat_channels(id),
    person_id TEXT NOT NULL REFERENCES personnel(id),
    joined_at TEXT DEFAULT (datetime('now')),
    UNIQUE(channel_id, person_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id TEXT NOT NULL REFERENCES chat_channels(id),
    sender_id TEXT NOT NULL REFERENCES personnel(id),
    content TEXT NOT NULL,
    sent_at TEXT DEFAULT (datetime('now')),
    message_type TEXT DEFAULT 'text' CHECK(message_type IN ('text', 'file', 'system'))
);

-- ============================================================================
-- Email Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS emails (
    id TEXT PRIMARY KEY,
    sender_id TEXT REFERENCES personnel(id),
    sender_email TEXT,
    subject TEXT NOT NULL,
    body TEXT,
    folder TEXT DEFAULT 'inbox' CHECK(folder IN ('inbox', 'sent', 'drafts', 'trash', 'archive')),
    is_read INTEGER DEFAULT 0,
    is_starred INTEGER DEFAULT 0,
    thread_id TEXT,
    in_reply_to TEXT REFERENCES emails(id),
    sent_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS email_recipients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email_id TEXT NOT NULL REFERENCES emails(id),
    recipient_id TEXT REFERENCES personnel(id),
    recipient_email TEXT,
    recipient_type TEXT DEFAULT 'to' CHECK(recipient_type IN ('to', 'cc', 'bcc')),
    folder TEXT DEFAULT 'inbox',
    is_read INTEGER DEFAULT 0
);

-- ============================================================================
-- Chat Channels (from chat.toml)
-- ============================================================================

INSERT INTO chat_channels (id, name, description, type) VALUES
('ch-general', 'general', 'Company-wide announcements and discussions', 'channel');

INSERT INTO chat_channels (id, name, description, type) VALUES
('ch-engineering', 'engineering', 'Engineering team discussions', 'channel');

INSERT INTO chat_channels (id, name, description, type) VALUES
('ch-it-support', 'it-support', 'IT support requests and discussions', 'channel');

INSERT INTO chat_channels (id, name, description, type) VALUES
('ch-random', 'random', 'Off-topic conversations and fun', 'channel');

INSERT INTO chat_channels (id, name, description, type) VALUES
('ch-sales', 'sales', 'Sales team updates and discussions', 'channel');

-- ============================================================================
-- Chat Memberships (sample)
-- ============================================================================

-- Alex Chen is in general, it-support, engineering
INSERT INTO chat_memberships (channel_id, person_id) VALUES ('ch-general', 'test01');
INSERT INTO chat_memberships (channel_id, person_id) VALUES ('ch-it-support', 'test01');
INSERT INTO chat_memberships (channel_id, person_id) VALUES ('ch-engineering', 'test01');

-- Mike Chen (IT Director) is in general, it-support
INSERT INTO chat_memberships (channel_id, person_id) VALUES ('ch-general', '1ea074');
INSERT INTO chat_memberships (channel_id, person_id) VALUES ('ch-it-support', '1ea074');

-- David Park (Engineering Manager) is in general, engineering
INSERT INTO chat_memberships (channel_id, person_id) VALUES ('ch-general', 'd827cb');
INSERT INTO chat_memberships (channel_id, person_id) VALUES ('ch-engineering', 'd827cb');

-- ============================================================================
-- Chat Messages (sample)
-- ============================================================================

INSERT INTO chat_messages (channel_id, sender_id, content, sent_at) VALUES
('ch-general', '241a6d', 'Good morning everyone! Reminder that our Q1 planning meeting is tomorrow at 10am.', '2024-12-16T08:30:00');

INSERT INTO chat_messages (channel_id, sender_id, content, sent_at) VALUES
('ch-engineering', 'd827cb', 'Great progress on the sensor integration project! Keep up the good work team.', '2024-12-16T14:00:00');

INSERT INTO chat_messages (channel_id, sender_id, content, sent_at) VALUES
('ch-it-support', '1ea074', 'Network maintenance scheduled for this weekend. Expect brief outages Saturday 2-4am.', '2024-12-17T09:00:00');
