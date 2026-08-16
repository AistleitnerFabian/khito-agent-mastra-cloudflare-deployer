import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const inboxItems = sqliteTable("inbox_items", {
  id: text("id").primaryKey(),
  sourceType: text("source_type", { enum: ["email", "file_upload"] }).notNull(),
  sourceKey: text("source_key").notNull(),
  name: text("name").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  sender: text("sender"),
  receivedAt: text("received_at").notNull(),
  assigneeId: text("assignee_id"),
  status: text("status", { enum: ["needs_triage", "ready_to_create", "not_a_document"] }).notNull().default("needs_triage"),
  documentId: text("document_id"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, table => [
  uniqueIndex("inbox_items_source_key_unique").on(table.sourceKey),
  index("inbox_items_status_created_at_idx").on(table.status, table.createdAt),
  index("inbox_items_assignee_id_idx").on(table.assigneeId),
]);
