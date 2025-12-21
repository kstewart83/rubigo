/**
 * DuckDB Client for Analytics
 * 
 * Provides OLAP query capabilities by attaching to SQLite in read-only mode.
 * Uses the Duck Lake pattern: SQLite for OLTP, DuckDB for OLAP.
 */

import { DuckDBInstance } from '@duckdb/node-api';
import type { DuckDBConnection } from '@duckdb/node-api';
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
 * Initialize DuckDB and attach SQLite database
 */
async function initDuckDB(): Promise<DuckDBConnection> {
    if (connection) return connection;

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
