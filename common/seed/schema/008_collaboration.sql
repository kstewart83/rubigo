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

-- ============================================================================
-- Email: Threads, Messages, Recipients
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_threads (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    subject TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (id, profile_id)
);

CREATE TABLE IF NOT EXISTS emails (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    thread_id TEXT NOT NULL,
    from_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    parent_email_id TEXT,
    sent_at TEXT,
    is_draft INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (id, profile_id)
);

CREATE TABLE IF NOT EXISTS email_recipients (
    id TEXT NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    email_id TEXT NOT NULL,
    personnel_id TEXT,
    email_address TEXT,
    type TEXT DEFAULT 'to',
    folder TEXT DEFAULT 'inbox',
    read INTEGER DEFAULT 0,
    PRIMARY KEY (id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_email_threads_profile ON email_threads(profile_id);
CREATE INDEX IF NOT EXISTS idx_emails_profile ON emails(profile_id);
CREATE INDEX IF NOT EXISTS idx_email_recipients_profile ON email_recipients(profile_id);

-- ============================================================================
-- Presentations: Slides, Presentations, Junction Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS slides (
    id INTEGER NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    title TEXT,
    layout TEXT DEFAULT 'content',
    content_json TEXT DEFAULT '{}',
    notes TEXT,
    created_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (id, profile_id)
);

CREATE TABLE IF NOT EXISTS presentations (
    id INTEGER NOT NULL,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    title TEXT NOT NULL,
    description TEXT,
    theme TEXT DEFAULT 'dark',
    aspect_ratio TEXT DEFAULT '16:9',
    transition TEXT DEFAULT 'fade',
    created_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (id, profile_id)
);

CREATE TABLE IF NOT EXISTS presentation_slides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id TEXT NOT NULL REFERENCES profile(id),
    presentation_id INTEGER NOT NULL,
    slide_id INTEGER NOT NULL,
    position INTEGER NOT NULL,
    vertical_position INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_slides_profile ON slides(profile_id);
CREATE INDEX IF NOT EXISTS idx_presentations_profile ON presentations(profile_id);
CREATE INDEX IF NOT EXISTS idx_presentation_slides_profile ON presentation_slides(profile_id);
