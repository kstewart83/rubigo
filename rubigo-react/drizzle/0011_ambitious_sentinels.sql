CREATE TABLE `agent_events` (
	`id` text PRIMARY KEY NOT NULL,
	`personnel_id` text NOT NULL,
	`timestamp` text NOT NULL,
	`event_type` text NOT NULL,
	`content` text NOT NULL,
	`context_id` text,
	`target_entity` text,
	`parent_event_id` text,
	`metadata` text,
	`aco` text,
	FOREIGN KEY (`personnel_id`) REFERENCES `personnel`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `agent_scheduled_events` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`event_type` text NOT NULL,
	`context_id` text,
	`scheduled_for` text NOT NULL,
	`payload` text,
	`created_at` text NOT NULL,
	`processed_at` text,
	`aco` text,
	FOREIGN KEY (`agent_id`) REFERENCES `personnel`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`context_id`) REFERENCES `sync_contexts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `agent_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`personnel_id` text NOT NULL,
	`token` text NOT NULL,
	`created_at` text NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`personnel_id`) REFERENCES `personnel`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agent_sessions_token_unique` ON `agent_sessions` (`token`);--> statement-breakpoint
CREATE TABLE `calendar_deviations` (
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
CREATE TABLE `calendar_events` (
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
	`organizer_id` text,
	`deleted` integer DEFAULT false,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`aco` text DEFAULT '{"sensitivity":"low"}' NOT NULL,
	`sco` text,
	FOREIGN KEY (`organizer_id`) REFERENCES `personnel`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `calendar_participants` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`personnel_id` text NOT NULL,
	`role` text DEFAULT 'participant',
	FOREIGN KEY (`event_id`) REFERENCES `calendar_events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`personnel_id`) REFERENCES `personnel`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `chat_channels` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`description` text,
	`type` text NOT NULL,
	`created_by` text,
	`created_at` text NOT NULL,
	`aco` text DEFAULT '{"sensitivity":"low"}' NOT NULL,
	`sco` text,
	FOREIGN KEY (`created_by`) REFERENCES `personnel`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `chat_members` (
	`id` text PRIMARY KEY NOT NULL,
	`channel_id` text NOT NULL,
	`personnel_id` text NOT NULL,
	`last_read` text,
	`joined_at` text NOT NULL,
	FOREIGN KEY (`channel_id`) REFERENCES `chat_channels`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`personnel_id`) REFERENCES `personnel`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`channel_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`content` text NOT NULL,
	`thread_id` text,
	`sent_at` text NOT NULL,
	`edited_at` text,
	`deleted` integer DEFAULT false,
	`aco` text DEFAULT '{"sensitivity":"low"}' NOT NULL,
	`sco` text,
	FOREIGN KEY (`channel_id`) REFERENCES `chat_channels`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sender_id`) REFERENCES `personnel`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `chat_reactions` (
	`id` text PRIMARY KEY NOT NULL,
	`message_id` text NOT NULL,
	`personnel_id` text NOT NULL,
	`emoji` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`message_id`) REFERENCES `chat_messages`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`personnel_id`) REFERENCES `personnel`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `classification_guides` (
	`id` text PRIMARY KEY NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`title` text NOT NULL,
	`sensitivity_guidance` text NOT NULL,
	`tenant_guidance` text,
	`role_guidance` text,
	`effective_date` text NOT NULL,
	`status` text DEFAULT 'draft',
	`superseded_by` text,
	`created_at` text NOT NULL,
	`created_by` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `email_recipients` (
	`id` text PRIMARY KEY NOT NULL,
	`email_id` text NOT NULL,
	`personnel_id` text,
	`email_address` text,
	`type` text DEFAULT 'to',
	`folder` text DEFAULT 'inbox',
	`read` integer DEFAULT false,
	FOREIGN KEY (`email_id`) REFERENCES `emails`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`personnel_id`) REFERENCES `personnel`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `email_threads` (
	`id` text PRIMARY KEY NOT NULL,
	`subject` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `emails` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`from_id` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`parent_email_id` text,
	`sent_at` text,
	`is_draft` integer DEFAULT false,
	`created_at` text NOT NULL,
	`aco` text DEFAULT '{"sensitivity":"low"}' NOT NULL,
	`sco` text,
	FOREIGN KEY (`thread_id`) REFERENCES `email_threads`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`from_id`) REFERENCES `personnel`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `evaluations` (
	`id` text PRIMARY KEY NOT NULL,
	`evidence_id` text NOT NULL,
	`verdict` text NOT NULL,
	`evaluator_id` text,
	`evaluated_at` text NOT NULL,
	`notes` text,
	FOREIGN KEY (`evidence_id`) REFERENCES `evidences`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `evidences` (
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
CREATE TABLE `personnel` (
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
	`is_global_admin` integer DEFAULT false,
	`is_agent` integer DEFAULT false,
	`agent_status` text DEFAULT 'dormant',
	`agent_persona` text,
	`clearance_level` text DEFAULT 'low',
	`tenant_clearances` text,
	`access_roles` text DEFAULT '["employee"]',
	`aco` text DEFAULT '{"sensitivity":"low"}' NOT NULL,
	`sco` text
);
--> statement-breakpoint
CREATE TABLE `photo_blobs` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `presentation_slides` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`presentation_id` integer NOT NULL,
	`slide_id` integer NOT NULL,
	`position` integer NOT NULL,
	`vertical_position` integer DEFAULT 0,
	`custom_transition` text,
	FOREIGN KEY (`presentation_id`) REFERENCES `presentations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`slide_id`) REFERENCES `slides`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `presentations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`theme` text DEFAULT 'dark',
	`aspect_ratio` text DEFAULT '16:9',
	`transition` text DEFAULT 'fade',
	`created_by` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`aco` text DEFAULT '{"sensitivity":"low"}' NOT NULL,
	`sco` text,
	FOREIGN KEY (`created_by`) REFERENCES `personnel`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`solution_id` text NOT NULL,
	`version` text,
	`release_date` text,
	FOREIGN KEY (`solution_id`) REFERENCES `solutions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `releases` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`version` text NOT NULL,
	`release_date` text,
	`notes` text,
	`status` text DEFAULT 'planned',
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `rules` (
	`id` text PRIMARY KEY NOT NULL,
	`feature_id` text NOT NULL,
	`role` text NOT NULL,
	`requirement` text NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'draft',
	FOREIGN KEY (`feature_id`) REFERENCES `features`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `scenarios` (
	`id` text PRIMARY KEY NOT NULL,
	`rule_id` text NOT NULL,
	`name` text NOT NULL,
	`narrative` text NOT NULL,
	`status` text DEFAULT 'draft',
	FOREIGN KEY (`rule_id`) REFERENCES `rules`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `screen_share_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`host_id` text NOT NULL,
	`chat_channel_id` text,
	`started_at` text NOT NULL,
	`ended_at` text,
	FOREIGN KEY (`host_id`) REFERENCES `personnel`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`chat_channel_id`) REFERENCES `chat_channels`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `slide_files` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slide_id` integer NOT NULL,
	`file_id` text NOT NULL,
	`caption` text,
	`display_order` integer DEFAULT 0,
	FOREIGN KEY (`slide_id`) REFERENCES `slides`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `slides` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text,
	`layout` text DEFAULT 'content',
	`content_json` text DEFAULT '{}' NOT NULL,
	`notes` text,
	`created_by` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`aco` text DEFAULT '{"sensitivity":"low"}' NOT NULL,
	`sco` text,
	FOREIGN KEY (`created_by`) REFERENCES `personnel`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `solutions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'catalog',
	`aco` text DEFAULT '{"sensitivity":"low"}' NOT NULL,
	`sco` text
);
--> statement-breakpoint
CREATE TABLE `specifications` (
	`id` text PRIMARY KEY NOT NULL,
	`feature_id` text NOT NULL,
	`name` text NOT NULL,
	`narrative` text NOT NULL,
	`category` text NOT NULL,
	`status` text DEFAULT 'draft',
	FOREIGN KEY (`feature_id`) REFERENCES `features`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sync_context_participants` (
	`id` text PRIMARY KEY NOT NULL,
	`context_id` text NOT NULL,
	`personnel_id` text NOT NULL,
	`joined_at` text NOT NULL,
	`left_at` text,
	FOREIGN KEY (`context_id`) REFERENCES `sync_contexts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`personnel_id`) REFERENCES `personnel`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sync_contexts` (
	`id` text PRIMARY KEY NOT NULL,
	`context_type` text NOT NULL,
	`reaction_tier` text NOT NULL,
	`related_entity_id` text,
	`started_at` text NOT NULL,
	`ended_at` text
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`solution_id` text,
	`status` text DEFAULT 'planning',
	`start_date` text,
	`end_date` text,
	`aco` text DEFAULT '{"sensitivity":"low"}' NOT NULL,
	`sco` text,
	FOREIGN KEY (`solution_id`) REFERENCES `solutions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_projects`("id", "name", "description", "solution_id", "status", "start_date", "end_date", "aco", "sco") SELECT "id", "name", "description", "solution_id", "status", "start_date", "end_date", "aco", "sco" FROM `projects`;--> statement-breakpoint
DROP TABLE `projects`;--> statement-breakpoint
ALTER TABLE `__new_projects` RENAME TO `projects`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `action_logs` ADD `source` text;--> statement-breakpoint
ALTER TABLE `activities` ADD `aco` text DEFAULT '{"sensitivity":"low"}' NOT NULL;--> statement-breakpoint
ALTER TABLE `activities` ADD `sco` text;--> statement-breakpoint
ALTER TABLE `features` ADD `aco` text DEFAULT '{"sensitivity":"low"}' NOT NULL;--> statement-breakpoint
ALTER TABLE `features` ADD `sco` text;--> statement-breakpoint
ALTER TABLE `initiatives` ADD `aco` text DEFAULT '{"sensitivity":"low"}' NOT NULL;--> statement-breakpoint
ALTER TABLE `initiatives` ADD `sco` text;--> statement-breakpoint
ALTER TABLE `objectives` ADD `aco` text DEFAULT '{"sensitivity":"low"}' NOT NULL;--> statement-breakpoint
ALTER TABLE `objectives` ADD `sco` text;--> statement-breakpoint
ALTER TABLE `services` ADD `solution_id` text NOT NULL REFERENCES solutions(id);--> statement-breakpoint
ALTER TABLE `services` ADD `service_level` text;--> statement-breakpoint
ALTER TABLE `services` DROP COLUMN `description`;--> statement-breakpoint
ALTER TABLE `services` DROP COLUMN `status`;--> statement-breakpoint
ALTER TABLE `services` DROP COLUMN `is_product`;--> statement-breakpoint
ALTER TABLE `services` DROP COLUMN `is_service`;