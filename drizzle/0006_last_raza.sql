CREATE TABLE `document_imports` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`file_name` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`doc_type` text DEFAULT 'invoice' NOT NULL,
	`extracted_json` text NOT NULL,
	`matched_client_id` text,
	`created_invoice_id` text,
	`created_quote_id` text,
	`error_message` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`matched_client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_quote_id`) REFERENCES `quotes`(`id`) ON UPDATE no action ON DELETE set null
);
