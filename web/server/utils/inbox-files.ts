export type InboxFile = {
  id: string;
  name: string;
  contentType: string;
  size: number;
  uploadedAt: string;
};

export function createInboxFileKey(name: string) {
  const safeName = name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "upload";

  return `inbox/${crypto.randomUUID()}-${safeName}`;
}

export function toInboxFile(item: {
  id: string;
  name: string;
  contentType: string;
  size: number;
  receivedAt: string;
}): InboxFile {
  return {
    id: item.id,
    name: item.name,
    contentType: item.contentType,
    size: item.size,
    uploadedAt: item.receivedAt,
  };
}
