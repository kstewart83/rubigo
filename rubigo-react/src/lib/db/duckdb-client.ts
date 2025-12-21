/**
 * DuckDB Client for Analytics
 * 
 * Provides OLAP query capabilities by attaching to SQLite in read-only mode.
 * Uses the Duck Lake pattern: SQLite for OLTP, DuckDB for OLAP.
 */

import { DuckDBInstance } from '@duckdb/node-api';
import type { DuckDBConnection } from '@duckdb/node-api';
import { Database } from 'bun:sqlite';
import { resolve } from 'path';

let instance: DuckDBInstance | null = null;
let connection: DuckDBConnection | null = null;

/**
 * Get database path from environment or use default
 */
function getSQLitePath(): string {
    return process.env.DATABASE_PATH || resolve(process.cwd(), 'rubigo.db');
}

/**
 * Ensure analytics tables exist in SQLite before DuckDB attaches
 * This prevents DuckDB from caching a schema without the analytics tables
 */
function ensureAnalyticsTables(): void {
    const db = new Database(getSQLitePath());

    db.exec(`
    -- OpenTelemetry Spans (traces)
    CREATE TABLE IF NOT EXISTS otel_spans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trace_id TEXT NOT NULL,
      span_id TEXT NOT NULL,
      parent_span_id TEXT,
      name TEXT NOT NULL,
      kind INTEGER NOT NULL DEFAULT 0,
      start_time INTEGER NOT NULL,
      end_time INTEGER NOT NULL,
      duration_ns INTEGER NOT NULL,
      status_code INTEGER DEFAULT 0,
      status_message TEXT,
      attributes TEXT,
      resource TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_otel_spans_trace ON otel_spans(trace_id);
    CREATE INDEX IF NOT EXISTS idx_otel_spans_time ON otel_spans(start_time);
    CREATE INDEX IF NOT EXISTS idx_otel_spans_name ON otel_spans(name);
    
    -- OpenTelemetry Metrics
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
    CREATE INDEX IF NOT EXISTS idx_otel_metrics_name_time ON otel_metrics(name, timestamp);
    
    -- Analytics Events (user behavior)
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
    CREATE INDEX IF NOT EXISTS idx_analytics_events_type_time ON analytics_events(event_type, created_at);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);
  `);

    db.close();
}

/**
 * Initialize DuckDB and attach SQLite database
 */
async function initDuckDB(): Promise<DuckDBConnection> {
    if (connection) return connection;

    // Ensure analytics tables exist BEFORE attaching
    ensureAnalyticsTables();

    // Create in-memory DuckDB instance (analytics only)
    instance = await DuckDBInstance.create(':memory:');
    connection = await instance.connect();

    // Attach SQLite database as read-only
    const sqlitePath = getSQLitePath();
    await connection.run(
        `ATTACH '${sqlitePath}' AS rubigo (TYPE sqlite, READ_ONLY)`
    );

    return connection;
}

/**
 * Execute a query and return results as an array of objects
 */
export async function query<T = Record<string, unknown>>(
    sql: string
): Promise<T[]> {
    const conn = await initDuckDB();
    const result = await conn.run(sql);

    // Get column names and rows
    const columns = result.columnNames();
    const allRows = await result.getRows();

    const rows: T[] = [];
    for (const row of allRows) {
        const obj: Record<string, unknown> = {};
        columns.forEach((col: string, i: number) => {
            obj[col] = row[i];
        });
        rows.push(obj as T);
    }

    return rows;
}

/**
 * Execute a query and return the first result
 */
export async function queryOne<T = Record<string, unknown>>(
    sql: string
): Promise<T | null> {
    const results = await query<T>(sql);
    return results[0] ?? null;
}

/**
 * Get a raw DuckDB connection for complex operations
 */
export async function getConnection(): Promise<DuckDBConnection> {
    return initDuckDB();
}

/**
 * Close the DuckDB connection (cleanup)
 */
export async function closeDuckDB(): Promise<void> {
    // DuckDB connections are closed when instance is garbage collected
    connection = null;
    instance = null;
}
