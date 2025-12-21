/**
 * Custom OpenTelemetry Span Exporter for SQLite
 * 
 * Exports OTel spans directly to SQLite for airgapped environments.
 * No external telemetry collector required.
 */

import type { SpanExporter, ReadableSpan } from '@opentelemetry/sdk-trace-base';
import type { ExportResult } from '@opentelemetry/core';
import { ExportResultCode } from '@opentelemetry/core';
import Database from 'better-sqlite3';
import { resolve } from 'path';

// Batch size for bulk inserts
const BATCH_SIZE = 100;

// Pending spans buffer
let pendingSpans: SpanRecord[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

interface SpanRecord {
    trace_id: string;
    span_id: string;
    parent_span_id: string | null;
    name: string;
    kind: number;
    start_time: number;
    end_time: number;
    duration_ns: number;
    status_code: number;
    status_message: string | null;
    attributes: string;
    resource: string;
}

/**
 * Get database path from environment or use default
 */
function getDatabasePath(): string {
    return process.env.DATABASE_PATH || resolve(process.cwd(), 'rubigo.db');
}

/**
 * Initialize the database connection (lazy singleton)
 */
let db: Database.Database | null = null;

function getDatabase(): Database.Database {
    if (!db) {
        const dbPath = getDatabasePath();
        db = new Database(dbPath);

        // Ensure the table exists
        db.exec(`
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
    `);
    }
    return db;
}

/**
 * Convert HrTime (high-resolution time) to nanoseconds
 */
function hrTimeToNanos(hrTime: [number, number]): number {
    return hrTime[0] * 1_000_000_000 + hrTime[1];
}

/**
 * Flush pending spans to SQLite
 */
function flushSpans(): void {
    if (pendingSpans.length === 0) return;

    try {
        const database = getDatabase();
        const insert = database.prepare(`
      INSERT INTO otel_spans (
        trace_id, span_id, parent_span_id, name, kind,
        start_time, end_time, duration_ns, status_code, status_message,
        attributes, resource
      ) VALUES (
        @trace_id, @span_id, @parent_span_id, @name, @kind,
        @start_time, @end_time, @duration_ns, @status_code, @status_message,
        @attributes, @resource
      )
    `);

        const insertMany = database.transaction((spans: SpanRecord[]) => {
            for (const span of spans) {
                insert.run(span);
            }
        });

        insertMany(pendingSpans);
        pendingSpans = [];
    } catch (error) {
        console.error('[SQLiteSpanExporter] Failed to flush spans:', error);
    }
}

/**
 * Schedule a flush with debouncing
 */
function scheduleFlush(): void {
    if (flushTimer) return;

    flushTimer = setTimeout(() => {
        flushTimer = null;
        flushSpans();
    }, 1000); // Flush every second or when batch is full
}

/**
 * Custom SpanExporter that writes to SQLite
 */
export class SQLiteSpanExporter implements SpanExporter {
    export(
        spans: ReadableSpan[],
        resultCallback: (result: ExportResult) => void
    ): void {
        try {
            const records = spans.map((span): SpanRecord => {
                // Get parent span ID from parentSpanContext if available
                const parentContext = (span as { parentSpanContext?: () => { spanId?: string } }).parentSpanContext;
                const parentSpanId = parentContext?.()?.spanId || null;

                return {
                    trace_id: span.spanContext().traceId,
                    span_id: span.spanContext().spanId,
                    parent_span_id: parentSpanId,
                    name: span.name,
                    kind: span.kind,
                    start_time: hrTimeToNanos(span.startTime),
                    end_time: hrTimeToNanos(span.endTime),
                    duration_ns: hrTimeToNanos(span.endTime) - hrTimeToNanos(span.startTime),
                    status_code: span.status.code,
                    status_message: span.status.message || null,
                    attributes: JSON.stringify(
                        Object.fromEntries(
                            Object.entries(span.attributes).map(([k, v]) => [k, v])
                        )
                    ),
                    resource: JSON.stringify(
                        Object.fromEntries(
                            Object.entries(span.resource.attributes).map(([k, v]) => [k, v])
                        )
                    ),
                };
            });

            pendingSpans.push(...records);

            // Flush immediately if batch is full
            if (pendingSpans.length >= BATCH_SIZE) {
                flushSpans();
            } else {
                scheduleFlush();
            }

            resultCallback({ code: ExportResultCode.SUCCESS });
        } catch (error) {
            console.error('[SQLiteSpanExporter] Export error:', error);
            resultCallback({
                code: ExportResultCode.FAILED,
                error: error instanceof Error ? error : new Error(String(error)),
            });
        }
    }

    async shutdown(): Promise<void> {
        // Flush any remaining spans
        if (flushTimer) {
            clearTimeout(flushTimer);
            flushTimer = null;
        }
        flushSpans();

        // Close database connection
        if (db) {
            db.close();
            db = null;
        }
    }

    async forceFlush(): Promise<void> {
        if (flushTimer) {
            clearTimeout(flushTimer);
            flushTimer = null;
        }
        flushSpans();
    }
}
