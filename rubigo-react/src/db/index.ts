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

// Enable WAL mode for better performance
sqlite.exec("PRAGMA journal_mode = WAL;");

// Create Drizzle instance with schema
export const db = drizzle(sqlite, { schema });

// Export for direct queries if needed
export { sqlite };
