import { findDocument } from "@khito/shared/documents-database";
import { findInboxItem } from "@khito/shared/inbox-database";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "A document is required." });
  }

  const document = await findDocument(useDocuments(event), id);
  if (!document) {
    throw createError({ statusCode: 404, statusMessage: "Document not found." });
  }

  const item = await findInboxItem(useDatabase(event), document.inboxItemId);
  if (!item) {
    throw createError({ statusCode: 404, statusMessage: "The source file could not be found." });
  }

  const source = await useR2(event).get(item.sourceKey);
  if (!source) {
    throw createError({ statusCode: 404, statusMessage: "The source file could not be loaded." });
  }

  return new Response(await source.arrayBuffer(), {
    headers: {
      "content-type": document.contentType,
      "content-disposition": `inline; filename="${encodeURIComponent(document.name)}"`,
    },
  });
});
