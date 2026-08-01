CREATE TABLE `attempt` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`concept` text NOT NULL,
	`sql` text NOT NULL,
	`passed` integer NOT NULL,
	`kind` text,
	`elapsed_ms` integer NOT NULL,
	`ordinal` integer NOT NULL,
	`predicted` text,
	`hint_shown` integer DEFAULT false NOT NULL,
	`gave_up` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `attempt_user_concept_idx` ON `attempt` (`user_id`,`concept`);--> statement-breakpoint
CREATE INDEX `attempt_user_exercise_idx` ON `attempt` (`user_id`,`exercise_id`);--> statement-breakpoint
CREATE TABLE `exercise_unlock` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`concept` text NOT NULL,
	`reason` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `exercise_unlock_user_concept_idx` ON `exercise_unlock` (`user_id`,`concept`);--> statement-breakpoint
CREATE TABLE `session_insight` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`conversation_id` text NOT NULL,
	`concept` text,
	`kind` text NOT NULL,
	`rationale` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `session_insight_user_idx` ON `session_insight` (`user_id`,`concept`);--> statement-breakpoint
CREATE INDEX `session_insight_conversation_idx` ON `session_insight` (`conversation_id`);