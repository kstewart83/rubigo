/**
 * Presence Manager Worker
 * 
 * Runs in a separate Bun Worker thread.
 * Handles all presence-related logic:
 * - Processing heartbeats
 * - Detecting status transitions (10s interval)
 * - Writing events to session_events table
 */

import { Database } from "bun:sqlite";

// Constants
const ONLINE_THRESHOLD = 2 * 60 * 1000;  // 2 minutes
const AWAY_THRESHOLD = 5 * 60 * 1000;    // 5 minutes
const CHECK_INTERVAL = 10000;             // 10 seconds

// Types
type PresenceStatus = "online" | "away" | "offline";

interface HeartbeatMessage {
    type: "presence.heartbeat";
    personnelId: string;
    sessionId: string;
}

interface OfflineMessage {
    type: "presence.offline";
    personnelId: string;
}

interface SetStatusMessage {
    type: "presence.setStatus";
    personnelId: string;
    sessionId: string;
    status: PresenceStatus;
}

interface ShutdownMessage {
    type: "shutdown";
}

type WorkerMessage = HeartbeatMessage | OfflineMessage | SetStatusMessage | ShutdownMessage;

// DB connection - opened lazily
let db: Database | null = null;

function getDb(): Database {
    if (!db) {
        // Use same path as main app
        const dbPath = process.env.DATABASE_URL || "./rubigo.db";
        db = new Database(dbPath);
        db.exec("PRAGMA journal_mode = WAL");
        console.log("[PresenceWorker] Database connected:", dbPath);
    }
    return db;
}

// Calculate status from lastSeen
function calculateStatus(lastSeen: string): PresenceStatus {
    const elapsed = Date.now() - new Date(lastSeen).getTime();
    if (elapsed < ONLINE_THRESHOLD) return "online";
    if (elapsed < AWAY_THRESHOLD) return "away";
    return "offline";
}

// Generate event ID
function generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Write event to all sessions (broadcast)
function broadcastEvent(type: string, payload: unknown): void {
    const database = getDb();
    const now = new Date().toISOString();
    const eventId = generateEventId();
    const payloadJson = JSON.stringify(payload);

    // Get all personnel for persona-based sessions
    const personnel = database.query("SELECT id FROM personnel").all() as { id: string }[];

    for (const person of personnel) {
        const syntheticSessionId = `persona_${person.id}`;
        const specificEventId = `${eventId}_${person.id.slice(0, 6)}`;

        database.run(
            `INSERT INTO session_events (id, session_id, event_type, payload, created_at) 
             VALUES (?, ?, ?, ?, ?)`,
            [specificEventId, syntheticSessionId, type, payloadJson, now]
        );
    }
}

// Handle heartbeat
function handleHeartbeat(personnelId: string, sessionId: string): void {
    const database = getDb();
    const now = new Date().toISOString();

    // Check current stored status
    const existing = database.query(
        "SELECT status, last_seen FROM user_presence WHERE personnel_id = ?"
    ).get(personnelId) as { status: string; last_seen: string } | null;

    const storedStatus = existing?.status as PresenceStatus | undefined;
    const previousCalculatedStatus = existing ? calculateStatus(existing.last_seen) : "offline";

    // If user has manually set away, preserve that - only update last_seen
    // This prevents heartbeats from overwriting manual status
    if (storedStatus === "away") {
        database.run(
            "UPDATE user_presence SET last_seen = ? WHERE personnel_id = ?",
            [now, personnelId]
        );
        // Don't emit event - status hasn't changed
        return;
    }

    // Otherwise, normal heartbeat behavior - set to online
    database.run(
        `INSERT INTO user_presence (personnel_id, session_id, status, last_seen)
         VALUES (?, ?, 'online', ?)
         ON CONFLICT(personnel_id) DO UPDATE SET
           session_id = excluded.session_id,
           status = 'online',
           last_seen = excluded.last_seen`,
        [personnelId, sessionId, now]
    );

    // Only emit event if status changed
    if (previousCalculatedStatus !== "online") {
        broadcastEvent("presence.update", {
            personnelId,
            status: "online",
            lastSeen: now,
        });
        console.log(`[PresenceWorker] ${personnelId.slice(0, 8)}... went online`);
    }
}

// Handle explicit offline
function handleOffline(personnelId: string): void {
    const database = getDb();
    const now = new Date().toISOString();

    database.run("DELETE FROM user_presence WHERE personnel_id = ?", [personnelId]);

    broadcastEvent("presence.update", {
        personnelId,
        status: "offline",
        lastSeen: now,
    });
    console.log(`[PresenceWorker] ${personnelId.slice(0, 8)}... went offline`);
}

// Handle manual status override
function handleSetStatus(personnelId: string, sessionId: string, status: PresenceStatus): void {
    const database = getDb();
    const now = new Date().toISOString();

    if (status === "offline") {
        handleOffline(personnelId);
        return;
    }

    // Upsert with manual status
    database.run(
        `INSERT INTO user_presence (personnel_id, session_id, status, last_seen)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(personnel_id) DO UPDATE SET
           session_id = excluded.session_id,
           status = excluded.status,
           last_seen = excluded.last_seen`,
        [personnelId, sessionId, status, now]
    );

    broadcastEvent("presence.update", {
        personnelId,
        status,
        lastSeen: now,
    });
    console.log(`[PresenceWorker] ${personnelId.slice(0, 8)}... manual → ${status}`);
}

// Check for status transitions
function checkStatusTransitions(): void {
    const database = getDb();
    const now = new Date().toISOString();

    // Get all presence records
    const records = database.query(
        "SELECT personnel_id, status, last_seen FROM user_presence"
    ).all() as { personnel_id: string; status: string; last_seen: string }[];

    for (const record of records) {
        const currentStatus = calculateStatus(record.last_seen);
        const storedStatus = record.status as PresenceStatus;

        // Check for transitions
        if (currentStatus !== storedStatus) {
            if (currentStatus === "offline") {
                // Clean up and notify
                database.run("DELETE FROM user_presence WHERE personnel_id = ?", [record.personnel_id]);
                broadcastEvent("presence.update", {
                    personnelId: record.personnel_id,
                    status: "offline",
                    lastSeen: record.last_seen,
                });
                console.log(`[PresenceWorker] ${record.personnel_id.slice(0, 8)}... timed out → offline`);
            } else if (currentStatus === "away" && storedStatus === "online") {
                // Update to away
                database.run(
                    "UPDATE user_presence SET status = 'away' WHERE personnel_id = ?",
                    [record.personnel_id]
                );
                broadcastEvent("presence.update", {
                    personnelId: record.personnel_id,
                    status: "away",
                    lastSeen: record.last_seen,
                });
                console.log(`[PresenceWorker] ${record.personnel_id.slice(0, 8)}... → away`);
            }
        }
    }
}

// Start periodic checks
let checkInterval: ReturnType<typeof setInterval> | null = null;

function startPeriodicChecks(): void {
    if (checkInterval) return;
    checkInterval = setInterval(checkStatusTransitions, CHECK_INTERVAL);
    console.log("[PresenceWorker] Started periodic status checks (10s interval)");
}

function stopPeriodicChecks(): void {
    if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
    }
}

// Message handler
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
    const message = event.data;

    switch (message.type) {
        case "presence.heartbeat":
            handleHeartbeat(message.personnelId, message.sessionId);
            break;

        case "presence.offline":
            handleOffline(message.personnelId);
            break;

        case "presence.setStatus":
            handleSetStatus(message.personnelId, message.sessionId, message.status);
            break;

        case "shutdown":
            console.log("[PresenceWorker] Shutting down...");
            stopPeriodicChecks();
            if (db) {
                db.close();
                db = null;
            }
            break;
    }
};

// Initialize
console.log("[PresenceWorker] Starting...");
startPeriodicChecks();
