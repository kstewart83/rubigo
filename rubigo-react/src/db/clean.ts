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
    // Calendar module tables
    console.log("   Deleting calendar deviations...");
    await db.delete(schema.calendarDeviations);

    console.log("   Deleting calendar participants...");
    await db.delete(schema.calendarParticipants);

    console.log("   Deleting calendar events...");
    await db.delete(schema.calendarEvents);

    // Email module tables
    console.log("   Deleting email recipients...");
    await db.delete(schema.emailRecipients);

    console.log("   Deleting emails...");
    await db.delete(schema.emails);

    console.log("   Deleting email threads...");
    await db.delete(schema.emailThreads);

    // Chat module tables
    console.log("   Deleting chat reactions...");
    await db.delete(schema.chatReactions);

    console.log("   Deleting chat messages...");
    await db.delete(schema.chatMessages);

    console.log("   Deleting chat members...");
    await db.delete(schema.chatMembers);

    console.log("   Deleting chat channels...");
    await db.delete(schema.chatChannels);

    // Screen share module
    console.log("   Deleting screen share sessions...");
    await db.delete(schema.screenShareSessions);

    console.log("   Deleting action logs...");
    await db.delete(schema.actionLogs);

    console.log("   Deleting evaluations...");
    await db.delete(schema.evaluations);

    console.log("   Deleting evidences...");
    await db.delete(schema.evidences);

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

    console.log("   Deleting scenarios...");
    await db.delete(schema.scenarios);

    console.log("   Deleting specifications...");
    await db.delete(schema.specifications);

    console.log("   Deleting rules...");
    await db.delete(schema.rules);

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

    console.log("   Deleting releases...");
    await db.delete(schema.releases);

    console.log("   Deleting products...");
    await db.delete(schema.products);

    console.log("   Deleting services...");
    await db.delete(schema.services);

    console.log("   Deleting solutions...");
    await db.delete(schema.solutions);

    console.log("   Deleting personnel (including Global Admin)...");
    await db.delete(schema.personnel);

    console.log("\n✅ Database cleaned! System reset to uninitialized state.");
    console.log("   Run 'bun run start' to begin fresh initialization.");
}

clean().catch((err) => {
    console.error("❌ Clean failed:", err);
    process.exit(1);
});
