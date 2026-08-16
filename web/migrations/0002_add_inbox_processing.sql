ALTER TABLE inbox_items ADD COLUMN processing_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE inbox_items ADD COLUMN processing_error TEXT;
ALTER TABLE inbox_items ADD COLUMN extraction_key TEXT;
ALTER TABLE inbox_items ADD COLUMN processed_at TEXT;
