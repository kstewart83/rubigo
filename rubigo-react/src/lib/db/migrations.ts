import { getDb, execute, query } from "./index";

/**
 * Migration definition
 */
interface Migration {
    version: number;
    name: string;
    up: string;
}

/**
 * Available migrations - add new migrations here
 */
const migrations: Migration[] = [
    {
        version: 1,
        name: "create_migrations_table",
        up: `
      CREATE TABLE IF NOT EXISTS _migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT DEFAULT (datetime('now'))
      )
    `,
    },
    // Add module-specific migrations below
    // Example:
    // {
    //   version: 2,
    //   name: "create_personnel_table",
    //   up: `
    //     CREATE TABLE personnel (
    //       id INTEGER PRIMARY KEY AUTOINCREMENT,
    //       first_name TEXT NOT NULL,
    //       last_name TEXT NOT NULL,
    //       email TEXT UNIQUE,
    //       created_at TEXT DEFAULT (datetime('now')),
    //       updated_at TEXT DEFAULT (datetime('now'))
    //     )
    //   `,
    // },
];

/**
 * Get the current database version
 */
function getCurrentVersion(): number {
    try {
        const result = query<{ version: number }>(
            "SELECT MAX(version) as version FROM _migrations"
        );
        return result[0]?.version ?? 0;
    } catch {
        // Table doesn't exist yet
        return 0;
    }
}

/**
 * Run all pending migrations
 */
export function runMigrations(): { applied: string[]; currentVersion: number } {
    const applied: string[] = [];
    const currentVersion = getCurrentVersion();

    const pendingMigrations = migrations.filter(m => m.version > currentVersion);

    for (const migration of pendingMigrations) {
        console.log(`Running migration ${migration.version}: ${migration.name}`);

        // Run the migration
        execute(migration.up);

        // Record the migration
        execute(
            "INSERT INTO _migrations (version, name) VALUES (?, ?)",
            [migration.version, migration.name]
        );

        applied.push(migration.name);
    }

    const newVersion = getCurrentVersion();

    if (applied.length === 0) {
        console.log(`Database is up to date (version ${newVersion})`);
    } else {
        console.log(`Applied ${applied.length} migrations. Now at version ${newVersion}`);
    }

    return { applied, currentVersion: newVersion };
}

/**
 * Reset the database (for development only!)
 */
export function resetDatabase(): void {
    const db = getDb();

    // Get all tables
    const tables = query<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );

    // Drop all tables
    for (const table of tables) {
        execute(`DROP TABLE IF EXISTS ${table.name}`);
    }

    console.log("Database reset complete");
}

export { migrations };
