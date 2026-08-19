import { desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { documentTypes, type DocumentType } from "./inbox";

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
  processingStatus: text("processing_status", { enum: ["pending", "processing", "completed", "failed"] }).notNull().default("pending"),
  processingError: text("processing_error"),
  extractionKey: text("extraction_key"),
  documentType: text("document_type", { enum: documentTypes }),
  processedAt: text("processed_at"),
  documentId: text("document_id"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, table => [
  uniqueIndex("inbox_items_source_key_unique").on(table.sourceKey),
  index("inbox_items_status_created_at_idx").on(table.status, table.createdAt),
  index("inbox_items_assignee_id_idx").on(table.assigneeId),
]);

export function createInboxDatabase(binding: D1Database) {
  return drizzle(binding, { schema: { inboxItems } });
}

export type InboxDatabase = ReturnType<typeof createInboxDatabase>;
export type InboxItem = typeof inboxItems.$inferSelect;
type NewInboxItem = typeof inboxItems.$inferInsert;

export function listInboxItems(database: InboxDatabase) {
  return database.select().from(inboxItems).orderBy(desc(inboxItems.createdAt)).all();
}

export async function createInboxItem(database: InboxDatabase, item: NewInboxItem) {
  await database.insert(inboxItems).values(item).run();
  return item;
}

export function findInboxItem(database: InboxDatabase, id: string) {
  return database.select().from(inboxItems).where(eq(inboxItems.id, id)).get();
}

export async function markInboxItemProcessing(database: InboxDatabase, id: string) {
  const updatedAt = new Date().toISOString();

  await database.update(inboxItems).set({
    processingStatus: "processing",
    processingError: null,
    updatedAt,
  }).where(eq(inboxItems.id, id)).run();
}

export async function completeInboxItemProcessing(database: InboxDatabase, id: string, extractionKey: string, documentType: DocumentType) {
  const processedAt = new Date().toISOString();

  await database.update(inboxItems).set({
    processingStatus: "completed",
    extractionKey,
    documentType,
    processedAt,
    updatedAt: processedAt,
  }).where(eq(inboxItems.id, id)).run();
}

export async function failInboxItemProcessing(database: InboxDatabase, id: string, error: string) {
  const updatedAt = new Date().toISOString();

  await database.update(inboxItems).set({
    processingStatus: "failed",
    processingError: error,
    updatedAt,
  }).where(eq(inboxItems.id, id)).run();
}

export async function retryInboxItemProcessing(database: InboxDatabase, id: string) {
  const updatedAt = new Date().toISOString();

  await database.update(inboxItems).set({
    processingStatus: "pending",
    processingError: null,
    extractionKey: null,
    documentType: null,
    processedAt: null,
    updatedAt,
  }).where(eq(inboxItems.id, id)).run();
}

export async function deleteInboxItem(database: InboxDatabase, id: string) {
  await database.delete(inboxItems).where(eq(inboxItems.id, id)).run();
}
