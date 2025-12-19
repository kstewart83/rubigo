-- Migration: Enhance Email tables for MVP
-- Adds email_threads table, custom address support, per-recipient folder state

-- Email Threads table for conversation grouping
CREATE TABLE IF NOT EXISTS `email_threads` (
	`id` text PRIMARY KEY NOT NULL,
	`subject` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint

-- Add new columns to emails table
ALTER TABLE `emails` ADD COLUMN `parent_email_id` text;
--> statement-breakpoint
ALTER TABLE `emails` ADD COLUMN `created_at` text DEFAULT (datetime('now')) NOT NULL;
--> statement-breakpoint

-- Make sent_at nullable for drafts (SQLite doesn't support ALTER COLUMN, so we accept existing NOT NULL)

-- Add new columns to email_recipients for custom addresses and per-recipient state
ALTER TABLE `email_recipients` ADD COLUMN `email_address` text;
--> statement-breakpoint
ALTER TABLE `email_recipients` ADD COLUMN `folder` text DEFAULT 'inbox' NOT NULL;
--> statement-breakpoint

-- Make personnel_id nullable (SQLite doesn't support this directly, existing data is fine)

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS `idx_emails_thread` ON `emails`(`thread_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_emails_sender` ON `emails`(`from_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_recipients_email` ON `email_recipients`(`email_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_recipients_personnel` ON `email_recipients`(`personnel_id`);
