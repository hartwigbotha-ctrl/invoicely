CREATE TABLE `subscription_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`subscription_id` text NOT NULL,
	`pf_payment_id` text NOT NULL,
	`payment_status` text NOT NULL,
	`amount_gross` real DEFAULT 0 NOT NULL,
	`raw_payload` text NOT NULL,
	`received_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_payments_pf_payment_id_unique` ON `subscription_payments` (`pf_payment_id`);--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `checkout_reference` text;