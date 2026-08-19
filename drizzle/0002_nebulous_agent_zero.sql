CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`code` text,
	`name` text NOT NULL,
	`default_price` real DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
