/**
 * Bun-native Database Migration Script
 * 
 * Uses drizzle-orm/bun-sqlite/migrator instead of drizzle-kit migrate
 * to avoid the better-sqlite3 Node.js dependency.
 * 
 * Usage: DATABASE_URL=/path/to/db.db bun run src/scripts/migrate.ts
 */

import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";

const DB_PATH = process.env.DATABASE_URL || "./rubigo.db";

console.log(`[migrate] Connecting to database: ${DB_PATH}`);

// Create database if it doesn't exist
const sqlite = new Database(DB_PATH, { create: true });

// Enable WAL mode and busy timeout
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA busy_timeout = 60000;");

const db = drizzle(sqlite);

console.log("[migrate] Running migrations from ./drizzle...");

try {
    migrate(db, { migrationsFolder: "./drizzle" });
    console.log("[migrate] ✅ Migrations complete");
} catch (error) {
    console.error("[migrate] ❌ Migration failed:", error);
    process.exit(1);
} finally {
    sqlite.close();
}
