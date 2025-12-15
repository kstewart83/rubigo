import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { Database } from "bun:sqlite";

describe("bun:sqlite", () => {
    let db: Database;

    beforeAll(() => {
        // Use in-memory database for tests
        db = new Database(":memory:");
        db.run("PRAGMA journal_mode = WAL");
        db.run("PRAGMA foreign_keys = ON");
    });

    afterAll(() => {
        db.close();
    });

    test("can create a table", () => {
        db.run(`
      CREATE TABLE test_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE
      )
    `);

        const tables = db
            .query("SELECT name FROM sqlite_master WHERE type='table' AND name='test_users'")
            .all();

        expect(tables).toHaveLength(1);
    });

    test("can insert and query data", () => {
        const insert = db.prepare("INSERT INTO test_users (name, email) VALUES (?, ?)");
        insert.run("John Doe", "john@example.com");
        insert.run("Jane Doe", "jane@example.com");

        const users = db.query("SELECT * FROM test_users").all() as Array<{
            id: number;
            name: string;
            email: string;
        }>;

        expect(users).toHaveLength(2);
        expect(users[0].name).toBe("John Doe");
        expect(users[1].email).toBe("jane@example.com");
    });

    test("can use transactions", () => {
        const insertMany = db.transaction((names: string[]) => {
            const insert = db.prepare("INSERT INTO test_users (name) VALUES (?)");
            for (const name of names) {
                insert.run(name);
            }
            return names.length;
        });

        const count = insertMany(["Alice", "Bob", "Charlie"]);
        expect(count).toBe(3);

        const total = db.query("SELECT COUNT(*) as count FROM test_users").get() as { count: number };
        expect(total.count).toBe(5); // 2 from previous test + 3 new
    });
});
