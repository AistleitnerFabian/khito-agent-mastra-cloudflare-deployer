import type { DocumentBounds, DocumentExtractionStatus, ExtractedDocumentData } from "@khito/shared/documents";
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
