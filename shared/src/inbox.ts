export type InboxProcessingMessage =
  | { inboxItemId: string }
  | { documentId: string };

export const documentTypes = ["order", "quotation", "invoice", "other"] as const;

export type DocumentType = (typeof documentTypes)[number];

export const extractableDocumentTypes = ["order", "quotation", "invoice"] as const satisfies readonly DocumentType[];

export type ExtractableDocumentType = (typeof extractableDocumentTypes)[number];

const documentTypeValues = new Set<string>(documentTypes);

export function isDocumentType(value: unknown): value is DocumentType {
  return typeof value === "string" && documentTypeValues.has(value);
}

export function isExtractableDocumentType(documentType: DocumentType | null): documentType is ExtractableDocumentType {
  return documentType !== null && documentType !== "other";
}

export function createInboxFileKey(name: string) {
  const safeName = name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "upload";

  return `inbox/${crypto.randomUUID()}-${safeName}`;
}

export function createInboxExtractionKey(inboxItemId: string) {
  return `inbox/${inboxItemId}/docling.json`;
}
