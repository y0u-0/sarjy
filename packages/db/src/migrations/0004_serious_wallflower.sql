CREATE TABLE `teacher_quality_event` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`conversation_id` text NOT NULL,
	`problem_id` text,
	`event` text NOT NULL,
	`detail` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `teacher_quality_conversation_idx` ON `teacher_quality_event` (`conversation_id`);--> statement-breakpoint
CREATE INDEX `teacher_quality_user_idx` ON `teacher_quality_event` (`user_id`,`created_at`);