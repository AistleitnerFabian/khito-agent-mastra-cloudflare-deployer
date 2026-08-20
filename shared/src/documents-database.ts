import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { extractableDocumentTypes, type ExtractableDocumentType } from "./inbox";
import { documentExtractionStatuses, type DocumentBounds, type DocumentExtractionStatus, type ExtractedDocumentData } from "./documents";

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  inboxItemId: text("inbox_item_id").notNull(),
  name: text("name").notNull(),
  contentType: text("content_type").notNull(),
  documentType: text("document_type", { enum: extractableDocumentTypes }).notNull(),
  assignee: text("assignee"),
  data: text("data").notNull(),
  bounds: text("bounds").notNull(),
  pageCount: integer("page_count").notNull().default(1),
  extractionStatus: text("extraction_status", { enum: documentExtractionStatuses }).notNull().default("ready"),
  extractionError: text("extraction_error"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, table => [
  uniqueIndex("documents_inbox_item_id_unique").on(table.inboxItemId),
  index("documents_created_at_idx").on(table.createdAt),
]);

export function createDocumentsDatabaseView(binding: D1Database) {
  return drizzle(binding, { schema: { documents } });
}

export type DocumentsDatabase = ReturnType<typeof createDocumentsDatabaseView>;
export type DocumentRow = typeof documents.$inferSelect;
type NewDocumentRow = typeof documents.$inferInsert;
type DocumentChanges = Pick<DocumentRow, "name" | "documentType" | "data" | "bounds" | "pageCount" | "extractionStatus" | "extractionError">;

export function listDocuments(database: DocumentsDatabase) {
  return database.select().from(documents).orderBy(desc(documents.createdAt)).all();
}

export function findDocument(database: DocumentsDatabase, id: string) {
  return database.select().from(documents).where(eq(documents.id, id)).get();
}

export function findDocumentByInboxItemId(database: DocumentsDatabase, inboxItemId: string) {
  return database.select().from(documents).where(eq(documents.inboxItemId, inboxItemId)).get();
}

export async function saveDocument(database: DocumentsDatabase, document: {
  id: string;
  inboxItemId: string;
  name: string;
  contentType: string;
  documentType: ExtractableDocumentType;
  data: ExtractedDocumentData;
  bounds: DocumentBounds;
  pageCount: number;
  extractionStatus: DocumentExtractionStatus;
}) {
  const now = new Date().toISOString();
  const existing = await findDocumentByInboxItemId(database, document.inboxItemId);

  if (existing) {
    const changes: DocumentChanges = {
      name: document.name,
      documentType: document.documentType,
      data: JSON.stringify(document.data),
      bounds: JSON.stringify(document.bounds),
      pageCount: document.pageCount,
      extractionStatus: document.extractionStatus,
      extractionError: null,
    };

    await database.update(documents).set({ ...changes, updatedAt: now }).where(eq(documents.id, existing.id)).run();
    return { ...existing, ...changes, updatedAt: now };
  }

  const row: NewDocumentRow = {
    ...document,
    data: JSON.stringify(document.data),
    bounds: JSON.stringify(document.bounds),
    createdAt: now,
    updatedAt: now,
  };

  await database.insert(documents).values(row).run();
  return row;
}

export async function updateDocument(database: DocumentsDatabase, id: string, changes: { assignee?: string | null; data?: ExtractedDocumentData }) {
  const updatedAt = new Date().toISOString();

  await database.update(documents).set({
    ...(changes.assignee !== undefined ? { assignee: changes.assignee } : {}),
    ...(changes.data ? { data: JSON.stringify(changes.data) } : {}),
    updatedAt,
  }).where(eq(documents.id, id)).run();
}

export async function completeDocumentExtraction(database: DocumentsDatabase, id: string, data: ExtractedDocumentData, bounds: DocumentBounds, pageCount: number) {
  const updatedAt = new Date().toISOString();

  await database.update(documents).set({
    data: JSON.stringify(data),
    bounds: JSON.stringify(bounds),
    pageCount,
    extractionStatus: "ready",
    extractionError: null,
    updatedAt,
  }).where(eq(documents.id, id)).run();
}

export async function failDocumentExtraction(database: DocumentsDatabase, id: string, error: string) {
  const updatedAt = new Date().toISOString();

  await database.update(documents).set({
    extractionStatus: "failed",
    extractionError: error,
    updatedAt,
  }).where(eq(documents.id, id)).run();
}
