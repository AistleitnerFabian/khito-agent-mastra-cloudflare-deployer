import type { DocumentBounds, DocumentExtractionStatus, ExtractedDocumentData, DocumentDataField } from "@khito/shared/documents";
import type { ExtractableDocumentType } from "@khito/shared/inbox";

export type DocumentDetail = {
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

// Cross-window sync between the document page and its popped-out viewer: all
// document windows share one static channel, so the document id rides inside
// each message, and each window stamps its own source id to ignore its echoes.
export type DocumentViewerSyncMessage = {
  docId: string;
  source: string;
  fieldId: DocumentDataField;
};
