-- Migration: Add Access Control columns to Chat and Initiatives tables
-- These were missing from 0004_add_access_control.sql

-- Chat Channels ACL columns
ALTER TABLE `chat_channels` ADD COLUMN `aco` text DEFAULT '{"sensitivity":"low"}' NOT NULL;
--> statement-breakpoint
ALTER TABLE `chat_channels` ADD COLUMN `sco` text;
--> statement-breakpoint

-- Chat Messages ACL columns
ALTER TABLE `chat_messages` ADD COLUMN `aco` text DEFAULT '{"sensitivity":"low"}' NOT NULL;
--> statement-breakpoint
ALTER TABLE `chat_messages` ADD COLUMN `sco` text;
--> statement-breakpoint

-- Initiatives ACL columns (already in schema but missing from migration)
ALTER TABLE `initiatives` ADD COLUMN `aco` text DEFAULT '{"sensitivity":"low"}' NOT NULL;
--> statement-breakpoint
ALTER TABLE `initiatives` ADD COLUMN `sco` text;
