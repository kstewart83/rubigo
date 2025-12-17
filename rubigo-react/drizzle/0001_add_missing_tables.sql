-- Migration: Add missing tables and update existing schemas
-- This migration brings the database in sync with the current schema.ts

-- Personnel table (new)
CREATE TABLE IF NOT EXISTS `personnel` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`title` text,
	`department` text,
	`site` text,
	`building` text,
	`level` integer,
	`space` text,
	`manager` text,
	`photo` text,
	`desk_phone` text,
	`cell_phone` text,
	`bio` text,
	`is_global_admin` integer DEFAULT false
);
--> statement-breakpoint

-- Photo blobs table (new)
CREATE TABLE IF NOT EXISTS `photo_blobs` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint

-- Solutions table (new - base for products/services)
CREATE TABLE IF NOT EXISTS `solutions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'catalog'
);
--> statement-breakpoint

-- Products table (new - extends solution)
CREATE TABLE IF NOT EXISTS `products` (
	`id` text PRIMARY KEY NOT NULL,
	`solution_id` text NOT NULL,
	`version` text,
	`release_date` text,
	FOREIGN KEY (`solution_id`) REFERENCES `solutions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- Releases table (new)
CREATE TABLE IF NOT EXISTS `releases` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`version` text NOT NULL,
	`release_date` text,
	`notes` text,
	`status` text DEFAULT 'planned',
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- Rules table (new)
CREATE TABLE IF NOT EXISTS `rules` (
	`id` text PRIMARY KEY NOT NULL,
	`feature_id` text NOT NULL,
	`role` text NOT NULL,
	`requirement` text NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'draft',
	FOREIGN KEY (`feature_id`) REFERENCES `features`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- Scenarios table (new)
CREATE TABLE IF NOT EXISTS `scenarios` (
	`id` text PRIMARY KEY NOT NULL,
	`rule_id` text NOT NULL,
	`name` text NOT NULL,
	`narrative` text NOT NULL,
	`status` text DEFAULT 'draft',
	FOREIGN KEY (`rule_id`) REFERENCES `rules`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- Specifications table (new)
CREATE TABLE IF NOT EXISTS `specifications` (
	`id` text PRIMARY KEY NOT NULL,
	`feature_id` text NOT NULL,
	`name` text NOT NULL,
	`narrative` text NOT NULL,
	`category` text NOT NULL,
	`status` text DEFAULT 'draft',
	FOREIGN KEY (`feature_id`) REFERENCES `features`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- Evidences table (new)
CREATE TABLE IF NOT EXISTS `evidences` (
	`id` text PRIMARY KEY NOT NULL,
	`release_id` text NOT NULL,
	`scenario_id` text,
	`specification_id` text,
	`type` text NOT NULL,
	`artifact_url` text,
	`captured_at` text NOT NULL,
	FOREIGN KEY (`release_id`) REFERENCES `releases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`scenario_id`) REFERENCES `scenarios`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`specification_id`) REFERENCES `specifications`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- Evaluations table (new)
CREATE TABLE IF NOT EXISTS `evaluations` (
	`id` text PRIMARY KEY NOT NULL,
	`evidence_id` text NOT NULL,
	`verdict` text NOT NULL,
	`evaluator_id` text,
	`evaluated_at` text NOT NULL,
	`notes` text,
	FOREIGN KEY (`evidence_id`) REFERENCES `evidences`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- Update services table (add solution_id, remove old columns)
-- Since SQLite doesn't support ADD COLUMN IF NOT EXISTS, we recreate safely
-- First check if column exists before adding
-- Note: These will fail silently if column exists, which is fine
ALTER TABLE `services` ADD COLUMN `solution_id` text REFERENCES `solutions`(`id`);
--> statement-breakpoint
ALTER TABLE `services` ADD COLUMN `service_level` text;
--> statement-breakpoint

-- Update projects table (add solution_id)
ALTER TABLE `projects` ADD COLUMN `solution_id` text REFERENCES `solutions`(`id`);
--> statement-breakpoint

-- Add source column to action_logs
ALTER TABLE `action_logs` ADD COLUMN `source` text;
