CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  inbox_item_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  document_type TEXT NOT NULL,
  assignee TEXT,
  data TEXT NOT NULL,
  bounds TEXT NOT NULL,
  page_count INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX documents_created_at_idx ON documents (created_at);
