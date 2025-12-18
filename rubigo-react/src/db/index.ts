/**
 * Database Connection
 * 
 * Uses Bun's built-in SQLite driver with Drizzle ORM.
 */

import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import * as schema from "./schema";

// Database file location
const DB_PATH = process.env.DATABASE_URL || "./rubigo.db";

// Create SQLite connection using Bun's native driver
const sqlite = new Database(DB_PATH);

// Enable WAL mode for better concurrent access
sqlite.exec("PRAGMA journal_mode = WAL;");

// Set busy timeout to wait up to 5 seconds when database is locked
// This is essential for Next.js builds where multiple workers access the db
sqlite.exec("PRAGMA busy_timeout = 5000;");

// Create Drizzle instance with schema
export const db = drizzle(sqlite, { schema });

// Export for direct queries if needed
export { sqlite };
