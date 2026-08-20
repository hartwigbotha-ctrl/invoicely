ALTER TABLE `items` ADD `description` text;--> statement-breakpoint
ALTER TABLE `items` ADD `cost` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `items` ADD `unit_type` text;--> statement-breakpoint
ALTER TABLE `items` ADD `taxable` integer DEFAULT true NOT NULL;