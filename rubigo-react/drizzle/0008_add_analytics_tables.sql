-- Analytics and Observability Tables (GH #33)

-- OpenTelemetry Spans (traces)
CREATE TABLE IF NOT EXISTS otel_spans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trace_id TEXT NOT NULL,
  span_id TEXT NOT NULL,
  parent_span_id TEXT,
  name TEXT NOT NULL,
  kind INTEGER NOT NULL DEFAULT 0,           -- 0=Internal, 1=Server, 2=Client, 3=Producer, 4=Consumer
  start_time INTEGER NOT NULL,               -- nanoseconds since epoch
  end_time INTEGER NOT NULL,
  duration_ns INTEGER NOT NULL,
  status_code INTEGER DEFAULT 0,             -- 0=Unset, 1=OK, 2=Error
  status_message TEXT,
  attributes TEXT,                           -- JSON
  resource TEXT,                             -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-->statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_otel_spans_trace ON otel_spans(trace_id);
-->statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_otel_spans_time ON otel_spans(start_time);
-->statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_otel_spans_name ON otel_spans(name);
-->statement-breakpoint

-- OpenTelemetry Metrics
CREATE TABLE IF NOT EXISTS otel_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,                        -- 'http.server.duration', 'web_vital.LCP'
  type TEXT NOT NULL,                        -- 'gauge', 'counter', 'histogram'
  value REAL NOT NULL,
  unit TEXT,
  attributes TEXT,                           -- JSON
  timestamp INTEGER NOT NULL,                -- nanoseconds since epoch
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-->statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_otel_metrics_name_time ON otel_metrics(name, timestamp);
-->statement-breakpoint

-- High-level analytics events (user behavior)
CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,                  -- 'page_view' | 'feature' | 'session'
  event_name TEXT NOT NULL,                  -- 'calendar.create_event' | '/collaboration/calendar'
  properties TEXT,                           -- JSON
  persona_id INTEGER,
  session_id TEXT,
  trace_id TEXT,                             -- Links to otel_spans for drill-down
  duration_ms INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-->statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_analytics_events_type_time ON analytics_events(event_type, created_at);
-->statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);
-->statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_analytics_events_trace ON analytics_events(trace_id);
