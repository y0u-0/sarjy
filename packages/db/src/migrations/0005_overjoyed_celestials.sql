CREATE TABLE `practice_starting_point` (
	`user_id` text PRIMARY KEY NOT NULL,
	`level` text NOT NULL,
	`source` text NOT NULL,
	`rationale` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
