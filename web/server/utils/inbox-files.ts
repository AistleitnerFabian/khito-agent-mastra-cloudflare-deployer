import { createInboxFileKey as createSharedInboxFileKey, type DocumentType } from "@khito/shared/inbox";

export type InboxFile = {
  id: string;
  name: string;
  contentType: string;
  size: number;
  documentType: DocumentType | null;
  processingStatus: "pending" | "processing" | "completed" | "failed";
  uploadedAt: string;
};

export const createInboxFileKey = createSharedInboxFileKey;

export function toInboxFile(item: {
  id: string;
  name: string;
  contentType: string;
  size: number;
  documentType: DocumentType | null;
  processingStatus: "pending" | "processing" | "completed" | "failed";
  receivedAt: string;
}): InboxFile {
  return {
    id: item.id,
    name: item.name,
    contentType: item.contentType,
    size: item.size,
    documentType: item.documentType,
    processingStatus: item.processingStatus,
    uploadedAt: item.receivedAt,
  };
}
