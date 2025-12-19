-- Migration: Add Access Control columns
-- Adds clearance_level, aco, sco columns to entities per ABAC model

-- Personnel ACL columns
ALTER TABLE `personnel` ADD COLUMN `clearance_level` text DEFAULT 'low';
--> statement-breakpoint
ALTER TABLE `personnel` ADD COLUMN `tenant_clearances` text;
--> statement-breakpoint
ALTER TABLE `personnel` ADD COLUMN `access_roles` text DEFAULT '["employee"]';
--> statement-breakpoint
ALTER TABLE `personnel` ADD COLUMN `aco` text DEFAULT '{"sensitivity":"low"}' NOT NULL;
--> statement-breakpoint
ALTER TABLE `personnel` ADD COLUMN `sco` text;
--> statement-breakpoint

-- Solutions ACL columns
ALTER TABLE `solutions` ADD COLUMN `aco` text DEFAULT '{"sensitivity":"low"}' NOT NULL;
--> statement-breakpoint
ALTER TABLE `solutions` ADD COLUMN `sco` text;
--> statement-breakpoint

-- Projects ACL columns
ALTER TABLE `projects` ADD COLUMN `aco` text DEFAULT '{"sensitivity":"low"}' NOT NULL;
--> statement-breakpoint
ALTER TABLE `projects` ADD COLUMN `sco` text;
--> statement-breakpoint

-- Objectives ACL columns
ALTER TABLE `objectives` ADD COLUMN `aco` text DEFAULT '{"sensitivity":"low"}' NOT NULL;
--> statement-breakpoint
ALTER TABLE `objectives` ADD COLUMN `sco` text;
--> statement-breakpoint

-- Features ACL columns
ALTER TABLE `features` ADD COLUMN `aco` text DEFAULT '{"sensitivity":"low"}' NOT NULL;
--> statement-breakpoint
ALTER TABLE `features` ADD COLUMN `sco` text;
--> statement-breakpoint

-- Activities ACL columns
ALTER TABLE `activities` ADD COLUMN `aco` text DEFAULT '{"sensitivity":"low"}' NOT NULL;
--> statement-breakpoint
ALTER TABLE `activities` ADD COLUMN `sco` text;
--> statement-breakpoint

-- Calendar Events ACL columns
ALTER TABLE `calendar_events` ADD COLUMN `aco` text DEFAULT '{"sensitivity":"low"}' NOT NULL;
--> statement-breakpoint
ALTER TABLE `calendar_events` ADD COLUMN `sco` text;
--> statement-breakpoint

-- Emails ACL columns (already has createdAt from 0003, just adds ACL)
ALTER TABLE `emails` ADD COLUMN `aco` text DEFAULT '{"sensitivity":"low"}' NOT NULL;
--> statement-breakpoint
ALTER TABLE `emails` ADD COLUMN `sco` text;
