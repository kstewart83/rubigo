/**
 * Database Clean Script
 * 
 * Wipes all data from the database to enable a clean sync.
 * 
 * Run with: bun run db:clean
 */

import { db } from "./index";
import * as schema from "./schema";

async function clean() {
    console.log("🗑️  Cleaning database...\n");

    // Delete in reverse dependency order
    console.log("   Deleting action logs...");
    await db.delete(schema.actionLogs);

    console.log("   Deleting allocations...");
    await db.delete(schema.allocations);

    console.log("   Deleting assignments...");
    await db.delete(schema.assignments);

    console.log("   Deleting activities...");
    await db.delete(schema.activities);

    console.log("   Deleting initiatives...");
    await db.delete(schema.initiatives);

    console.log("   Deleting KPIs...");
    await db.delete(schema.kpis);

    console.log("   Deleting features...");
    await db.delete(schema.features);

    console.log("   Deleting objectives...");
    await db.delete(schema.objectives);

    console.log("   Deleting metrics...");
    await db.delete(schema.metrics);

    console.log("   Deleting roles...");
    await db.delete(schema.roles);

    console.log("   Deleting projects...");
    await db.delete(schema.projects);

    console.log("   Deleting services...");
    await db.delete(schema.services);

    console.log("\n✅ Database cleaned! All tables are now empty.");
    console.log("   Run 'bun run db:sync' to repopulate from TOML.");
}

clean().catch((err) => {
    console.error("❌ Clean failed:", err);
    process.exit(1);
});
