CREATE TABLE `aco_objects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hash` text NOT NULL,
	`sensitivity` text NOT NULL,
	`tenants` text DEFAULT '[]' NOT NULL,
	`roles` text DEFAULT '[]' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `aco_objects_hash_unique` ON `aco_objects` (`hash`);--> statement-breakpoint
CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `secure_descriptions` (
	`parent_type` text NOT NULL,
	`parent_id` text NOT NULL,
	`aco_id` integer NOT NULL,
	`content` text NOT NULL,
	PRIMARY KEY(`parent_type`, `parent_id`),
	FOREIGN KEY (`aco_id`) REFERENCES `aco_objects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `security_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`personnel_id` text,
	`session_level` text NOT NULL,
	`active_tenants` text DEFAULT '[]' NOT NULL,
	`validated_aco_ids` text DEFAULT '[]' NOT NULL,
	`highest_aco_id` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`personnel_id`) REFERENCES `personnel`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `calendar_events` ADD `description_aco` text DEFAULT '{"sensitivity":"low"}';