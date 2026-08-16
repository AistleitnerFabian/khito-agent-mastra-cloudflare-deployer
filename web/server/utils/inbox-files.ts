import { createInboxFileKey as createSharedInboxFileKey } from "@khito/shared/inbox";

export type InboxFile = {
  id: string;
  name: string;
  contentType: string;
  size: number;
  processingStatus: "pending" | "processing" | "completed" | "failed";
  uploadedAt: string;
};

export const createInboxFileKey = createSharedInboxFileKey;

export function toInboxFile(item: {
  id: string;
  name: string;
  contentType: string;
  size: number;
  processingStatus: "pending" | "processing" | "completed" | "failed";
  receivedAt: string;
}): InboxFile {
  return {
    id: item.id,
    name: item.name,
    contentType: item.contentType,
    size: item.size,
    processingStatus: item.processingStatus,
    uploadedAt: item.receivedAt,
  };
}
