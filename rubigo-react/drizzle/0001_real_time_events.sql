-- Real-time Events System
-- Session Events: SSE event delivery with catch-up support
-- User Presence: Online/away/offline status tracking

CREATE TABLE `session_events` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`event_type` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` text NOT NULL,
	`acked_at` text
);
--> statement-breakpoint
CREATE TABLE `user_presence` (
	`personnel_id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`status` text DEFAULT 'online' NOT NULL,
	`last_seen` text NOT NULL,
	FOREIGN KEY (`personnel_id`) REFERENCES `personnel`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_user_presence_status` ON `user_presence` (`status`);
