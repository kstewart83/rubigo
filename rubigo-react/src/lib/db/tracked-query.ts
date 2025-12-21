/**
 * Tracked Query Wrapper
 * 
 * Wraps database queries in OpenTelemetry spans for performance monitoring.
 * Use this for important query operations that you want to trace.
 */

import { trace, SpanStatusCode, context } from '@opentelemetry/api';

const tracer = trace.getTracer('drizzle-orm');

/**
 * Execute a database operation within an OpenTelemetry span.
 * 
 * @param name - Operation name (e.g., 'personnel.list', 'calendar.getEvents')
 * @param fn - Async function containing the database operation
 * @returns The result of the database operation
 * 
 * @example
 * const users = await trackedQuery('personnel.list', async () => {
 *   return db.select().from(personnel).limit(100);
 * });
 */
export async function trackedQuery<T>(
    name: string,
    fn: () => Promise<T>
): Promise<T> {
    // If OTel is not initialized, just run the function
    if (!tracer) {
        return fn();
    }

    return tracer.startActiveSpan(`db.${name}`, async (span) => {
        try {
            const startTime = performance.now();
            const result = await fn();
            const duration = performance.now() - startTime;

            span.setAttribute('db.operation', name);
            span.setAttribute('db.duration_ms', duration);
            span.setStatus({ code: SpanStatusCode.OK });

            return result;
        } catch (error) {
            span.setStatus({
                code: SpanStatusCode.ERROR,
                message: error instanceof Error ? error.message : String(error),
            });
            span.recordException(error as Error);
            throw error;
        } finally {
            span.end();
        }
    });
}

/**
 * Create a traced database wrapper for a specific category of operations.
 * 
 * @param category - The category name (e.g., 'personnel', 'calendar')
 * @returns A function that traces operations within that category
 * 
 * @example
 * const tracePersonnel = createTracedDb('personnel');
 * const users = await tracePersonnel('list', () => db.select().from(personnel));
 */
export function createTracedDb(category: string) {
    return async function <T>(operation: string, fn: () => Promise<T>): Promise<T> {
        return trackedQuery(`${category}.${operation}`, fn);
    };
}
