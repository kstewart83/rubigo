'use server';

/**
 * Analytics Server Actions
 * 
 * Server-side functions for logging analytics events and metrics.
 * Uses bun:sqlite for Bun compatibility.
 */

import { Database } from 'bun:sqlite';
import { resolve } from 'path';

interface AnalyticsEvent {
    eventType: 'page_view' | 'feature' | 'session';
    eventName: string;
    properties?: Record<string, unknown>;
    personaId?: number;
    sessionId?: string;
    traceId?: string;
    durationMs?: number;
}

interface OtelMetric {
    name: string;
    type: 'gauge' | 'counter' | 'histogram';
    value: number;
    unit?: string;
    attributes?: Record<string, unknown>;
}

/**
 * Get database path from environment or use default
 */
function getDatabasePath(): string {
    return process.env.DATABASE_PATH || resolve(process.cwd(), 'rubigo.db');
}

/**
 * Get database connection (creates tables if needed)
 */
function getDatabase(): Database {
    const db = new Database(getDatabasePath());

    // Ensure tables exist
    db.exec(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      event_name TEXT NOT NULL,
      properties TEXT,
      persona_id INTEGER,
      session_id TEXT,
      trace_id TEXT,
      duration_ms INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_analytics_events_type_time 
      ON analytics_events(event_type, created_at);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_session 
      ON analytics_events(session_id);
    
    CREATE TABLE IF NOT EXISTS otel_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      value REAL NOT NULL,
      unit TEXT,
      attributes TEXT,
      timestamp INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_otel_metrics_name_time 
      ON otel_metrics(name, timestamp);
  `);

    return db;
}

/**
 * Log an analytics event
 */
export async function logAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
    try {
        const db = getDatabase();

        const stmt = db.prepare(`
      INSERT INTO analytics_events (
        event_type, event_name, properties, persona_id, 
        session_id, trace_id, duration_ms
      ) VALUES ($event_type, $event_name, $properties, $persona_id, 
        $session_id, $trace_id, $duration_ms)
    `);

        stmt.run({
            $event_type: event.eventType,
            $event_name: event.eventName,
            $properties: event.properties ? JSON.stringify(event.properties) : null,
            $persona_id: event.personaId ?? null,
            $session_id: event.sessionId ?? null,
            $trace_id: event.traceId ?? null,
            $duration_ms: event.durationMs ?? null,
        });

        db.close();
    } catch (error) {
        console.error('[Analytics] Failed to log event:', error);
    }
}

/**
 * Log an OpenTelemetry metric
 */
export async function logOtelMetric(metric: OtelMetric): Promise<void> {
    try {
        const db = getDatabase();

        const stmt = db.prepare(`
      INSERT INTO otel_metrics (name, type, value, unit, attributes, timestamp)
      VALUES ($name, $type, $value, $unit, $attributes, $timestamp)
    `);

        stmt.run({
            $name: metric.name,
            $type: metric.type,
            $value: metric.value,
            $unit: metric.unit ?? null,
            $attributes: metric.attributes ? JSON.stringify(metric.attributes) : null,
            $timestamp: Date.now() * 1_000_000, // Convert to nanoseconds
        });

        db.close();
    } catch (error) {
        console.error('[Analytics] Failed to log metric:', error);
    }
}

/**
 * Batch insert multiple analytics events (for efficiency)
 */
export async function logAnalyticsEventsBatch(
    events: AnalyticsEvent[]
): Promise<void> {
    if (events.length === 0) return;

    try {
        const db = getDatabase();

        const stmt = db.prepare(`
      INSERT INTO analytics_events (
        event_type, event_name, properties, persona_id, 
        session_id, trace_id, duration_ms
      ) VALUES ($event_type, $event_name, $properties, $persona_id, 
        $session_id, $trace_id, $duration_ms)
    `);

        const insertMany = db.transaction((evts: AnalyticsEvent[]) => {
            for (const event of evts) {
                stmt.run({
                    $event_type: event.eventType,
                    $event_name: event.eventName,
                    $properties: event.properties ? JSON.stringify(event.properties) : null,
                    $persona_id: event.personaId ?? null,
                    $session_id: event.sessionId ?? null,
                    $trace_id: event.traceId ?? null,
                    $duration_ms: event.durationMs ?? null,
                });
            }
        });

        insertMany(events);
        db.close();
    } catch (error) {
        console.error('[Analytics] Failed to log events batch:', error);
    }
}
