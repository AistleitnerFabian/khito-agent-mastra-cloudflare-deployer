export type InboxProcessingMessage = {
  inboxItemId: string;
};

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
