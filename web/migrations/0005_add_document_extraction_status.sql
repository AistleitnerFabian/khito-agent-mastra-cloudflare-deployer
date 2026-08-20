ALTER TABLE documents ADD COLUMN extraction_status TEXT NOT NULL DEFAULT 'ready';
ALTER TABLE documents ADD COLUMN extraction_error TEXT;
