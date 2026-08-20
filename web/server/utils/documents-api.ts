import { createDocumentsDatabaseView, type DocumentRow, type DocumentsDatabase } from "@khito/shared/documents-database";
import type { DocumentBounds, DocumentExtractionStatus, ExtractedDocumentData } from "@khito/shared/documents";
import type { ExtractableDocumentType } from "@khito/shared/inbox";

type CloudflareEvent = {
  context: unknown;
};

export type DocumentApi = {
  id: string;
  name: string;
  contentType: string;
  documentType: ExtractableDocumentType;
  assignee: string | null;
  data: ExtractedDocumentData;
  bounds: DocumentBounds;
  pageCount: number;
  extractionStatus: DocumentExtractionStatus;
  extractionError: string | null;
  createdAt: string;
  updatedAt: string;
};

export function useDocuments(event: CloudflareEvent): DocumentsDatabase {
  const context = event.context as {
    cloudflare?: {
      env?: Cloudflare.Env;
    };
  };
  const database = context.cloudflare?.env?.DATABASE;

  if (!database) {
    throw createError({ statusCode: 503, statusMessage: "Database is not configured." });
  }

  return createDocumentsDatabaseView(database);
}

export function toDocumentApi(document: DocumentRow): DocumentApi {
  return {
    id: document.id,
    name: document.name,
    contentType: document.contentType,
    documentType: document.documentType,
    assignee: document.assignee,
    data: JSON.parse(document.data) as ExtractedDocumentData,
    bounds: JSON.parse(document.bounds) as DocumentBounds,
    pageCount: document.pageCount,
    extractionStatus: document.extractionStatus,
    extractionError: document.extractionError,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

export function toDocumentListItem(document: DocumentRow) {
  return {
    id: document.id,
    name: document.name,
    documentType: document.documentType,
    assignee: document.assignee,
    extractionStatus: document.extractionStatus,
    extractionError: document.extractionError,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}
