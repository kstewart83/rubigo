/**
 * Virtual Desktop Database Schema
 *
 * SQLite schema for tracking user virtual desktops.
 */

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * Virtual desktops table
 * Tracks desktop instances per user
 */
export const virtualDesktops = sqliteTable("virtual_desktops", {
    /** Unique desktop ID (UUID) */
    id: text("id").primaryKey(),

    /** User who owns this desktop */
    userId: text("user_id").notNull(),

    /** User-friendly name */
    name: text("name").notNull(),

    /** Template used to create this desktop */
    template: text("template").notNull(), // DesktopTemplate

    /** Cloud Hypervisor VM ID (set when VM is created) */
    vmId: text("vm_id"),

    /** VNC port for this desktop */
    vncPort: integer("vnc_port"),

    /** Current status */
    status: text("status").notNull(), // DesktopStatus

    /** ISO 8601 timestamp when created */
    createdAt: text("created_at").notNull(),

    /** ISO 8601 timestamp of last access */
    lastAccessedAt: text("last_accessed_at"),
});

/**
 * Type inference for insert operations
 */
export type VirtualDesktopInsert = typeof virtualDesktops.$inferInsert;

/**
 * Type inference for select operations
 */
export type VirtualDesktopSelect = typeof virtualDesktops.$inferSelect;
