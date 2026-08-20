import { findDocument } from "@khito/shared/documents-database";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "A document is required." });
  }

  const document = await findDocument(useDocuments(event), id);
  if (!document) {
    throw createError({ statusCode: 404, statusMessage: "Document not found." });
  }

  return toDocumentApi(document);
});
