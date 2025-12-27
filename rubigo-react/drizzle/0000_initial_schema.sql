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
CREATE TABLE `action_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`timestamp` text NOT NULL,
	`operation_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`actor_id` text NOT NULL,
	`actor_name` text NOT NULL,
	`request_id` text,
	`changes` text,
	`metadata` text,
	`source` text
);
--> statement-breakpoint
CREATE TABLE `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`parent_id` text,
	`initiative_id` text,
	`blocked_by` text,
	`status` text DEFAULT 'backlog',
	`aco` text DEFAULT '{"sensitivity":"low"}' NOT NULL,
	`sco` text,
	FOREIGN KEY (`initiative_id`) REFERENCES `initiatives`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
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
CREATE TABLE `allocations` (
	`id` text PRIMARY KEY NOT NULL,
	`assignment_id` text NOT NULL,
	`person_id` text NOT NULL,
	`quantity_contributed` real NOT NULL,
	`start_date` text,
	`end_date` text,
	FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`activity_id` text NOT NULL,
	`role_id` text NOT NULL,
	`quantity` real NOT NULL,
	`unit` text DEFAULT 'fte',
	`raci_type` text DEFAULT 'responsible',
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
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
	`participants_add` text,
	`participants_remove` text,
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
	`aco_id` integer,
	`aco` text DEFAULT '{"sensitivity":"low"}' NOT NULL,
	`description_aco` text DEFAULT '{"sensitivity":"low"}',
	`sco` text,
	FOREIGN KEY (`organizer_id`) REFERENCES `personnel`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`aco_id`) REFERENCES `aco_objects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `calendar_participants` (
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
CREATE TABLE `features` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`objective_id` text,
	`status` text DEFAULT 'planned',
	`aco` text DEFAULT '{"sensitivity":"low"}' NOT NULL,
	`sco` text,
	FOREIGN KEY (`objective_id`) REFERENCES `objectives`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `initiatives` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`kpi_id` text,
	`status` text DEFAULT 'planned',
	`start_date` text,
	`end_date` text,
	`aco` text DEFAULT '{"sensitivity":"low"}' NOT NULL,
	`sco` text,
	FOREIGN KEY (`kpi_id`) REFERENCES `kpis`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `kpis` (
	`id` text PRIMARY KEY NOT NULL,
	`metric_id` text NOT NULL,
	`objective_id` text,
	`target_value` real NOT NULL,
	`direction` text NOT NULL,
	`threshold_warning` real,
	`threshold_critical` real,
	FOREIGN KEY (`metric_id`) REFERENCES `metrics`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`objective_id`) REFERENCES `objectives`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`unit` text NOT NULL,
	`current_value` real,
	`source` text
);
--> statement-breakpoint
CREATE TABLE `objectives` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`project_id` text,
	`parent_id` text,
	`status` text DEFAULT 'draft',
	`aco` text DEFAULT '{"sensitivity":"low"}' NOT NULL,
	`sco` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
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
CREATE TABLE `projects` (
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
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text
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
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`solution_id` text NOT NULL,
	`service_level` text,
	FOREIGN KEY (`solution_id`) REFERENCES `solutions`(`id`) ON UPDATE no action ON DELETE no action
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
CREATE TABLE `team_members` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`personnel_id` text NOT NULL,
	`joined_at` text NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`personnel_id`) REFERENCES `personnel`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
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
CREATE TABLE `teams` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_by` text,
	`created_at` text NOT NULL,
	`aco` text DEFAULT '{"sensitivity":"low"}' NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `personnel`(`id`) ON UPDATE no action ON DELETE no action
);
