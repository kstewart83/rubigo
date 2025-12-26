CREATE TABLE `team_owners` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`personnel_id` text NOT NULL,
	`added_at` text NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`personnel_id`) REFERENCES `personnel`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `team_teams` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_team_id` text NOT NULL,
	`child_team_id` text NOT NULL,
	`added_at` text NOT NULL,
	FOREIGN KEY (`parent_team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`child_team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_calendar_participants` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`personnel_id` text,
	`team_id` text,
	`role` text DEFAULT 'required',
	`added_at` text DEFAULT '2024-01-01T00:00:00Z',
	`added_by` text,
	FOREIGN KEY (`event_id`) REFERENCES `calendar_events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`personnel_id`) REFERENCES `personnel`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`added_by`) REFERENCES `personnel`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_calendar_participants`("id", "event_id", "personnel_id", "team_id", "role", "added_at", "added_by") SELECT "id", "event_id", "personnel_id", "team_id", "role", "added_at", "added_by" FROM `calendar_participants`;--> statement-breakpoint
DROP TABLE `calendar_participants`;--> statement-breakpoint
ALTER TABLE `__new_calendar_participants` RENAME TO `calendar_participants`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `calendar_deviations` ADD `participants_add` text;--> statement-breakpoint
ALTER TABLE `calendar_deviations` ADD `participants_remove` text;