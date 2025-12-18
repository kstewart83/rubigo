-- Migration: Add Collaboration module tables
-- This migration adds the Calendar, Chat, Email, and Screen Share tables
-- that were missing from the production database after the Collaboration module merge

-- Calendar Events table
CREATE TABLE IF NOT EXISTS `calendar_events` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`all_day` integer DEFAULT false,
	`event_type` text DEFAULT 'meeting',
	`recurrence` text DEFAULT 'none',
	`recurrence_interval` integer DEFAULT 1,
	`recurrence_days` text,
	`recurrence_until` text,
	`timezone` text DEFAULT 'America/New_York',
	`location` text,
	`virtual_url` text,
	`organizer_id` text REFERENCES `personnel`(`id`),
	`deleted` integer DEFAULT false,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint

-- Calendar Participants table
CREATE TABLE IF NOT EXISTS `calendar_participants` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`personnel_id` text NOT NULL,
	`role` text DEFAULT 'participant',
	FOREIGN KEY (`event_id`) REFERENCES `calendar_events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`personnel_id`) REFERENCES `personnel`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- Calendar Deviations table (exceptions for recurring events)
CREATE TABLE IF NOT EXISTS `calendar_deviations` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`original_date` text,
	`new_date` text,
	`cancelled` integer DEFAULT false,
	`override_start_time` text,
	`override_end_time` text,
	`override_title` text,
	`override_description` text,
	`override_location` text,
	`override_timezone` text,
	FOREIGN KEY (`event_id`) REFERENCES `calendar_events`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- Emails table
CREATE TABLE IF NOT EXISTS `emails` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`from_id` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`sent_at` text NOT NULL,
	`folder` text DEFAULT 'inbox',
	`is_draft` integer DEFAULT false,
	FOREIGN KEY (`from_id`) REFERENCES `personnel`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- Email Recipients table
CREATE TABLE IF NOT EXISTS `email_recipients` (
	`id` text PRIMARY KEY NOT NULL,
	`email_id` text NOT NULL,
	`personnel_id` text NOT NULL,
	`type` text DEFAULT 'to',
	`read` integer DEFAULT false,
	FOREIGN KEY (`email_id`) REFERENCES `emails`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`personnel_id`) REFERENCES `personnel`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- Chat Channels table
CREATE TABLE IF NOT EXISTS `chat_channels` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`description` text,
	`type` text NOT NULL,
	`created_by` text REFERENCES `personnel`(`id`),
	`created_at` text NOT NULL
);
--> statement-breakpoint

-- Chat Members table
CREATE TABLE IF NOT EXISTS `chat_members` (
	`id` text PRIMARY KEY NOT NULL,
	`channel_id` text NOT NULL,
	`personnel_id` text NOT NULL,
	`last_read` text,
	`joined_at` text NOT NULL,
	FOREIGN KEY (`channel_id`) REFERENCES `chat_channels`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`personnel_id`) REFERENCES `personnel`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- Chat Messages table
CREATE TABLE IF NOT EXISTS `chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`channel_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`content` text NOT NULL,
	`thread_id` text,
	`sent_at` text NOT NULL,
	`edited_at` text,
	`deleted` integer DEFAULT false,
	FOREIGN KEY (`channel_id`) REFERENCES `chat_channels`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sender_id`) REFERENCES `personnel`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- Chat Reactions table
CREATE TABLE IF NOT EXISTS `chat_reactions` (
	`id` text PRIMARY KEY NOT NULL,
	`message_id` text NOT NULL,
	`personnel_id` text NOT NULL,
	`emoji` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`message_id`) REFERENCES `chat_messages`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`personnel_id`) REFERENCES `personnel`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- Screen Share Sessions table
CREATE TABLE IF NOT EXISTS `screen_share_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`host_id` text NOT NULL,
	`chat_channel_id` text REFERENCES `chat_channels`(`id`),
	`started_at` text NOT NULL,
	`ended_at` text,
	FOREIGN KEY (`host_id`) REFERENCES `personnel`(`id`) ON UPDATE no action ON DELETE no action
);
