CREATE TABLE `inbox_items` (
  `id` TEXT PRIMARY KEY NOT NULL,
  `source_type` TEXT NOT NULL,
  `source_key` TEXT NOT NULL,
  `name` TEXT NOT NULL,
  `content_type` TEXT NOT NULL,
  `size` INTEGER NOT NULL,
  `sender` TEXT,
  `received_at` TEXT NOT NULL,
  `assignee_id` TEXT,
  `status` TEXT NOT NULL DEFAULT 'needs_triage',
  `document_id` TEXT,
  `created_at` TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX `inbox_items_source_key_unique` ON `inbox_items` (`source_key`);
CREATE INDEX `inbox_items_status_created_at_idx` ON `inbox_items` (`status`, `created_at`);
CREATE INDEX `inbox_items_assignee_id_idx` ON `inbox_items` (`assignee_id`);
