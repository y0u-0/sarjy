CREATE TABLE `exercise_queue_item` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`concept` text NOT NULL,
	`difficulty` integer NOT NULL,
	`slot` integer,
	`status` text NOT NULL,
	`selection_reason` text NOT NULL,
	`assigned_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`resolved_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exercise_queue_user_exercise_idx` ON `exercise_queue_item` (`user_id`,`exercise_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `exercise_queue_user_slot_idx` ON `exercise_queue_item` (`user_id`,`slot`);--> statement-breakpoint
CREATE INDEX `exercise_queue_user_status_idx` ON `exercise_queue_item` (`user_id`,`status`);