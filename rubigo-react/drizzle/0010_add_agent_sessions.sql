-- Migration: Add agent_sessions and agent_scheduled_events tables
-- These were added to schema after 0006_add_agent_simulation.sql

CREATE TABLE IF NOT EXISTS agent_sessions (
    id TEXT PRIMARY KEY,
    personnel_id TEXT NOT NULL REFERENCES personnel(id),
    token TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS agent_scheduled_events (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES personnel(id),
    event_type TEXT NOT NULL CHECK (event_type IN ('activate', 'check_chat', 'check_email', 'check_calendar', 'check_tasks', 'think')),
    context_id TEXT REFERENCES sync_contexts(id),
    scheduled_for TEXT NOT NULL,
    payload TEXT,
    created_at TEXT NOT NULL,
    processed_at TEXT
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_agent_sessions_personnel ON agent_sessions(personnel_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_agent_sessions_token ON agent_sessions(token);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_agent_scheduled_events_agent ON agent_scheduled_events(agent_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_agent_scheduled_events_scheduled ON agent_scheduled_events(scheduled_for);
