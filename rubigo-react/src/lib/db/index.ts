import { Database, type SQLQueryBindings } from "bun:sqlite";
import { join } from "path";

// Type alias for SQL parameters
type SQLParams = SQLQueryBindings[];

// Database file path - stored in project root
const DB_PATH = join(process.cwd(), "rubigo.db");

// Singleton database instance
let db: Database | null = null;

/**
 * Get the database instance (creates if not exists)
 */
export function getDb(): Database {
    if (!db) {
        db = new Database(DB_PATH, { create: true });

        // Enable WAL mode for better concurrency (multiple readers, one writer)
        db.run("PRAGMA journal_mode = WAL");

        // Enable foreign key constraints
        db.run("PRAGMA foreign_keys = ON");

        // Set busy timeout to 5 seconds
        db.run("PRAGMA busy_timeout = 5000");
    }
    return db;
}

/**
 * Close the database connection
 */
export function closeDb(): void {
    if (db) {
        db.close();
        db = null;
    }
}

/**
 * Execute a query that returns multiple rows
 */
export function query<T>(sql: string, params?: SQLParams): T[] {
    const stmt = getDb().prepare(sql);
    return params ? stmt.all(...params) as T[] : stmt.all() as T[];
}

/**
 * Execute a query that returns a single row
 */
export function queryOne<T>(sql: string, params?: SQLParams): T | null {
    const stmt = getDb().prepare(sql);
    const result = params ? stmt.get(...params) : stmt.get();
    return (result as T) ?? null;
}

/**
 * Execute a statement (INSERT, UPDATE, DELETE)
 */
export function execute(sql: string, params?: SQLParams): void {
    const stmt = getDb().prepare(sql);
    if (params) {
        stmt.run(...params);
    } else {
        stmt.run();
    }
}

/**
 * Run multiple statements in a transaction
 */
export function transaction<T>(fn: () => T): T {
    const database = getDb();
    return database.transaction(fn)();
}

// Export types for external use
export type { Database, SQLParams };
