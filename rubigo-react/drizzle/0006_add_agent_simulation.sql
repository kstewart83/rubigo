-- Agent Simulation Schema Migration
-- Adds agent fields to personnel and creates agent-related tables

-- Add agent simulation columns to personnel table
ALTER TABLE personnel ADD COLUMN is_agent INTEGER DEFAULT 0;
ALTER TABLE personnel ADD COLUMN agent_status TEXT DEFAULT 'dormant';
ALTER TABLE personnel ADD COLUMN agent_persona TEXT;

-- Create agent_events table for thought/action logging
CREATE TABLE IF NOT EXISTS agent_events (
    id TEXT PRIMARY KEY,
    personnel_id TEXT NOT NULL REFERENCES personnel(id),
    timestamp TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('thought', 'action', 'observation', 'decision')),
    content TEXT NOT NULL,
    context_id TEXT,
    target_entity TEXT,
    parent_event_id TEXT,
    metadata TEXT
);

-- Create sync_contexts table for synchronous interaction zones
CREATE TABLE IF NOT EXISTS sync_contexts (
    id TEXT PRIMARY KEY,
    context_type TEXT NOT NULL CHECK (context_type IN ('meeting', 'chat_active', 'hallway', 'phone_call')),
    reaction_tier TEXT NOT NULL CHECK (reaction_tier IN ('sync', 'near_sync', 'async')),
    related_entity_id TEXT,
    started_at TEXT NOT NULL,
    ended_at TEXT
);

-- Create sync_context_participants table for tracking participants
CREATE TABLE IF NOT EXISTS sync_context_participants (
    id TEXT PRIMARY KEY,
    context_id TEXT NOT NULL REFERENCES sync_contexts(id),
    personnel_id TEXT NOT NULL REFERENCES personnel(id),
    joined_at TEXT NOT NULL,
    left_at TEXT
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_agent_events_personnel ON agent_events(personnel_id);
CREATE INDEX IF NOT EXISTS idx_agent_events_timestamp ON agent_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_events_context ON agent_events(context_id);
CREATE INDEX IF NOT EXISTS idx_sync_contexts_type ON sync_contexts(context_type);
CREATE INDEX IF NOT EXISTS idx_sync_contexts_active ON sync_contexts(started_at) WHERE ended_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sync_participants_context ON sync_context_participants(context_id);
CREATE INDEX IF NOT EXISTS idx_sync_participants_personnel ON sync_context_participants(personnel_id);
