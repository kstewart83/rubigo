-- Migration: Add presentation tables
-- Created by: wip-merge presentation branch

CREATE TABLE `slides` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `title` text,
    `layout` text DEFAULT 'content',
    `content_json` text DEFAULT '{}' NOT NULL,
    `notes` text,
    `created_by` text REFERENCES `personnel`(`id`),
    `created_at` text NOT NULL,
    `updated_at` text NOT NULL,
    `aco` text DEFAULT '{\"sensitivity\":\"low\"}' NOT NULL,
    `sco` text
);
--> statement-breakpoint

CREATE TABLE `presentations` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `title` text NOT NULL,
    `description` text,
    `theme` text DEFAULT 'dark',
    `aspect_ratio` text DEFAULT '16:9',
    `transition` text DEFAULT 'fade',
    `created_by` text REFERENCES `personnel`(`id`),
    `created_at` text NOT NULL,
    `updated_at` text NOT NULL,
    `aco` text DEFAULT '{\"sensitivity\":\"low\"}' NOT NULL,
    `sco` text
);
--> statement-breakpoint

CREATE TABLE `presentation_slides` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `presentation_id` integer NOT NULL REFERENCES `presentations`(`id`) ON DELETE CASCADE,
    `slide_id` integer NOT NULL REFERENCES `slides`(`id`),
    `position` integer NOT NULL,
    `vertical_position` integer DEFAULT 0,
    `custom_transition` text
);
--> statement-breakpoint

CREATE TABLE `slide_files` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `slide_id` integer NOT NULL REFERENCES `slides`(`id`) ON DELETE CASCADE,
    `file_id` text NOT NULL,
    `caption` text,
    `display_order` integer DEFAULT 0
);
