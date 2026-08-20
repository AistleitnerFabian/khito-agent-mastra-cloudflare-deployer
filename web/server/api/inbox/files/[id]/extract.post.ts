import { toEmptyDocumentData } from "@khito/shared/documents";
import { saveDocument } from "@khito/shared/documents-database";
import { isExtractableDocumentType } from "@khito/shared/inbox";
import { findInboxItem, linkInboxItemDocument } from "@khito/shared/inbox-database";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "An inbox item is required." });
  }

  const database = useDatabase(event);
  const item = await findInboxItem(database, id);
  if (!item) {
    throw createError({ statusCode: 404, statusMessage: "Inbox item not found." });
  }

  if (item.processingStatus !== "completed" || !item.extractionKey) {
    throw createError({ statusCode: 409, statusMessage: "The inbox item has no completed Docling extraction yet." });
  }

  if (!isExtractableDocumentType(item.documentType)) {
    throw createError({ statusCode: 409, statusMessage: "The inbox item is not an extractable document." });
  }

  const document = await saveDocument(useDocuments(event), {
    id: crypto.randomUUID(),
    inboxItemId: item.id,
    name: item.name,
    contentType: item.contentType,
    documentType: item.documentType,
    data: toEmptyDocumentData(),
    bounds: {},
    pageCount: 1,
    extractionStatus: "extracting",
  });

  await linkInboxItemDocument(database, item.id, document.id);
  await dispatchInboxProcessing(event.context.cloudflare.env, { documentId: document.id });

  return { documentId: document.id };
});
