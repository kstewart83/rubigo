/**
 * Database Connection
 * 
 * Uses Bun's built-in SQLite driver with Drizzle ORM.
 * 
 * IMPORTANT: Uses lazy initialization to avoid SQLite lock errors during
 * Next.js build. The database connection is only created when first accessed,
 * not at module import time. This prevents 7+ build workers from all trying
 * to connect simultaneously at module evaluation.
 */

import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import * as schema from "./schema";

// Database file location
const DB_PATH = process.env.DATABASE_URL || "./rubigo.db";

// Lazy-initialized database instances
let sqlite: Database | null = null;
let drizzleDb: ReturnType<typeof drizzle> | null = null;

/**
 * Get or create the SQLite database connection.
 * Uses lazy initialization to avoid build-time lock conflicts.
 */
function getSqlite(): Database {
    if (!sqlite) {
        sqlite = new Database(DB_PATH);

        // Enable WAL mode for better concurrent access
        sqlite.exec("PRAGMA journal_mode = WAL;");

        // Set busy timeout to wait up to 60 seconds when database is locked
        // This is essential for Next.js builds where 7+ workers access the db concurrently
        sqlite.exec("PRAGMA busy_timeout = 60000;");
    }
    return sqlite;
}

/**
 * Get or create the Drizzle ORM instance.
 * Uses lazy initialization to avoid build-time lock conflicts.
 */
function getDrizzle() {
    if (!drizzleDb) {
        drizzleDb = drizzle(getSqlite(), { schema });
    }
    return drizzleDb;
}

// Export a proxy that lazily initializes the database
// This allows imports to succeed without triggering a connection
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
    get(_, prop) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (getDrizzle() as any)[prop];
    },
});

// Export sqlite getter for direct queries if needed
export { getSqlite as sqlite };
