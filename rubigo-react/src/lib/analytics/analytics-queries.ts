/**
 * Analytics Queries for DuckDB
 * 
 * OLAP queries for the analytics dashboard.
 * Uses DuckDB's analytical capabilities for efficient aggregations.
 * 
 * Note: DuckDB uses different date functions than SQLite.
 * Use `current_timestamp - INTERVAL '1 day'` instead of `datetime('now', '-1 day')`.
 */

import { query, queryOne } from '@/lib/db/duckdb-client';

// Query time ranges
export type TimeRange = '1h' | '24h' | '7d' | '30d';

function getTimeRangeInterval(range: TimeRange): string {
  const intervals: Record<TimeRange, string> = {
    '1h': "INTERVAL '1 hour'",
    '24h': "INTERVAL '1 day'",
    '7d': "INTERVAL '7 days'",
    '30d': "INTERVAL '30 days'",
  };
  return intervals[range];
}

/**
 * Get trace latency percentiles by route
 */
export interface RouteLatency {
  route: string;
  p50: number;
  p95: number;
  p99: number;
  avg: number;
  count: number;
}

export async function getTraceLatencyPercentiles(
  range: TimeRange = '24h'
): Promise<RouteLatency[]> {
  const interval = getTimeRangeInterval(range);

  return query<RouteLatency>(`
    SELECT 
      name AS route,
      PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY duration_ns / 1000000.0) AS p50,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ns / 1000000.0) AS p95,
      PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ns / 1000000.0) AS p99,
      AVG(duration_ns / 1000000.0) AS avg,
      COUNT(*) AS count
    FROM rubigo.otel_spans
    WHERE created_at >= current_timestamp - ${interval}
      AND kind = 1
    GROUP BY name
    ORDER BY count DESC
    LIMIT 20
  `);
}

/**
 * Get Web Vitals summary
 */
export interface WebVitalsSummary {
  name: string;
  p50: number;
  p75: number;
  p95: number;
  good_pct: number;
  needs_improvement_pct: number;
  poor_pct: number;
  count: number;
}

export async function getWebVitalsSummary(
  range: TimeRange = '24h'
): Promise<WebVitalsSummary[]> {
  const interval = getTimeRangeInterval(range);

  return query<WebVitalsSummary>(`
    SELECT 
      REPLACE(name, 'web_vital.', '') AS name,
      PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY value) AS p50,
      PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY value) AS p75,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value) AS p95,
      COUNT(*) FILTER (WHERE JSON_EXTRACT_STRING(attributes, '$.rating') = 'good') * 100.0 / COUNT(*) AS good_pct,
      COUNT(*) FILTER (WHERE JSON_EXTRACT_STRING(attributes, '$.rating') = 'needs-improvement') * 100.0 / COUNT(*) AS needs_improvement_pct,
      COUNT(*) FILTER (WHERE JSON_EXTRACT_STRING(attributes, '$.rating') = 'poor') * 100.0 / COUNT(*) AS poor_pct,
      COUNT(*) AS count
    FROM rubigo.otel_metrics
    WHERE created_at >= current_timestamp - ${interval}
      AND name LIKE 'web_vital.%'
    GROUP BY name
    ORDER BY name
  `);
}

/**
 * Get error rate by route
 */
export interface RouteErrorRate {
  route: string;
  total: number;
  errors: number;
  error_pct: number;
}

export async function getErrorRateByRoute(
  range: TimeRange = '24h'
): Promise<RouteErrorRate[]> {
  const interval = getTimeRangeInterval(range);

  return query<RouteErrorRate>(`
    SELECT 
      name AS route,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status_code = 2) AS errors,
      ROUND(COUNT(*) FILTER (WHERE status_code = 2) * 100.0 / COUNT(*), 2) AS error_pct
    FROM rubigo.otel_spans
    WHERE created_at >= current_timestamp - ${interval}
      AND kind = 1
    GROUP BY name
    HAVING COUNT(*) >= 5
    ORDER BY error_pct DESC
    LIMIT 20
  `);
}

/**
 * Get active sessions count
 */
export async function getActiveSessions(
  range: TimeRange = '1h'
): Promise<number> {
  const interval = getTimeRangeInterval(range);

  // SQLite stores timestamps as 'YYYY-MM-DD HH:MM:SS' in UTC (no timezone)
  // DuckDB current_timestamp has local timezone offset
  // Convert cutoff to UTC naive timestamp for comparison
  const result = await queryOne<{ count: number }>(`
    SELECT COUNT(DISTINCT session_id) AS count
    FROM rubigo.analytics_events
    WHERE created_at >= ((current_timestamp AT TIME ZONE 'UTC') - ${interval})::TIMESTAMP
      AND session_id IS NOT NULL
  `);

  return result?.count ?? 0;
}

/**
 * Get feature usage by module
 */
export interface ModuleUsage {
  module: string;
  event_count: number;
  unique_sessions: number;
}

export async function getFeatureUsageByModule(
  range: TimeRange = '24h'
): Promise<ModuleUsage[]> {
  const interval = getTimeRangeInterval(range);

  return query<ModuleUsage>(`
    SELECT 
      SPLIT_PART(event_name, '.', 1) AS module,
      COUNT(*) AS event_count,
      COUNT(DISTINCT session_id) AS unique_sessions
    FROM rubigo.analytics_events
    WHERE created_at >= current_timestamp - ${interval}
      AND event_type = 'feature'
    GROUP BY module
    ORDER BY event_count DESC
  `);
}

/**
 * Get overview stats for dashboard
 */
export interface OverviewStats {
  active_sessions: number;
  total_requests: number;
  error_rate: number;
  avg_response_time: number;
}

export async function getOverviewStats(
  range: TimeRange = '24h'
): Promise<OverviewStats> {
  const interval = getTimeRangeInterval(range);

  const result = await queryOne<OverviewStats>(`
    WITH spans AS (
      SELECT 
        status_code,
        duration_ns
      FROM rubigo.otel_spans
      WHERE created_at >= current_timestamp - ${interval}
        AND kind = 1
    ),
    sessions AS (
      SELECT COUNT(DISTINCT session_id) AS active_sessions
      FROM rubigo.analytics_events
      WHERE created_at >= current_timestamp - ${interval}
        AND session_id IS NOT NULL
    )
    SELECT 
      COALESCE(sessions.active_sessions, 0) as active_sessions,
      COUNT(*) AS total_requests,
      ROUND(COALESCE(COUNT(*) FILTER (WHERE status_code = 2) * 100.0 / NULLIF(COUNT(*), 0), 0), 2) AS error_rate,
      ROUND(COALESCE(AVG(duration_ns / 1000000.0), 0), 2) AS avg_response_time
    FROM spans, sessions
    GROUP BY sessions.active_sessions
  `);

  return result ?? {
    active_sessions: 0,
    total_requests: 0,
    error_rate: 0,
    avg_response_time: 0,
  };
}

/**
 * Get top pages by views
 */
export interface PageViews {
  path: string;
  views: number;
  unique_sessions: number;
}

export async function getTopPages(
  range: TimeRange = '24h',
  limit = 10
): Promise<PageViews[]> {
  const interval = getTimeRangeInterval(range);

  return query<PageViews>(`
    SELECT 
      event_name AS path,
      COUNT(*) AS views,
      COUNT(DISTINCT session_id) AS unique_sessions
    FROM rubigo.analytics_events
    WHERE created_at >= current_timestamp - ${interval}
      AND event_type = 'page_view'
    GROUP BY event_name
    ORDER BY views DESC
    LIMIT ${limit}
  `);
}
